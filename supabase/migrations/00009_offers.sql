-- Offers, Offer Versions, Offer Responses

CREATE TABLE offers (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id      uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  candidate_id        uuid NOT NULL REFERENCES candidates(id),
  current_version     int NOT NULL DEFAULT 1,
  status              text NOT NULL DEFAULT 'draft',
  access_token        text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at          timestamptz,
  acceptance_hash     text,
  accepted_at         timestamptz,
  declined_at         timestamptz,
  withdrawn_at        timestamptz,
  withdraw_reason     text,
  created_by          uuid NOT NULL REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE offer_versions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id        uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  version         int NOT NULL,
  job_title       text NOT NULL,
  start_date      date,
  base_salary     numeric(12,2),
  currency        text NOT NULL DEFAULT 'SAR',
  allowances      jsonb DEFAULT '{}',
  benefits        jsonb DEFAULT '{}',
  terms_en        text,
  terms_ar        text,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, version)
);

CREATE TABLE offer_responses (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id        uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  action          text NOT NULL,
  candidate_notes text,
  counter_details jsonb,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_org ON offers(org_id);
CREATE INDEX idx_offers_application ON offers(application_id);
CREATE INDEX idx_offers_token ON offers(access_token);
