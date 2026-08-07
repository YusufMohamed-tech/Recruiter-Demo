-- RLS for communications tables + privacy_requests table

-- ── communications ────────────────────────────────────────────
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comms_select" ON communications
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "comms_insert" ON communications
  FOR INSERT WITH CHECK (org_id = auth_org_id());

-- ── communication_template_versions ───────────────────────────
ALTER TABLE communication_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctv_select" ON communication_template_versions
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "ctv_insert" ON communication_template_versions
  FOR INSERT WITH CHECK (org_id = auth_org_id() AND has_permission('manage_settings'));
CREATE POLICY "ctv_update" ON communication_template_versions
  FOR UPDATE USING (org_id = auth_org_id() AND has_permission('manage_settings'));

-- ── privacy_requests table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_requests (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id    uuid REFERENCES candidates(id),
  request_type    text NOT NULL,   -- access, erasure, rectification, portability, objection
  requester_name  text NOT NULL,
  requester_email text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'open',  -- open, in_review, completed, rejected
  handled_by      uuid REFERENCES users(id),
  handled_at      timestamptz,
  resolution_notes text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_privacy_requests_org ON privacy_requests(org_id);
CREATE INDEX idx_privacy_requests_status ON privacy_requests(org_id, status);

ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "privacy_select" ON privacy_requests
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "privacy_insert" ON privacy_requests
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "privacy_update" ON privacy_requests
  FOR UPDATE USING (org_id = auth_org_id());

-- updated_at trigger for privacy_requests
CREATE TRIGGER trg_privacy_requests_updated_at
  BEFORE UPDATE ON privacy_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
