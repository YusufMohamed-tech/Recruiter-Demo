-- Allow seeker_profiles to have user_id values that don't reference auth.users
-- This is needed for demo/seed data where we create mock seeker profiles
-- without corresponding auth accounts.

ALTER TABLE seeker_profiles DROP CONSTRAINT IF EXISTS seeker_profiles_user_id_fkey;
ALTER TABLE seeker_profiles ALTER COLUMN user_id DROP NOT NULL;
