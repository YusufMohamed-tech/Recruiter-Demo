-- Candidate portal magic link tokens
CREATE TABLE candidate_portal_tokens (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id    uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token           text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_tokens_token ON candidate_portal_tokens(token);
CREATE INDEX idx_portal_tokens_candidate ON candidate_portal_tokens(candidate_id);
