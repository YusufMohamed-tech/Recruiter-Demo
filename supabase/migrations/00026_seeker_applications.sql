-- Applications from authenticated seekers
CREATE TABLE seeker_applications (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id               uuid NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
  job_posting_id          uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Custom form responses (answers to company's questions)
  form_responses          jsonb DEFAULT '{}',

  -- Status tracking
  status                  text NOT NULL DEFAULT 'submitted',

  -- Timestamps
  submitted_at            timestamptz NOT NULL DEFAULT now(),
  reviewed_at             timestamptz,
  shortlisted_at          timestamptz,
  rejected_at             timestamptz,
  withdrawn_at            timestamptz,

  -- Company-side notes (not visible to seeker)
  internal_notes          text,
  rejection_reason        text,

  -- AI matching
  ai_match_score          numeric(5,2),
  ai_match_breakdown      jsonb,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  UNIQUE(seeker_id, job_posting_id)
);

-- Saved/bookmarked jobs
CREATE TABLE seeker_saved_jobs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id       uuid NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
  job_posting_id  uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  saved_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seeker_id, job_posting_id)
);

CREATE INDEX idx_seeker_applications_seeker ON seeker_applications(seeker_id);
CREATE INDEX idx_seeker_applications_job ON seeker_applications(job_posting_id);
CREATE INDEX idx_seeker_applications_org ON seeker_applications(org_id);
CREATE INDEX idx_seeker_applications_status ON seeker_applications(status);
CREATE INDEX idx_seeker_saved_jobs_seeker ON seeker_saved_jobs(seeker_id);
