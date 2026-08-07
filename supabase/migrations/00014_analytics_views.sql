-- Materialized Views for Analytics Dashboards

CREATE MATERIALIZED VIEW mv_pipeline_funnel AS
SELECT
  jp.org_id,
  jp.id AS job_posting_id,
  jp.title_en,
  COUNT(ja.id) AS total_applications,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'applied')        AS stage_applied,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'screening')      AS stage_screening,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'interview')      AS stage_interview,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'assessment')     AS stage_assessment,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'offer')          AS stage_offer,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'hired')          AS stage_hired,
  COUNT(ja.id) FILTER (WHERE ja.status = 'rejected')              AS total_rejected,
  AVG(EXTRACT(EPOCH FROM (ja.updated_at - ja.created_at))/86400)  AS avg_days_in_pipeline
FROM job_postings jp
LEFT JOIN job_applications ja ON ja.job_posting_id = jp.id
GROUP BY jp.org_id, jp.id, jp.title_en;

CREATE UNIQUE INDEX ON mv_pipeline_funnel(org_id, job_posting_id);

CREATE MATERIALIZED VIEW mv_source_analytics AS
SELECT
  ja.org_id,
  sc.name AS channel_name,
  sc.type AS channel_type,
  COUNT(ja.id) AS applications,
  COUNT(ja.id) FILTER (WHERE ja.current_stage = 'hired') AS hires,
  ROUND(COUNT(ja.id) FILTER (WHERE ja.current_stage = 'hired')::numeric /
    NULLIF(COUNT(ja.id), 0) * 100, 2) AS conversion_rate
FROM job_applications ja
LEFT JOIN sourcing_channels sc ON sc.id = ja.source_channel_id
GROUP BY ja.org_id, sc.name, sc.type;

CREATE UNIQUE INDEX ON mv_source_analytics(org_id, channel_name);

CREATE MATERIALIZED VIEW mv_time_to_fill AS
SELECT
  jp.org_id,
  jp.department_id,
  jp.employment_type,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (jp.closed_at - jp.published_at))/86400
  ) AS median_days,
  PERCENTILE_CONT(0.75) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (jp.closed_at - jp.published_at))/86400
  ) AS p75_days,
  COUNT(*) AS sample_size
FROM job_postings jp
WHERE jp.status = 'closed' AND jp.closed_at IS NOT NULL AND jp.published_at IS NOT NULL
GROUP BY jp.org_id, jp.department_id, jp.employment_type;
