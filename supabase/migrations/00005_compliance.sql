-- Compliance Rules Engine

CREATE TABLE compliance_rules (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code                text NOT NULL,
  name_ar             text NOT NULL,
  name_en             text NOT NULL,
  description_ar      text,
  description_en      text,
  rule_type           text NOT NULL,
  applies_to          text[] NOT NULL DEFAULT '{}',
  condition_json      jsonb NOT NULL,
  result_if_fail      text NOT NULL DEFAULT 'BLOCKED',
  source_url          text,
  source_publication_date date,
  effective_from      date NOT NULL,
  effective_until     date,
  review_due_at       date,
  status              text NOT NULL DEFAULT 'active',
  version             int NOT NULL DEFAULT 1,
  created_by          uuid NOT NULL REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, code)
);

CREATE TABLE compliance_evaluations (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type         text NOT NULL,
  resource_id           uuid NOT NULL,
  ruleset_snapshot      jsonb NOT NULL,
  overall_result        text NOT NULL,
  input_snapshot_json   jsonb NOT NULL,
  result_summary_json   jsonb,
  stale_rules_count     int NOT NULL DEFAULT 0,
  evaluated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE compliance_evaluation_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id   uuid NOT NULL REFERENCES compliance_evaluations(id) ON DELETE CASCADE,
  rule_id         uuid REFERENCES compliance_rules(id),
  rule_code       text NOT NULL,
  result          text NOT NULL,
  message_en      text,
  message_ar      text,
  evidence        jsonb
);

CREATE TABLE compliance_overrides (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evaluation_id   uuid NOT NULL REFERENCES compliance_evaluations(id),
  rule_id         uuid NOT NULL REFERENCES compliance_rules(id),
  requested_by    uuid NOT NULL REFERENCES users(id),
  approved_by     uuid REFERENCES users(id),
  justification   text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

CREATE INDEX idx_compliance_rules_org ON compliance_rules(org_id);
CREATE INDEX idx_compliance_rules_status ON compliance_rules(status);
CREATE INDEX idx_compliance_evals_resource ON compliance_evaluations(resource_type, resource_id);
