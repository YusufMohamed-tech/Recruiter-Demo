-- Fix: users can't read their own row because the RLS policy
-- uses auth_org_id() which queries the users table itself (circular).
-- Add a policy that lets users always read their own row by auth.uid().

DROP POLICY IF EXISTS "users_tenant" ON users;

-- Users can always read their own row
CREATE POLICY "users_read_self" ON users
  FOR SELECT USING (id = auth.uid());

-- Users can read other members of their org
CREATE POLICY "users_read_org" ON users
  FOR SELECT USING (org_id = auth_org_id());

-- Manage policy stays as-is (requires user.manage permission)
