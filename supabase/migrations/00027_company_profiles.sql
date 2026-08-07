-- Public company profile (visible to job seekers)
CREATE TABLE company_profiles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Display info
  display_name_en text NOT NULL,
  display_name_ar text,
  slug            text UNIQUE NOT NULL,
  tagline_en      text,
  tagline_ar      text,
  description_en  text,
  description_ar  text,

  -- Media
  logo_url        text,
  cover_image_url text,

  -- Details
  industry        text,
  company_size    text,
  founded_year    int,
  website         text,
  linkedin_url    text,

  -- Location
  headquarters    text,
  cities_present  text[] DEFAULT '{}',

  -- Culture & benefits
  benefits        text[] DEFAULT '{}',
  culture_values  text[] DEFAULT '{}',

  -- Verification
  is_verified     boolean DEFAULT false,
  verified_at     timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Company team invitations
CREATE TABLE company_invitations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role_id         uuid NOT NULL REFERENCES roles(id),
  invited_by      uuid NOT NULL REFERENCES users(id),
  token           text UNIQUE NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_profiles_slug ON company_profiles(slug);
CREATE INDEX idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX idx_company_invitations_token ON company_invitations(token);
CREATE INDEX idx_company_invitations_email ON company_invitations(email);
