-- Job Requisitions and Versioning

CREATE TABLE job_requisitions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref_number          text UNIQUE NOT NULL,
  title_en            text NOT NULL,
  title_ar            text,
  department_id       uuid REFERENCES departments(id),
  establishment_id    uuid REFERENCES establishments(id),
  cost_center_id      uuid REFERENCES cost_centers(id),
  headcount           int NOT NULL DEFAULT 1,
  employment_type     text NOT NULL DEFAULT 'full_time',
  nationality_pref    text,
  min_experience_years int,
  education_level     text,
  salary_min          numeric(12,2),
  salary_max          numeric(12,2),
  budget_approved     boolean NOT NULL DEFAULT false,
  justification_ar    text,
  justification_en    text,
  target_hire_date    date,
  status              text NOT NULL DEFAULT 'draft',
  version             int NOT NULL DEFAULT 1,
  created_by          uuid NOT NULL REFERENCES users(id),
  updated_by          uuid REFERENCES users(id),
  submitted_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE requisition_versions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_id      uuid NOT NULL REFERENCES job_requisitions(id) ON DELETE CASCADE,
  version             int NOT NULL,
  snapshot            jsonb NOT NULL,
  changed_by          uuid NOT NULL REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_requisitions_org ON job_requisitions(org_id);
CREATE INDEX idx_requisitions_status ON job_requisitions(status);
CREATE INDEX idx_requisitions_dept ON job_requisitions(department_id);
