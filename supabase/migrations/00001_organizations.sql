-- Organizations, Establishments, Departments, Branches, Cost Centers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE organizations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name_ar   text NOT NULL,
  legal_name_en   text NOT NULL,
  cr_number       text UNIQUE,
  vat_number      text,
  headquarters_city text,
  address_ar      text,
  address_en      text,
  phone           text,
  email           text,
  website         text,
  logo_url        text,
  brand_settings  jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE establishments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name_ar         text NOT NULL,
  name_en         text,
  unified_number  text,
  activity_code   text,
  activity_desc_ar text,
  city            text,
  mol_status      text DEFAULT 'unknown',
  nitaqat_band    text,
  saudization_pct numeric(5,2),
  snapshot_url    text,
  snapshot_date   date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE compliance_snapshots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  snapshot_date   date NOT NULL,
  nitaqat_band    text,
  saudization_pct numeric(5,2),
  mol_status      text,
  raw_data        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES departments(id),
  name_ar         text NOT NULL,
  name_en         text NOT NULL,
  code            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_branches (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  name_ar         text NOT NULL,
  name_en         text,
  city            text,
  address         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cost_centers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            text NOT NULL,
  name_ar         text NOT NULL,
  name_en         text,
  department_id   uuid REFERENCES departments(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_establishments_org ON establishments(org_id);
CREATE INDEX idx_departments_org ON departments(org_id);
