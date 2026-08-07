-- RLS policies for SaaS model

ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Seekers can read/write their own profile
CREATE POLICY "seeker_own_profile" ON seeker_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "seeker_own_experiences" ON seeker_experiences
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

CREATE POLICY "seeker_own_education" ON seeker_education
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

CREATE POLICY "seeker_own_certifications" ON seeker_certifications
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

-- Seekers can manage their own applications
CREATE POLICY "seeker_own_applications" ON seeker_applications
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

-- Companies can view applications to their jobs
CREATE POLICY "company_view_applications" ON seeker_applications
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Companies can update application status
CREATE POLICY "company_update_applications" ON seeker_applications
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Companies can view seeker profiles of applicants or public profiles
CREATE POLICY "company_view_applicant_profiles" ON seeker_profiles
  FOR SELECT USING (
    is_public = true
    OR id IN (
      SELECT seeker_id FROM seeker_applications
      WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- Companies can view experiences/education of visible seekers
CREATE POLICY "company_view_seeker_experiences" ON seeker_experiences
  FOR SELECT USING (
    seeker_id IN (
      SELECT sp.id FROM seeker_profiles sp
      WHERE sp.is_public = true
      OR sp.id IN (
        SELECT seeker_id FROM seeker_applications
        WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "company_view_seeker_education" ON seeker_education
  FOR SELECT USING (
    seeker_id IN (
      SELECT sp.id FROM seeker_profiles sp
      WHERE sp.is_public = true
      OR sp.id IN (
        SELECT seeker_id FROM seeker_applications
        WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "company_view_seeker_certifications" ON seeker_certifications
  FOR SELECT USING (
    seeker_id IN (
      SELECT sp.id FROM seeker_profiles sp
      WHERE sp.is_public = true
      OR sp.id IN (
        SELECT seeker_id FROM seeker_applications
        WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Public company profiles readable by all authenticated users
CREATE POLICY "public_company_profiles_read" ON company_profiles
  FOR SELECT USING (true);

-- Company can edit own profile
CREATE POLICY "company_own_profile" ON company_profiles
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Saved jobs
CREATE POLICY "seeker_own_saved_jobs" ON seeker_saved_jobs
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

-- Company invitations: org members can manage
CREATE POLICY "company_manage_invitations" ON company_invitations
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Anyone can read their own invitation by token (handled at API level with service role)
