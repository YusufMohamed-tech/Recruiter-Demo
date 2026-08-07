-- PostgreSQL Functions: Approval State Machine, SERE Score, Search

-- ===== APPROVAL STATE MACHINE =====
CREATE OR REPLACE FUNCTION advance_approval(
  p_approval_request_id uuid,
  p_step_id uuid,
  p_decision text,
  p_comments text,
  p_actor_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_step    approval_steps%ROWTYPE;
  v_request approval_requests%ROWTYPE;
  v_next    approval_steps%ROWTYPE;
BEGIN
  SELECT * INTO v_step    FROM approval_steps    WHERE id = p_step_id;
  SELECT * INTO v_request FROM approval_requests WHERE id = p_approval_request_id;

  UPDATE approval_steps
  SET decision = p_decision, decided_at = now(), status = 'completed'
  WHERE id = p_step_id;

  IF p_decision IN ('rejected', 'changes_requested') THEN
    UPDATE approval_requests
    SET status = p_decision, completed_at = now()
    WHERE id = p_approval_request_id;

    PERFORM pg_notify('approval_decided', json_build_object(
      'request_id', p_approval_request_id,
      'resource_type', v_request.resource_type,
      'resource_id', v_request.resource_id,
      'decision', p_decision
    )::text);

    RETURN jsonb_build_object('outcome', p_decision);
  END IF;

  SELECT * INTO v_next FROM approval_steps
  WHERE approval_request_id = p_approval_request_id
    AND step_order > v_step.step_order
    AND status = 'pending'
  ORDER BY step_order LIMIT 1;

  IF v_next IS NULL THEN
    UPDATE approval_requests
    SET status = 'approved', completed_at = now()
    WHERE id = p_approval_request_id;

    PERFORM pg_notify('approval_decided', json_build_object(
      'request_id', p_approval_request_id,
      'resource_type', v_request.resource_type,
      'resource_id', v_request.resource_id,
      'decision', 'approved'
    )::text);

    RETURN jsonb_build_object('outcome', 'approved');
  ELSE
    UPDATE approval_steps SET status = 'active' WHERE id = v_next.id;

    PERFORM pg_notify('approval_step_active', json_build_object(
      'step_id', v_next.id,
      'approver_id', v_next.approver_id
    )::text);

    RETURN jsonb_build_object('outcome', 'next_step', 'step_id', v_next.id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== SERE SCORE CALCULATION =====
CREATE OR REPLACE FUNCTION recalculate_sere_score(p_case_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_items   RECORD;
  v_total   numeric := 0;
  v_blockers jsonb := '[]'::jsonb;
  v_weights jsonb := '{
    "compliance_readiness": 0.25,
    "contract_readiness":   0.20,
    "government_process":   0.20,
    "payroll_gosi":         0.15,
    "candidate_docs":       0.10,
    "internal_onboarding":  0.10
  }'::jsonb;
BEGIN
  FOR v_items IN (
    SELECT
      item_type AS category,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status IN ('completed', 'waived')) AS done,
      jsonb_agg(
        CASE WHEN mandatory AND status NOT IN ('completed', 'waived')
          THEN jsonb_build_object('item_type', item_type, 'label_en', label_en)
          ELSE NULL END
      ) FILTER (WHERE mandatory AND status NOT IN ('completed', 'waived')) AS category_blockers
    FROM readiness_checklist_items
    WHERE readiness_case_id = p_case_id
    GROUP BY item_type
  ) LOOP
    IF v_weights ? v_items.category THEN
      v_total := v_total +
        (v_weights ->> v_items.category)::numeric * 100
        * (v_items.done::numeric / GREATEST(v_items.total, 1));
    END IF;

    IF v_items.category_blockers IS NOT NULL THEN
      v_blockers := v_blockers || v_items.category_blockers;
    END IF;
  END LOOP;

  UPDATE employment_readiness_cases
  SET readiness_score = ROUND(v_total), mandatory_blockers = v_blockers, updated_at = now()
  WHERE id = p_case_id;

  RETURN jsonb_build_object(
    'score',   ROUND(v_total),
    'blocked', jsonb_array_length(v_blockers) > 0,
    'blockers', v_blockers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== JOB SEARCH =====
CREATE OR REPLACE FUNCTION search_jobs(query text, p_limit int DEFAULT 25)
RETURNS SETOF job_postings AS $$
  SELECT * FROM job_postings
  WHERE status = 'published'
    AND (
      title_ar  ILIKE '%' || query || '%' OR
      title_en  ILIKE '%' || query || '%' OR
      summary_ar ILIKE '%' || query || '%' OR
      summary_en ILIKE '%' || query || '%'
    )
  ORDER BY similarity(COALESCE(title_en,'') || ' ' || COALESCE(title_ar,''), query) DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ===== AUTO-UPDATE updated_at TRIGGER =====
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','establishments','departments','job_requisitions',
    'job_postings','candidates','job_applications','offers',
    'employment_readiness_cases','readiness_checklist_items',
    'government_cases','qiwa_contract_cases','users',
    'compliance_rules','approval_workflows','approval_requests'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
    );
  END LOOP;
END $$;

-- ===== SLA REMINDER CRON (pg_cron) =====
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'check-approval-sla',
  '0 * * * *',
  $$
    INSERT INTO notifications (org_id, recipient_id, type, title_en, title_ar, resource_type, resource_id)
    SELECT
      ar.org_id,
      s.approver_id,
      'sla_reminder',
      'Approval pending — SLA at risk',
      'موافقة معلقة — خطر تجاوز المهلة',
      ar.resource_type,
      ar.resource_id
    FROM approval_steps s
    JOIN approval_requests ar ON ar.id = s.approval_request_id
    WHERE s.status = 'active'
      AND s.decided_at IS NULL
      AND s.reminder_sent_at IS NULL
      AND now() - ar.submitted_at > (s.sla_hours * interval '1 hour' * 0.75);
  $$
);

-- ===== REFRESH ANALYTICS VIEWS =====
SELECT cron.schedule(
  'refresh-analytics',
  '30 * * * *',
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_funnel;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_source_analytics;
  $$
);
