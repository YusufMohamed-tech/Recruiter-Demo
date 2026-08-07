-- Candidates and Sensitive Profiles

CREATE TABLE candidates (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name_en                 text NOT NULL,
  name_ar                 text,
  email                   text NOT NULL,
  phone                   text,
  current_city            text,
  nationality             text,
  gender                  text,
  education_level         text,
  total_experience_years  numeric(4,1),
  current_title           text,
  linkedin_url            text,
  cv_file_id              uuid,
  source_channel_id       uuid REFERENCES sourcing_channels(id),
  source_utm              jsonb,
  parsed_profile          jsonb,
  tags                    text[] DEFAULT '{}',
  is_duplicate            boolean NOT NULL DEFAULT false,
  merged_into_id          uuid REFERENCES candidates(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, email)
);

CREATE TABLE candidate_sensitive_profiles (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE UNIQUE,
  national_id         bytea,
  iqama_number        bytea,
  passport_number     bytea,
  date_of_birth       date,
  iqama_expiry        date,
  passport_expiry     date,
  visa_type           text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  storage_key     text NOT NULL UNIQUE,
  bucket          text NOT NULL,
  original_name   text NOT NULL,
  content_type    text NOT NULL,
  size_bytes      bigint NOT NULL,
  sha256          text,
  malware_status  text NOT NULL DEFAULT 'clean',
  purpose         text NOT NULL,
  uploaded_by     uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_org ON candidates(org_id);
CREATE INDEX idx_candidates_email ON candidates(org_id, email);
CREATE INDEX idx_candidates_name ON candidates USING gin (
  (COALESCE(name_en,'') || ' ' || COALESCE(name_ar,''))
  gin_trgm_ops
);
