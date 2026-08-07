-- RLS Policies for Employment Readiness Tables

ALTER TABLE employment_readiness_cases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_checklist_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE joining_confirmations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_cases               ENABLE ROW LEVEL SECURITY;
ALTER TABLE qiwa_contract_cases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_discrepancies         ENABLE ROW LEVEL SECURITY;

-- employment_readiness_cases
CREATE POLICY "readiness_cases_select" ON employment_readiness_cases
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "readiness_cases_insert" ON employment_readiness_cases
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "readiness_cases_update" ON employment_readiness_cases
  FOR UPDATE USING (org_id = auth_org_id());
CREATE POLICY "readiness_cases_delete" ON employment_readiness_cases
  FOR DELETE USING (org_id = auth_org_id() AND has_permission('manage_readiness'));

-- readiness_checklist_items (via FK to case)
CREATE POLICY "checklist_select" ON readiness_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );
CREATE POLICY "checklist_insert" ON readiness_checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );
CREATE POLICY "checklist_update" ON readiness_checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );
CREATE POLICY "checklist_delete" ON readiness_checklist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );

-- joining_confirmations (via FK to case)
CREATE POLICY "joining_select" ON joining_confirmations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );
CREATE POLICY "joining_insert" ON joining_confirmations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );
CREATE POLICY "joining_update" ON joining_confirmations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employment_readiness_cases c
      WHERE c.id = readiness_case_id AND c.org_id = auth_org_id()
    )
  );

-- government_cases
CREATE POLICY "gov_cases_select" ON government_cases
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "gov_cases_insert" ON government_cases
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "gov_cases_update" ON government_cases
  FOR UPDATE USING (org_id = auth_org_id());
CREATE POLICY "gov_cases_delete" ON government_cases
  FOR DELETE USING (org_id = auth_org_id());

-- qiwa_contract_cases (via FK to government_cases)
CREATE POLICY "qiwa_select" ON qiwa_contract_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM government_cases g
      WHERE g.id = government_case_id AND g.org_id = auth_org_id()
    )
  );
CREATE POLICY "qiwa_insert" ON qiwa_contract_cases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM government_cases g
      WHERE g.id = government_case_id AND g.org_id = auth_org_id()
    )
  );
CREATE POLICY "qiwa_update" ON qiwa_contract_cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM government_cases g
      WHERE g.id = government_case_id AND g.org_id = auth_org_id()
    )
  );

-- contract_discrepancies (via FK chain to qiwa -> government_cases)
CREATE POLICY "discrepancies_select" ON contract_discrepancies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qiwa_contract_cases q
      JOIN government_cases g ON g.id = q.government_case_id
      WHERE q.id = qiwa_case_id AND g.org_id = auth_org_id()
    )
  );
CREATE POLICY "discrepancies_insert" ON contract_discrepancies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM qiwa_contract_cases q
      JOIN government_cases g ON g.id = q.government_case_id
      WHERE q.id = qiwa_case_id AND g.org_id = auth_org_id()
    )
  );
CREATE POLICY "discrepancies_update" ON contract_discrepancies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM qiwa_contract_cases q
      JOIN government_cases g ON g.id = q.government_case_id
      WHERE q.id = qiwa_case_id AND g.org_id = auth_org_id()
    )
  );
