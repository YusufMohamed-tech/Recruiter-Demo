-- Job Postings, Application Form Versions, Sourcing Channels

CREATE TABLE job_postings (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requisition_id      uuid REFERENCES job_requisitions(id),
  slug                text UNIQUE NOT NULL,
  title_en            text NOT NULL,
  title_ar            text,
  summary_en          text,
  summary_ar          text,
  description_en      text,
  description_ar      text,
  requirements_en     text,
  requirements_ar     text,
  department_id       uuid REFERENCES departments(id),
  establishment_id    uuid REFERENCES establishments(id),
  city                text,
  employment_type     text NOT NULL DEFAULT 'full_time',
  nationality_req     text,
  min_experience_years int,
  education_level     text,
  salary_visible      boolean NOT NULL DEFAULT false,
  salary_min          numeric(12,2),
  salary_max          numeric(12,2),
  application_form_id uuid,
  deadline            date,
  status              text NOT NULL DEFAULT 'draft',
  published_at        timestamptz,
  closed_at           timestamptz,
  seo_title           text,
  seo_description     text,
  created_by          uuid NOT NULL REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE application_form_versions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_posting_id  uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  version         int NOT NULL DEFAULT 1,
  schema_json     jsonb NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sourcing_channels (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  type            text NOT NULL DEFAULT 'other',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_postings_org ON job_postings(org_id);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_search ON job_postings USING gin (
  (COALESCE(title_ar,'') || ' ' || COALESCE(title_en,'') || ' ' || COALESCE(summary_ar,'') || ' ' || COALESCE(summary_en,''))
  gin_trgm_ops
);
