-- Job seeker profiles (linked to auth.users, NOT to any org)
CREATE TABLE seeker_profiles (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Basic Info
  first_name_en           text NOT NULL,
  last_name_en            text NOT NULL,
  first_name_ar           text,
  last_name_ar            text,
  email                   text NOT NULL,
  phone                   text,
  phone_country_code      text DEFAULT '+966',
  avatar_url              text,

  -- Location (Saudi Arabia focused)
  city                    text,
  district                text,

  -- Professional Info
  headline                text,
  bio                     text,

  -- Demographics (Saudi-specific)
  nationality             text,
  gender                  text,
  date_of_birth           date,
  national_id_type        text,

  -- Career Details
  current_title           text,
  current_company         text,
  total_experience_years  numeric(4,1),
  education_level         text,
  education_field         text,
  university              text,
  graduation_year         int,

  -- Job Preferences
  desired_job_title       text,
  desired_salary_min      numeric(12,2),
  desired_salary_max      numeric(12,2),
  employment_type_pref    text[] DEFAULT '{}',
  preferred_cities        text[] DEFAULT '{}',
  open_to_relocate        boolean DEFAULT false,
  available_from          date,

  -- Documents
  cv_file_id              uuid,
  cv_file_url             text,

  -- Skills & Languages
  skills                  text[] DEFAULT '{}',
  languages               jsonb DEFAULT '[]',

  -- Profile Completeness
  profile_completed       boolean DEFAULT false,
  profile_completion_pct  int DEFAULT 0,

  -- Visibility
  is_public               boolean DEFAULT true,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Work experience entries
CREATE TABLE seeker_experiences (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id         uuid NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
  company_name      text NOT NULL,
  title             text NOT NULL,
  city              text,
  start_date        date NOT NULL,
  end_date          date,
  is_current        boolean DEFAULT false,
  description       text,
  order_index       int DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Education entries
CREATE TABLE seeker_education (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id         uuid NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
  institution       text NOT NULL,
  degree            text NOT NULL,
  field_of_study    text,
  start_year        int,
  end_year          int,
  gpa               numeric(3,2),
  order_index       int DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Certifications
CREATE TABLE seeker_certifications (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id         uuid NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
  name              text NOT NULL,
  issuing_org       text,
  issue_date        date,
  expiry_date       date,
  credential_url    text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seeker_profiles_user ON seeker_profiles(user_id);
CREATE INDEX idx_seeker_profiles_city ON seeker_profiles(city);
CREATE INDEX idx_seeker_profiles_skills ON seeker_profiles USING gin(skills);
CREATE INDEX idx_seeker_experiences_seeker ON seeker_experiences(seeker_id);
CREATE INDEX idx_seeker_education_seeker ON seeker_education(seeker_id);
CREATE INDEX idx_seeker_certifications_seeker ON seeker_certifications(seeker_id);
