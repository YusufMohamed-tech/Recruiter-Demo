-- Fix infinite recursion in seeker_profiles / seeker_applications RLS policies.
-- The seeker_own_applications policy subqueries seeker_profiles (which triggers its RLS,
-- which subqueries seeker_applications, causing infinite recursion).
-- Solution: use SECURITY DEFINER functions to break the cycle.

CREATE OR REPLACE FUNCTION auth_seeker_profile_id() RETURNS uuid AS $$
  SELECT id FROM seeker_profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "seeker_own_profile" ON seeker_profiles;
DROP POLICY IF EXISTS "company_view_applicant_profiles" ON seeker_profiles;
DROP POLICY IF EXISTS "seeker_own_applications" ON seeker_applications;
DROP POLICY IF EXISTS "seeker_own_experiences" ON seeker_experiences;
DROP POLICY IF EXISTS "seeker_own_education" ON seeker_education;
DROP POLICY IF EXISTS "seeker_own_certifications" ON seeker_certifications;
DROP POLICY IF EXISTS "seeker_own_saved_jobs" ON seeker_saved_jobs;
DROP POLICY IF EXISTS "company_view_seeker_experiences" ON seeker_experiences;
DROP POLICY IF EXISTS "company_view_seeker_education" ON seeker_education;
DROP POLICY IF EXISTS "company_view_seeker_certifications" ON seeker_certifications;

-- Recreate seeker_profiles policies (no subquery to other tables)
CREATE POLICY "seeker_own_profile" ON seeker_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "company_view_applicant_profiles" ON seeker_profiles
  FOR SELECT USING (is_public = true);

-- Recreate seeker_applications using the SECURITY DEFINER function
CREATE POLICY "seeker_own_applications" ON seeker_applications
  FOR ALL USING (seeker_id = auth_seeker_profile_id());

-- Recreate related policies using the function
CREATE POLICY "seeker_own_experiences" ON seeker_experiences
  FOR ALL USING (seeker_id = auth_seeker_profile_id());

CREATE POLICY "seeker_own_education" ON seeker_education
  FOR ALL USING (seeker_id = auth_seeker_profile_id());

CREATE POLICY "seeker_own_certifications" ON seeker_certifications
  FOR ALL USING (seeker_id = auth_seeker_profile_id());

CREATE POLICY "seeker_own_saved_jobs" ON seeker_saved_jobs
  FOR ALL USING (seeker_id = auth_seeker_profile_id());

-- Company view policies simplified (no recursive subquery)
CREATE POLICY "company_view_seeker_experiences" ON seeker_experiences
  FOR SELECT USING (
    seeker_id IN (SELECT id FROM seeker_profiles WHERE is_public = true)
  );

CREATE POLICY "company_view_seeker_education" ON seeker_education
  FOR SELECT USING (
    seeker_id IN (SELECT id FROM seeker_profiles WHERE is_public = true)
  );

CREATE POLICY "company_view_seeker_certifications" ON seeker_certifications
  FOR SELECT USING (
    seeker_id IN (SELECT id FROM seeker_profiles WHERE is_public = true)
  );
