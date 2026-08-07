-- RLS for interview tables
ALTER TABLE interview_panels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_interviewers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scorecards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments             ENABLE ROW LEVEL SECURITY;

-- interview_panels: org isolation
CREATE POLICY ip_org ON interview_panels
  USING (org_id = auth_org_id());

CREATE POLICY ip_org_insert ON interview_panels FOR INSERT
  WITH CHECK (org_id = auth_org_id());

-- interview_interviewers: access via panel
CREATE POLICY ii_panel ON interview_interviewers
  USING (EXISTS (
    SELECT 1 FROM interview_panels p
    WHERE p.id = interview_id AND p.org_id = auth_org_id()
  ));

CREATE POLICY ii_panel_insert ON interview_interviewers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_panels p
    WHERE p.id = interview_id AND p.org_id = auth_org_id()
  ));

-- scorecard_templates: org isolation
CREATE POLICY st_org ON scorecard_templates
  USING (org_id = auth_org_id());

CREATE POLICY st_org_insert ON scorecard_templates FOR INSERT
  WITH CHECK (org_id = auth_org_id());

-- interview_scorecards: access via interview panel
CREATE POLICY isc_panel ON interview_scorecards
  USING (EXISTS (
    SELECT 1 FROM interview_panels p
    WHERE p.id = interview_id AND p.org_id = auth_org_id()
  ));

CREATE POLICY isc_panel_insert ON interview_scorecards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_panels p
    WHERE p.id = interview_id AND p.org_id = auth_org_id()
  ));

CREATE POLICY isc_panel_update ON interview_scorecards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interview_panels p
    WHERE p.id = interview_id AND p.org_id = auth_org_id()
  ));

-- assessments: org isolation
CREATE POLICY asmnt_org ON assessments
  USING (org_id = auth_org_id());

CREATE POLICY asmnt_org_insert ON assessments FOR INSERT
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY asmnt_org_update ON assessments FOR UPDATE
  USING (org_id = auth_org_id());

CREATE POLICY asmnt_org_delete ON assessments FOR DELETE
  USING (org_id = auth_org_id());
