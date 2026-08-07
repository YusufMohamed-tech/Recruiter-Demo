-- Communications, Templates, Notifications

CREATE TABLE communication_template_versions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            text NOT NULL,
  event_type      text NOT NULL,
  channel         text NOT NULL,
  version         int NOT NULL DEFAULT 1,
  subject_en      text,
  subject_ar      text,
  body_en         text NOT NULL,
  body_ar         text,
  variables       text[] DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, code, version)
);

CREATE TABLE communications (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id        uuid REFERENCES candidates(id),
  application_id      uuid REFERENCES job_applications(id),
  template_version_id uuid REFERENCES communication_template_versions(id),
  channel             text NOT NULL,
  recipient_email     text,
  recipient_phone     text,
  subject             text,
  body                text NOT NULL,
  status              text NOT NULL DEFAULT 'queued',
  provider_message_id text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  failed_at           timestamptz,
  failure_reason      text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL,
  title_en        text NOT NULL,
  title_ar        text,
  body_en         text,
  body_ar         text,
  resource_type   text,
  resource_id     uuid,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_communications_org ON communications(org_id);
CREATE INDEX idx_communications_candidate ON communications(candidate_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id) WHERE read_at IS NULL;
