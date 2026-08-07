-- Interviews, Scorecards, Assessments

CREATE TABLE interview_panels (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  title           text NOT NULL DEFAULT 'Interview',
  interview_type  text NOT NULL DEFAULT 'hr',  -- hr, technical, panel, final, assessment
  scheduled_at    timestamptz,
  duration_mins   int NOT NULL DEFAULT 60,
  location        text,                        -- URL or room
  format          text NOT NULL DEFAULT 'video', -- video, in_person, phone
  status          text NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  organizer_id    uuid REFERENCES users(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interview_interviewers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id    uuid NOT NULL REFERENCES interview_panels(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id),
  UNIQUE(interview_id, user_id)
);

CREATE TABLE scorecard_templates (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  interview_type text,          -- null = all types
  criteria    jsonb NOT NULL DEFAULT '[]',
  -- criteria: [{key, label_en, label_ar, weight, type: rating|text|yesno}]
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interview_scorecards (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id    uuid NOT NULL REFERENCES interview_panels(id) ON DELETE CASCADE,
  interviewer_id  uuid NOT NULL REFERENCES users(id),
  template_id     uuid REFERENCES scorecard_templates(id),
  scores          jsonb NOT NULL DEFAULT '{}',
  -- scores: {criterion_key: {rating: 1-5, notes: ""}}
  overall_rating  numeric(3,1),  -- 1-5
  recommendation  text NOT NULL DEFAULT 'neutral',  -- strong_hire, hire, neutral, no_hire, strong_no_hire
  strengths       text,
  concerns        text,
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(interview_id, interviewer_id)
);

CREATE TABLE assessments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  title           text NOT NULL,
  provider        text,                    -- e.g. "HackerRank", "Mercer", internal
  assessment_url  text,
  due_at          timestamptz,
  sent_at         timestamptz,
  completed_at    timestamptz,
  score           numeric(5,2),
  max_score       numeric(5,2),
  status          text NOT NULL DEFAULT 'pending',  -- pending, sent, completed, expired
  notes           text,
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_interviews_application  ON interview_panels(application_id);
CREATE INDEX idx_interviews_org          ON interview_panels(org_id);
CREATE INDEX idx_interviews_scheduled    ON interview_panels(scheduled_at);
CREATE INDEX idx_scorecards_interview    ON interview_scorecards(interview_id);
CREATE INDEX idx_scorecards_interviewer  ON interview_scorecards(interviewer_id);
CREATE INDEX idx_assessments_application ON assessments(application_id);
