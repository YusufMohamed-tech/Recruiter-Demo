-- Row-Level Security Policies

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS uuid AS $$
  SELECT org_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: check permission
CREATE OR REPLACE FUNCTION has_permission(p text) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND rp.permission = p
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ===== ORGANIZATIONS =====
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_tenant" ON organizations FOR ALL
  USING (id = auth_org_id());

-- ===== ESTABLISHMENTS =====
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estab_tenant" ON establishments FOR ALL
  USING (org_id = auth_org_id());

-- ===== DEPARTMENTS =====
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dept_tenant" ON departments FOR ALL
  USING (org_id = auth_org_id());

-- ===== USERS =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_tenant" ON users FOR SELECT
  USING (org_id = auth_org_id());
CREATE POLICY "users_manage" ON users FOR ALL
  USING (org_id = auth_org_id() AND has_permission('user.manage'));

-- ===== ROLES & PERMISSIONS =====
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_tenant" ON roles FOR ALL
  USING (org_id = auth_org_id());

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_perms_tenant" ON role_permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.org_id = auth_org_id()));

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_tenant" ON user_roles FOR ALL
  USING (org_id = auth_org_id());

-- ===== REQUISITIONS =====
ALTER TABLE job_requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "req_tenant" ON job_requisitions FOR ALL
  USING (org_id = auth_org_id());

-- ===== COMPLIANCE =====
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules_tenant" ON compliance_rules FOR ALL
  USING (org_id = auth_org_id());

ALTER TABLE compliance_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evals_tenant" ON compliance_evaluations FOR ALL
  USING (org_id = auth_org_id());

ALTER TABLE compliance_evaluation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_items_tenant" ON compliance_evaluation_items FOR ALL
  USING (EXISTS (SELECT 1 FROM compliance_evaluations ce WHERE ce.id = evaluation_id AND ce.org_id = auth_org_id()));

-- ===== JOB POSTINGS =====
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_tenant" ON job_postings FOR ALL
  USING (org_id = auth_org_id());
CREATE POLICY "jobs_public_read" ON job_postings FOR SELECT
  USING (status = 'published');

-- ===== CANDIDATES =====
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidates_tenant" ON candidates FOR ALL
  USING (org_id = auth_org_id());

ALTER TABLE candidate_sensitive_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sensitive_access" ON candidate_sensitive_profiles FOR SELECT
  USING (has_permission('candidate.view_sensitive'));
CREATE POLICY "sensitive_write" ON candidate_sensitive_profiles FOR INSERT
  WITH CHECK (has_permission('candidate.view_sensitive'));

-- ===== APPLICATIONS =====
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps_tenant" ON job_applications FOR ALL
  USING (org_id = auth_org_id());

-- ===== OFFERS =====
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_tenant" ON offers FOR ALL
  USING (org_id = auth_org_id());

ALTER TABLE offer_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer_versions_tenant" ON offer_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM offers o WHERE o.id = offer_id AND o.org_id = auth_org_id()));

-- ===== READINESS =====
ALTER TABLE employment_readiness_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "readiness_tenant" ON employment_readiness_cases FOR ALL
  USING (org_id = auth_org_id());

ALTER TABLE readiness_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_tenant" ON readiness_checklist_items FOR ALL
  USING (EXISTS (SELECT 1 FROM employment_readiness_cases rc WHERE rc.id = readiness_case_id AND rc.org_id = auth_org_id()));

-- ===== NOTIFICATIONS =====
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifs_own" ON notifications FOR ALL
  USING (recipient_id = auth.uid());

-- ===== AUDIT =====
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert_only" ON audit_events FOR INSERT
  WITH CHECK (org_id = auth_org_id());
CREATE POLICY "audit_no_update" ON audit_events FOR UPDATE
  USING (false);
CREATE POLICY "audit_no_delete" ON audit_events FOR DELETE
  USING (false);
CREATE POLICY "audit_select" ON audit_events FOR SELECT
  USING (org_id = auth_org_id() AND has_permission('audit.view'));

-- ===== FILES =====
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_tenant" ON files FOR ALL
  USING (org_id = auth_org_id() OR org_id IS NULL);
