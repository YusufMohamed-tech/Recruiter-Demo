CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Make uuid_generate_v4() available without schema prefix
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS uuid LANGUAGE sql AS $$
  SELECT extensions.uuid_generate_v4()
$$;

-- Make gen_random_bytes available without schema prefix
CREATE OR REPLACE FUNCTION public.gen_random_bytes(int)
RETURNS bytea LANGUAGE sql AS $$
  SELECT extensions.gen_random_bytes($1)
$$;
