-- Employment Readiness Cases, Checklists, Joining Confirmations

CREATE TABLE employment_readiness_cases (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id      uuid NOT NULL REFERENCES job_applications(id) UNIQUE,
  candidate_id        uuid NOT NULL REFERENCES candidates(id),
  offer_id            uuid REFERENCES offers(id),
  branch_type         text NOT NULL DEFAULT 'saudi',
  status              text NOT NULL DEFAULT 'open',
  readiness_score     int NOT NULL DEFAULT 0,
  mandatory_blockers  jsonb DEFAULT '[]',
  target_join_date    date,
  actual_join_date    date,
  assigned_to         uuid REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE readiness_checklist_items (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  readiness_case_id       uuid NOT NULL REFERENCES employment_readiness_cases(id) ON DELETE CASCADE,
  item_type               text NOT NULL,
  label_en                text NOT NULL,
  label_ar                text,
  mandatory               boolean NOT NULL DEFAULT true,
  status                  text NOT NULL DEFAULT 'pending',
  owner_id                uuid REFERENCES users(id),
  evidence_file_id        uuid REFERENCES files(id),
  notes                   text,
  due_date                date,
  completed_at            timestamptz,
  waived_by               uuid REFERENCES users(id),
  waive_reason            text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE joining_confirmations (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  readiness_case_id       uuid NOT NULL REFERENCES employment_readiness_cases(id) UNIQUE,
  confirmed_by            uuid NOT NULL REFERENCES users(id),
  identity_verified       boolean NOT NULL DEFAULT false,
  attendance_confirmed    boolean NOT NULL DEFAULT false,
  documents_received      boolean NOT NULL DEFAULT false,
  notes                   text,
  no_show                 boolean NOT NULL DEFAULT false,
  no_show_reason          text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_readiness_org ON employment_readiness_cases(org_id);
CREATE INDEX idx_readiness_candidate ON employment_readiness_cases(candidate_id);
CREATE INDEX idx_checklist_case ON readiness_checklist_items(readiness_case_id);
