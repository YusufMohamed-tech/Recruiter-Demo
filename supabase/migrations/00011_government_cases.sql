-- Government Cases, Qiwa Contract Cases, Discrepancies

CREATE TABLE government_cases (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  readiness_case_id   uuid NOT NULL REFERENCES employment_readiness_cases(id) ON DELETE CASCADE,
  case_type           text NOT NULL,
  reference_number    text,
  status              text NOT NULL DEFAULT 'pending',
  platform            text NOT NULL,
  submitted_at        timestamptz,
  completed_at        timestamptz,
  notes               text,
  assigned_to         uuid REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE qiwa_contract_cases (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  government_case_id  uuid NOT NULL REFERENCES government_cases(id) ON DELETE CASCADE,
  contract_number     text,
  contract_status     text NOT NULL DEFAULT 'pending',
  submitted_at        timestamptz,
  signed_at           timestamptz,
  qiwa_ref            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contract_discrepancies (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  qiwa_case_id        uuid NOT NULL REFERENCES qiwa_contract_cases(id) ON DELETE CASCADE,
  field_name          text NOT NULL,
  offer_value         text,
  contract_value      text,
  resolved            boolean NOT NULL DEFAULT false,
  resolution_notes    text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gov_cases_org ON government_cases(org_id);
CREATE INDEX idx_gov_cases_readiness ON government_cases(readiness_case_id);
