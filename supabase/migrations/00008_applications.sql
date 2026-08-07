-- Job Applications and Stage Events

CREATE TABLE job_applications (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_posting_id          uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id            uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  form_version_id         uuid REFERENCES application_form_versions(id),
  form_responses          jsonb DEFAULT '{}',
  current_stage           text NOT NULL DEFAULT 'applied',
  assigned_to             uuid REFERENCES users(id),
  ai_match_score          numeric(5,2),
  ai_match_breakdown      jsonb,
  source_channel_id       uuid REFERENCES sourcing_channels(id),
  source_utm              jsonb,
  privacy_notice_accepted boolean NOT NULL DEFAULT false,
  privacy_notice_version  text,
  privacy_accepted_at     timestamptz,
  status                  text NOT NULL DEFAULT 'active',
  withdrawal_reason       text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id, candidate_id)
);

CREATE TABLE application_stage_events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_stage      text,
  to_stage        text NOT NULL,
  actor_id        uuid REFERENCES users(id),
  notes           text,
  gate_checks     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rejection_reasons (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reason_en   text NOT NULL,
  reason_ar   text,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_applications_org ON job_applications(org_id);
CREATE INDEX idx_applications_job ON job_applications(job_posting_id);
CREATE INDEX idx_applications_candidate ON job_applications(candidate_id);
CREATE INDEX idx_applications_stage ON job_applications(current_stage);
CREATE INDEX idx_applications_assigned ON job_applications(assigned_to);
CREATE INDEX idx_stage_events_app ON application_stage_events(application_id);
