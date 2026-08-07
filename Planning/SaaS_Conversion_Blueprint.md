# SaaS Conversion Blueprint
# From Internal ATS → Multi-Sided Recruitment Marketplace
# Chessboard Systems — Demo v2.0

**Date:** 2026-08-07  
**Status:** Implementation Plan  
**Stack:** Next.js 15 + Supabase (Auth, DB, Storage, Realtime) + Vercel  
**Target:** Fully functional SaaS demo to present to company stakeholders

---

## Executive Summary

### What We're Building

A **two-sided recruitment SaaS platform** for Saudi Arabia:
- **Job Seekers** → Sign up, build profiles, search jobs, apply with one click
- **Companies** → Register, post jobs, receive applications, manage hiring pipeline

### What Currently Exists vs What Changes

| Aspect | Current State | SaaS Target |
|--------|--------------|-------------|
| Auth model | Admin-created email/password only | Self-registration + Google OAuth for both sides |
| User types | Internal staff only (HR, recruiter, etc.) | + Job seekers as first-class users |
| Candidates | Passive records in DB | Active authenticated users with profiles |
| Job discovery | Basic public careers page (single org) | Full marketplace with search, filters, multi-company |
| Application flow | Anonymous form submission | Authenticated apply with profile + custom questions |
| Multi-tenancy | Single org hardcoded | Multi-company, each with own space |
| Company onboarding | Manual setup | Self-service registration + setup wizard |
| Signup | Disabled (`enable_signup = false`) | Open registration for seekers; invite-based for company teams |

---

## 1. Architecture Overview (SaaS Model)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PUBLIC LAYER (Unauthenticated)                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐  │
│  │ Landing Page │ │ Job Search   │ │ Company Page  │ │ Job Detail   │  │
│  │ /            │ │ /jobs        │ │ /company/[id] │ │ /jobs/[slug] │  │
│  └──────────────┘ └──────────────┘ └───────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AUTH LAYER (Supabase Auth)                                              │
│  ┌──────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │ Job Seeker Auth              │ │ Company Auth                     │   │
│  │ • Google OAuth (one-click)   │ │ • Email/password registration   │   │
│  │ • Email/password signup      │ │ • Google OAuth for team members │   │
│  │ • Profile completion wizard  │ │ • Company setup wizard          │   │
│  └──────────────────────────────┘ └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌───────────────────────────┐ ┌────────────────────────────────────────────┐
│  SEEKER DASHBOARD          │ │  COMPANY DASHBOARD (Existing ATS, adapted) │
│  /seeker/                  │ │  /company/                                  │
│  ├── /profile              │ │  ├── /dashboard          (KPIs)            │
│  ├── /applications         │ │  ├── /jobs               (Post & manage)   │
│  ├── /saved-jobs           │ │  ├── /applications       (Pipeline/Kanban) │
│  └── /settings             │ │  ├── /candidates         (Profiles)        │
│                            │ │  ├── /interviews         (Schedule)        │
│                            │ │  ├── /offers             (Send & track)    │
│                            │ │  ├── /team               (Invite members)  │
│                            │ │  ├── /company-profile    (Public page)     │
│                            │ │  └── /settings           (Billing, config) │
└───────────────────────────┘ └────────────────────────────────────────────┘
```

---

## 2. Database Changes (New Migrations)

### Migration 00025: Seeker Profiles

```sql
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
  city                    text,  -- Riyadh, Jeddah, Dammam, etc.
  district                text,
  
  -- Professional Info
  headline                text,  -- e.g. "Senior Software Engineer | 5 years"
  bio                     text,  -- Short professional summary
  
  -- Demographics (Saudi-specific)
  nationality             text,  -- Saudi, Expat country
  gender                  text,  -- male, female
  date_of_birth           date,
  national_id_type        text,  -- national_id, iqama
  
  -- Career Details
  current_title           text,
  current_company         text,
  total_experience_years  numeric(4,1),
  education_level         text,  -- high_school, diploma, bachelors, masters, phd
  education_field         text,
  university              text,
  graduation_year         int,
  
  -- Job Preferences
  desired_job_title       text,
  desired_salary_min      numeric(12,2),
  desired_salary_max      numeric(12,2),
  employment_type_pref    text[] DEFAULT '{}',  -- full_time, part_time, contract, remote
  preferred_cities        text[] DEFAULT '{}',
  open_to_relocate        boolean DEFAULT false,
  available_from          date,
  
  -- Documents
  cv_file_id              uuid,
  cv_file_url             text,
  
  -- Skills & Languages
  skills                  text[] DEFAULT '{}',
  languages               jsonb DEFAULT '[]',  -- [{language: "Arabic", level: "native"}, ...]
  
  -- Profile Completeness
  profile_completed       boolean DEFAULT false,
  profile_completion_pct  int DEFAULT 0,
  
  -- Visibility
  is_public               boolean DEFAULT true,  -- Visible to companies
  
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
  end_date          date,  -- NULL = current
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
  degree            text NOT NULL,  -- bachelors, masters, etc.
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
```

### Migration 00026: Seeker Applications (Links seekers to jobs)

```sql
-- Applications from authenticated seekers (replaces anonymous form submission)
CREATE TABLE seeker_applications (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id               uuid NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
  job_posting_id          uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Custom form responses (answers to company's questions)
  form_responses          jsonb DEFAULT '{}',
  
  -- Status tracking
  status                  text NOT NULL DEFAULT 'submitted',
    -- submitted → under_review → shortlisted → interview → offered → hired
    -- submitted → rejected (at any point)
    -- submitted → withdrawn (by seeker)
  
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
  
  UNIQUE(seeker_id, job_posting_id)  -- One application per job per seeker
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
```

### Migration 00027: Company Profile (Public-facing)

```sql
-- Public company profile (visible to job seekers)
CREATE TABLE company_profiles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Display info
  display_name_en text NOT NULL,
  display_name_ar text,
  slug            text UNIQUE NOT NULL,  -- /company/slug
  tagline_en      text,
  tagline_ar      text,
  description_en  text,
  description_ar  text,
  
  -- Media
  logo_url        text,
  cover_image_url text,
  
  -- Details
  industry        text,
  company_size    text,  -- 1-10, 11-50, 51-200, 201-500, 500+
  founded_year    int,
  website         text,
  linkedin_url    text,
  
  -- Location
  headquarters    text,  -- City
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
  status          text NOT NULL DEFAULT 'pending',  -- pending, accepted, expired
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_profiles_slug ON company_profiles(slug);
CREATE INDEX idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX idx_company_invitations_token ON company_invitations(token);
CREATE INDEX idx_company_invitations_email ON company_invitations(email);
```

### Migration 00028: User Type + Auth Metadata

```sql
-- Add user_type to distinguish seekers from company users
-- This is stored in auth.users.raw_user_meta_data during signup
-- No table change needed — Supabase auth handles this via metadata:
--   { user_type: 'seeker' | 'company' }

-- RLS policies for seeker tables
ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Seekers can read/write their own profile
CREATE POLICY "seeker_own_profile" ON seeker_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "seeker_own_experiences" ON seeker_experiences
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

CREATE POLICY "seeker_own_education" ON seeker_education
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

CREATE POLICY "seeker_own_certifications" ON seeker_certifications
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

-- Seekers can manage their own applications
CREATE POLICY "seeker_own_applications" ON seeker_applications
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));

-- Companies can view applications to their jobs
CREATE POLICY "company_view_applications" ON seeker_applications
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Companies can view seeker profiles of applicants
CREATE POLICY "company_view_applicant_profiles" ON seeker_profiles
  FOR SELECT USING (
    id IN (
      SELECT seeker_id FROM seeker_applications 
      WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    )
    OR is_public = true
  );

-- Public company profiles readable by all authenticated users
CREATE POLICY "public_company_profiles" ON company_profiles
  FOR SELECT USING (true);

-- Company can edit own profile
CREATE POLICY "company_own_profile" ON company_profiles
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Saved jobs
CREATE POLICY "seeker_own_saved_jobs" ON seeker_saved_jobs
  FOR ALL USING (seeker_id = (SELECT id FROM seeker_profiles WHERE user_id = auth.uid()));
```

---

## 3. Authentication Flow (Detailed)

### 3.1 Supabase Config Changes

```toml
# supabase/config.toml changes
[auth]
enable_signup = true  # Changed from false → true
```

**Google OAuth Setup (Supabase Dashboard):**
1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add Google OAuth Client ID + Secret (from Google Cloud Console)
4. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3.2 Signup Flow — Job Seeker

```
1. User lands on /signup (or clicks "Continue with Google")
   ┌─────────────────────────────────────────┐
   │         Join Chessboard                  │
   │                                          │
   │  [🔵 Continue with Google]               │
   │                                          │
   │  ─── or ───                              │
   │                                          │
   │  Email:     [________________]           │
   │  Password:  [________________]           │
   │                                          │
   │  [Create Account]                        │
   │                                          │
   │  Already have an account? Log in         │
   │  Are you a company? Register here        │
   └─────────────────────────────────────────┘

2. On signup, set metadata: { user_type: 'seeker' }

3. After auth → Redirect to /seeker/onboarding
   ┌─────────────────────────────────────────┐
   │  Complete Your Profile                   │
   │  Step 1 of 4                             │
   │                                          │
   │  ┌─────────────────────────────────┐    │
   │  │ BASIC INFO                       │    │
   │  │ First name*: [________]          │    │
   │  │ Last name*:  [________]          │    │
   │  │ Phone:       [+966 ________]     │    │
   │  │ City:        [Riyadh ▾]          │    │
   │  │ Nationality: [________]          │    │
   │  │ Gender:      [○ Male ○ Female]   │    │
   │  └─────────────────────────────────┘    │
   │                                          │
   │  [Next →]                                │
   └─────────────────────────────────────────┘

   Step 2: Professional Details (title, experience, education)
   Step 3: Skills & Languages
   Step 4: Upload CV (optional) + Review

4. Profile saved → Redirect to /seeker/dashboard (or /jobs)
```

### 3.3 Signup Flow — Company

```
1. Company clicks "Register your company" from landing page or /signup?type=company
   ┌─────────────────────────────────────────┐
   │  Register Your Company                   │
   │                                          │
   │  [🔵 Continue with Google]               │
   │                                          │
   │  ─── or ───                              │
   │                                          │
   │  Your Name:    [________________]        │
   │  Work Email:   [________________]        │
   │  Password:     [________________]        │
   │                                          │
   │  [Create Company Account]                │
   │                                          │
   │  Looking for a job? Sign up here         │
   └─────────────────────────────────────────┘

2. On signup, set metadata: { user_type: 'company' }

3. After auth → Redirect to /company/onboarding
   ┌─────────────────────────────────────────┐
   │  Set Up Your Company                     │
   │  Step 1 of 3                             │
   │                                          │
   │  Company Name (EN)*: [________________]  │
   │  Company Name (AR):  [________________]  │
   │  Industry:           [Technology ▾]      │
   │  Company Size:       [51-200 ▾]          │
   │  Headquarters City:  [Riyadh ▾]          │
   │  CR Number:          [________________]  │
   │                                          │
   │  [Next →]                                │
   └─────────────────────────────────────────┘

   Step 2: Company profile (logo, description, website, benefits)
   Step 3: First job posting (optional, can skip)

4. Company ready → Redirect to /company/dashboard
```

### 3.4 Login Flow (Both Types)

```
Single login page /login
   ┌─────────────────────────────────────────┐
   │  Welcome Back                            │
   │                                          │
   │  [🔵 Continue with Google]               │
   │                                          │
   │  ─── or ───                              │
   │                                          │
   │  Email:     [________________]           │
   │  Password:  [________________]           │
   │                                          │
   │  [Sign In]                               │
   │                                          │
   │  Forgot password?                        │
   │  Don't have an account? Sign up          │
   └─────────────────────────────────────────┘

After login → Check user_type from metadata:
  - 'seeker' → /seeker/dashboard
  - 'company' → /company/dashboard
```

---

## 4. Job Seeker Side — Complete Feature List

### 4.1 Pages & Routes

```
/                           → Landing page (hero, value prop, CTA)
/signup                     → Seeker registration
/signup/company             → Company registration
/login                      → Universal login
/jobs                       → Job search & discovery (PUBLIC, no auth needed to browse)
/jobs/[slug]                → Job detail page (PUBLIC)
/company/[slug]             → Company public profile (PUBLIC)

/seeker/                    → Redirect to /seeker/dashboard
/seeker/onboarding          → Profile completion wizard (4 steps)
/seeker/dashboard           → Overview (recent applications, recommended jobs)
/seeker/profile             → Edit full profile
/seeker/applications        → My applications list (with status tracking)
/seeker/applications/[id]   → Application detail (status timeline)
/seeker/saved-jobs          → Bookmarked jobs
/seeker/settings            → Account settings (email, password, delete account)
```

### 4.2 Job Search & Discovery (/jobs)

**Features:**
- Full-text search (title, company name, description)
- Filters:
  - City (Riyadh, Jeddah, Dammam, Mecca, Medina, etc.)
  - Employment type (Full-time, Part-time, Contract, Remote)
  - Experience level (Entry, Mid, Senior, Executive)
  - Industry / Department
  - Salary range (if visible)
  - Date posted (Last 24h, Last week, Last month)
- Sort by: Relevance, Newest, Salary (high-low)
- Pagination (20 jobs per page)
- Job cards show: Title, Company logo + name, City, Salary range (if visible), Posted date, Employment type
- "Save" button on each card (bookmark)
- "Apply" button → goes to /jobs/[slug] if not logged in, or opens application flow

**Technical:**
- Uses existing `job_postings` table with `status = 'published'`
- Search via `pg_trgm` GIN index (already exists)
- Filter via SQL WHERE clauses
- SSR for SEO (job listings are indexable)
- No auth required to browse — prompt login only when applying

### 4.3 Job Detail Page (/jobs/[slug])

**Sections:**
1. Header: Company logo, Company name (clickable → company profile), Job title, City, Posted date
2. Key details: Employment type, Experience required, Education level, Salary (if visible)
3. Description (bilingual AR/EN toggle)
4. Requirements
5. Benefits (from company profile)
6. "Apply Now" CTA (sticky on mobile)
7. Similar jobs sidebar

**Apply Flow (when user clicks "Apply Now"):**
```
If not logged in → Redirect to /login?redirect=/jobs/[slug]
If logged in but profile incomplete → Show "Complete your profile first" modal
If logged in + profile complete → Show application dialog:

┌─────────────────────────────────────────┐
│  Apply to [Job Title] at [Company]      │
│                                          │
│  ✓ Your profile will be shared          │
│    (Name, experience, education, CV)     │
│                                          │
│  Company Questions:                      │
│  ┌─────────────────────────────────┐    │
│  │ 1. Why do you want this role?*  │    │
│  │    [________________________]    │    │
│  │                                  │    │
│  │ 2. Expected salary?*            │    │
│  │    [________________________]    │    │
│  │                                  │    │
│  │ 3. Can you start immediately?   │    │
│  │    [○ Yes  ○ No  ○ 2 weeks]     │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [Submit Application]                    │
└─────────────────────────────────────────┘
```

### 4.4 Seeker Dashboard (/seeker/dashboard)

**Sections:**
1. Profile completion prompt (if < 100%)
2. Application stats: Total applied, Under review, Shortlisted, Rejected
3. Recent applications (last 5, with status badges)
4. Recommended jobs (based on skills/preferences)

### 4.5 My Applications (/seeker/applications)

**Features:**
- List of all applications with:
  - Company logo + name
  - Job title
  - Applied date
  - Status badge (Submitted, Under Review, Shortlisted, Interview, Offered, Rejected, Withdrawn)
- Status timeline on detail page:
  ```
  ● Submitted (Aug 5)
  ● Under Review (Aug 6) 
  ○ Shortlisted
  ○ Interview
  ○ Offer
  ```
- "Withdraw" button (before shortlist stage only)

### 4.6 Profile Editor (/seeker/profile)

**Sections (tabs or accordion):**
1. **Basic Info** — Name, phone, city, nationality, avatar upload
2. **Professional Summary** — Headline, bio
3. **Experience** — Add/edit/remove work entries (company, title, dates, description)
4. **Education** — Add/edit/remove education entries
5. **Skills** — Tag input (autocomplete from common skills list)
6. **Languages** — Add with proficiency level
7. **Certifications** — Add certificates
8. **Documents** — Upload/replace CV (PDF only, max 5MB)
9. **Job Preferences** — Desired title, salary, cities, employment type
10. **Visibility** — Toggle profile public/private

**Profile completion meter:**
- 0-25%: Basic info only
- 25-50%: + Professional info
- 50-75%: + Experience + Education
- 75-100%: + Skills + CV uploaded

---

## 5. Company Side — Complete Feature List

### 5.1 What Already Exists (Reuse)

These features from the current ATS are directly reusable with minor adaptation:

| Feature | Current Route | Adaptation Needed |
|---------|--------------|-------------------|
| Dashboard KPIs | `/(dashboard)/page.tsx` | Filter by `org_id` of logged-in company |
| Job Postings CRUD | `/(dashboard)/jobs/` | Already org-scoped, just wire to new auth |
| Application Form Builder | `/(dashboard)/jobs/[id]/form` | Already works, needs polish |
| Applications Pipeline | `/(dashboard)/applications/` | Map `seeker_applications` instead of `job_applications` |
| Application Detail | `/(dashboard)/applications/[id]/` | Show seeker profile instead of candidate record |
| Interviews | `/(dashboard)/interviews/` | Link to seeker profile |
| Offers | `/(dashboard)/offers/` | Send to seeker (email + in-app notification) |
| Analytics | `/(dashboard)/analytics/` | Filter by org |
| Settings (org, team) | `/(dashboard)/settings/` | Already org-scoped |
| Compliance Engine | Full engine | Keep for Saudi-specific checks |
| AI Match Scoring | `lib/ai/match-scorer.ts` | Score seeker profile vs job requirements |
| Bilingual Support | AR/EN with next-intl | Already works |

### 5.2 What's Missing on Company Side (Must-Have)

#### A. Company Onboarding Wizard

**Why:** Currently, organizations are seeded manually. Companies need self-service registration.

**Flow:**
1. Create account (email + password or Google)
2. Company info (name, industry, size, CR number, city)
3. Upload logo + write company description
4. Invite first team member (optional, can skip)
5. Post first job (optional, can skip)

**Technical:**
- On signup with `user_type: 'company'`:
  1. Create row in `organizations` table
  2. Create row in `users` table (linked to org)
  3. Assign `admin` role to this user
  4. Create `company_profiles` row
  5. Redirect to onboarding wizard

#### B. Company Public Profile Page

**Why:** Job seekers need to see who they're applying to. Builds trust.

**Features:**
- Company logo + cover image
- Company name (AR/EN)
- Tagline / Description
- Industry, size, founded year
- Headquarters + cities present
- Benefits list
- Culture values
- Open positions count + list
- Verified badge (for companies that provided CR number)

**Route:** `/company/[slug]` (public, no auth required)

#### C. Team Management

**Why:** Companies have multiple people (HR, recruiter, hiring manager) who need access.

**Features:**
- Invite team members by email (sends invitation link)
- Assign roles: Admin, HR Manager, Recruiter, Hiring Manager
- View/remove team members
- Pending invitations list

**Existing support:** The `users`, `roles`, `user_roles` tables already support this. We just need:
- `company_invitations` table (in migration 00027)
- Invitation email flow
- Accept invitation page

#### D. Simplified Job Posting Flow

**Why:** Current flow is Requisition → Approval → Job Posting (enterprise workflow). For the SaaS demo, companies should post jobs directly.

**New simplified flow:**
```
1. Click "Post a Job" 
2. Fill job details:
   - Title (EN + AR)
   - Department
   - City
   - Employment type
   - Experience level
   - Education requirement
   - Salary range (optional, can hide)
   - Description (rich text)
   - Requirements (rich text)
   
3. Add screening questions (form builder):
   - Text question
   - Multiple choice
   - Yes/No
   - Number (e.g., "Years of experience in X?")
   - File upload (e.g., "Upload portfolio")
   
4. Preview → Publish

Result: Job is immediately live on /jobs
```

**Note:** The existing requisition → approval workflow can be enabled per-company as an "enterprise feature" toggle later. For the demo, jobs go directly to published.

#### E. Candidate View (Seeker Profile Access)

**Why:** When a company receives an application, they need to see the applicant's full profile.

**What company sees when viewing an applicant:**
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar] Ahmed Al-Dosari                                 │
│ Senior Software Engineer | 5 years experience            │
│ 📍 Riyadh | 🇸🇦 Saudi | 📱 +966 5XX XXX XXX           │
│                                                          │
│ AI Match Score: 87/100 ████████░░                        │
│                                                          │
│ ─── Application Answers ───                              │
│ Q: Why do you want this role?                            │
│ A: "I'm passionate about..."                             │
│ Q: Expected salary?                                      │
│ A: "18,000 - 22,000 SAR"                                │
│                                                          │
│ ─── Professional Summary ───                             │
│ [Bio text...]                                            │
│                                                          │
│ ─── Experience ───                                       │
│ • Senior Developer at XYZ Corp (2023 - Present)          │
│ • Developer at ABC Inc (2021 - 2023)                     │
│                                                          │
│ ─── Education ───                                        │
│ • B.Sc Computer Science, King Saud University (2020)     │
│                                                          │
│ ─── Skills ───                                           │
│ [React] [Node.js] [TypeScript] [PostgreSQL]              │
│                                                          │
│ ─── CV ───                                               │
│ [📄 Download CV (PDF)]                                   │
│                                                          │
│ [Shortlist] [Reject] [Schedule Interview] [Send Message] │
└─────────────────────────────────────────────────────────┘
```

#### F. Application Pipeline with Seeker Profiles

**Replace current candidate-based pipeline with seeker-based:**
- Kanban board: Submitted → Under Review → Shortlisted → Interview → Offered → Hired
- Drag to advance (updates `seeker_applications.status`)
- Click card → opens seeker profile + application answers
- Bulk actions: Reject, Advance, Export

#### G. Communication with Seekers

**Must-have for demo:**
- In-app notifications to seekers (status changes)
- Email notifications (via Resend):
  - "Your application was received"
  - "You've been shortlisted"
  - "Interview scheduled for [date]"
  - "You've received an offer"
  - "Application update" (rejection — gentle template)

**Existing support:** `communications` table + Resend dependency already in package.json.

#### H. Company Dashboard KPIs

**Adapt existing dashboard to show:**
- Open positions count
- Total applications (this week/month)
- Applications pending review
- Average time-to-review
- Top performing job posts (most applications)
- Pipeline funnel chart (applied → reviewed → shortlisted → offered → hired)

---

## 6. Implementation Phases

### Phase 1: Auth & Core Infrastructure (Days 1-2)

| # | Task | Details |
|---|------|---------|
| 1.1 | Enable Supabase signup | Change `enable_signup = true` |
| 1.2 | Configure Google OAuth | Add provider in Supabase dashboard, add callback route |
| 1.3 | Create signup pages | `/signup` (seeker), `/signup/company` |
| 1.4 | Create universal login | Update `/login` with Google button + redirect logic |
| 1.5 | Auth callback handler | `/api/auth/callback` — handles Google redirect, sets user_type |
| 1.6 | Middleware update | Route based on user_type: seeker → `/seeker/*`, company → `/company/*` |
| 1.7 | Run new migrations | 00025-00028 (seeker profiles, applications, company profiles, RLS) |

### Phase 2: Job Seeker Experience (Days 3-5)

| # | Task | Details |
|---|------|---------|
| 2.1 | Onboarding wizard | 4-step profile completion flow |
| 2.2 | Profile editor page | Full profile CRUD with all sections |
| 2.3 | Job search page | `/jobs` with search, filters, pagination |
| 2.4 | Job detail page | `/jobs/[slug]` with full info + apply CTA |
| 2.5 | Application flow | Modal/page with company questions + submit |
| 2.6 | Seeker dashboard | Overview with stats + recent applications |
| 2.7 | My applications | List + detail with status timeline |
| 2.8 | Saved jobs | Bookmark/unbookmark + list page |
| 2.9 | Profile API routes | CRUD for profile, experiences, education, certifications |
| 2.10 | Application API routes | Submit, withdraw, list (seeker-side) |

### Phase 3: Company Adaptation (Days 6-8)

| # | Task | Details |
|---|------|---------|
| 3.1 | Company onboarding | Wizard to set up org + company profile |
| 3.2 | Company public page | `/company/[slug]` with info + open positions |
| 3.3 | Simplified job posting | Direct post flow (skip requisition for demo) |
| 3.4 | Application form builder | Drag & drop question builder (adapt existing) |
| 3.5 | Applications pipeline | Kanban + list view showing seeker profiles |
| 3.6 | Applicant profile view | Full seeker profile visible to company |
| 3.7 | Status management | Advance/reject with notifications |
| 3.8 | Team invitations | Invite by email, accept flow |
| 3.9 | Company dashboard | Adapted KPIs for new model |
| 3.10 | Company settings | Edit profile, manage team, configure notifications |

### Phase 4: Polish & Integration (Days 9-10)

| # | Task | Details |
|---|------|---------|
| 4.1 | Email notifications | Resend integration for key events |
| 4.2 | In-app notifications | Realtime via Supabase (bell icon + dropdown) |
| 4.3 | AI match scoring | Score seeker profile vs job on application submit |
| 4.4 | Landing page | Marketing page with hero, features, CTA |
| 4.5 | Responsive design | Mobile-first for seeker experience |
| 4.6 | Bilingual polish | AR/EN for all new pages |
| 4.7 | Seed data | Demo companies + demo seekers + sample applications |
| 4.8 | Error states | Empty states, loading skeletons, error boundaries |
| 4.9 | Profile completeness | Calculation logic + prompts |
| 4.10 | Final testing | End-to-end flow for both user types |

---

## 7. Route Structure (Final)

```
apps/web/app/
├── (public)/                     # No auth required
│   ├── page.tsx                  # Landing page
│   ├── jobs/
│   │   ├── page.tsx              # Job search & discovery
│   │   └── [slug]/
│   │       └── page.tsx          # Job detail
│   ├── company/
│   │   └── [slug]/
│   │       └── page.tsx          # Company public profile
│   └── layout.tsx                # Public header + footer
│
├── (auth)/
│   ├── login/page.tsx            # Universal login
│   ├── signup/
│   │   ├── page.tsx              # Seeker signup
│   │   └── company/page.tsx      # Company signup
│   ├── forgot-password/page.tsx
│   └── callback/route.ts        # OAuth callback
│
├── (seeker)/                     # Auth required, user_type = 'seeker'
│   ├── layout.tsx                # Seeker shell (navbar, mobile bottom nav)
│   ├── onboarding/page.tsx       # Profile wizard (post-signup)
│   ├── dashboard/page.tsx        # Seeker home
│   ├── profile/page.tsx          # Edit profile
│   ├── applications/
│   │   ├── page.tsx              # My applications list
│   │   └── [id]/page.tsx         # Application detail + timeline
│   ├── saved-jobs/page.tsx       # Bookmarked jobs
│   └── settings/page.tsx         # Account settings
│
├── (company)/                    # Auth required, user_type = 'company'
│   ├── layout.tsx                # Company shell (sidebar, topbar — existing)
│   ├── onboarding/page.tsx       # Company setup wizard
│   ├── dashboard/page.tsx        # Company home (KPIs)
│   ├── jobs/
│   │   ├── page.tsx              # Manage job postings
│   │   ├── new/page.tsx          # Create job posting
│   │   └── [id]/
│   │       ├── page.tsx          # Edit job
│   │       ├── form/page.tsx     # Application form builder
│   │       └── applicants/page.tsx  # Applicants for this job
│   ├── applications/
│   │   ├── page.tsx              # All applications (Kanban + list)
│   │   └── [id]/page.tsx         # Application detail (seeker profile view)
│   ├── interviews/page.tsx       # Interview scheduling
│   ├── offers/page.tsx           # Offer management
│   ├── team/page.tsx             # Team members + invitations
│   ├── company-profile/page.tsx  # Edit public company profile
│   ├── analytics/page.tsx        # Hiring analytics
│   └── settings/page.tsx         # Company settings
│
├── api/
│   ├── auth/
│   │   ├── callback/route.ts     # OAuth callback handler
│   │   └── signout/route.ts      # Signout
│   ├── v1/
│   │   ├── seeker/
│   │   │   ├── profile/route.ts         # GET/PUT seeker profile
│   │   │   ├── experiences/route.ts     # CRUD experiences
│   │   │   ├── education/route.ts       # CRUD education
│   │   │   ├── certifications/route.ts  # CRUD certifications
│   │   │   ├── applications/route.ts    # GET my applications
│   │   │   └── saved-jobs/route.ts      # GET/POST/DELETE saved jobs
│   │   ├── jobs/
│   │   │   ├── route.ts                 # GET published jobs (public)
│   │   │   ├── [slug]/route.ts          # GET job detail (public)
│   │   │   └── [slug]/apply/route.ts    # POST application (auth required)
│   │   ├── company/
│   │   │   ├── profile/route.ts         # GET/PUT company profile
│   │   │   ├── jobs/route.ts            # CRUD company's jobs
│   │   │   ├── applications/route.ts    # GET applications to company's jobs
│   │   │   ├── applications/[id]/route.ts  # GET/PUT single application
│   │   │   ├── team/route.ts            # GET team, POST invite
│   │   │   ├── team/accept/route.ts     # POST accept invitation
│   │   │   └── dashboard/route.ts       # GET dashboard KPIs
│   │   └── ... (existing routes, adapted)
│   └── ...
└── layout.tsx                    # Root layout
```

---

## 8. Middleware Logic (Updated)

```typescript
// middleware.ts — Updated routing logic
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes — no auth needed
  const publicRoutes = ['/', '/jobs', '/company', '/login', '/signup', '/forgot-password'];
  if (publicRoutes.some(r => pathname.startsWith(r))) return;
  
  // Get session
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  
  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const userType = user.user_metadata?.user_type;
  
  // Route protection by user type
  if (pathname.startsWith('/seeker') && userType !== 'seeker') {
    return NextResponse.redirect(new URL('/company/dashboard', request.url));
  }
  if (pathname.startsWith('/company') && userType !== 'company') {
    return NextResponse.redirect(new URL('/seeker/dashboard', request.url));
  }
  
  // Check if profile is complete (redirect to onboarding if not)
  if (userType === 'seeker' && !pathname.startsWith('/seeker/onboarding')) {
    // Check seeker_profiles.profile_completed
    // If false → redirect to /seeker/onboarding
  }
  if (userType === 'company' && !pathname.startsWith('/company/onboarding')) {
    // Check if org exists for this user
    // If not → redirect to /company/onboarding
  }
}
```

---

## 9. Saudi Arabia–Specific Considerations

### 9.1 Cities Dropdown (Standard List)

```typescript
const SAUDI_CITIES = [
  'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
  'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Taif',
  'Buraidah', 'Jubail', 'Yanbu', 'Hail', 'Najran',
  'Jazan', 'Al Ahsa', 'Khamis Mushait', 'NEOM', 'Diriyah'
];
```

### 9.2 Nationality Handling

- Saudi nationals → Show "National ID" option
- Expats → Show "Iqama" option
- Both need different compliance checks

### 9.3 Phone Number

- Default country code: +966
- Format: +966 5XX XXX XXX (mobile)
- Validation: Must start with 5 for mobile

### 9.4 Bilingual (AR/EN)

- All form fields that are public-facing have both AR and EN variants
- Job postings: title, description, requirements in both languages
- Profile: Names in both AR and EN
- UI: Full RTL support for Arabic (already implemented)

### 9.5 Gender Considerations

- Some jobs are gender-specific in Saudi Arabia (legal requirement)
- Job postings can specify gender preference
- Profile gender is used for compliance matching

### 9.6 Salary

- Currency: SAR (Saudi Riyal)
- Monthly salary is the standard (not annual)
- Salary ranges are common (min-max)

---

## 10. Key UI/UX Decisions

### 10.1 Seeker Experience — Mobile First

Job seekers will primarily use phones. Design priorities:
- Bottom navigation bar on mobile (Home, Jobs, Applications, Profile)
- Large touch targets
- Minimal form fields per step
- Swipe-based job browsing (optional enhancement)
- Fast load times (SSR for job listings)

### 10.2 Company Experience — Desktop First

Company users (HR/recruiters) use desktop. Design priorities:
- Sidebar navigation (already exists)
- Dense data tables
- Keyboard shortcuts for power users
- Split-pane views (list + detail)

### 10.3 Application Experience

The key UX principle: **Apply should take < 2 minutes**
- Profile is pre-filled (one-time setup)
- Only answer company's custom questions
- One-click if no custom questions
- Show "Applied" badge on job cards after applying
- Confirmation screen + email after submit

### 10.4 Status Transparency

Seekers should always know where they stand:
- Clear status badges with colors:
  - Submitted (blue)
  - Under Review (yellow)
  - Shortlisted (green)
  - Interview (purple)
  - Offered (gold)
  - Hired (green checkmark)
  - Rejected (gray — soft language: "Not selected")
  - Withdrawn (gray)
- Timeline visualization on application detail

---

## 11. Notifications System

### 11.1 In-App (Supabase Realtime)

```
Seeker receives:
- Application received confirmation
- Status changed (under review, shortlisted, etc.)
- Interview scheduled
- Offer received
- New job matching preferences (future enhancement)

Company receives:
- New application received
- Candidate accepted offer
- Candidate withdrew application
- Team member accepted invitation
```

### 11.2 Email (Resend)

**Templates needed:**

| Event | Recipient | Template |
|-------|-----------|----------|
| Application submitted | Seeker | "Thanks for applying to [Job] at [Company]" |
| Application submitted | Company (recruiter) | "New application: [Name] for [Job]" |
| Status: Under Review | Seeker | "Your application is being reviewed" |
| Status: Shortlisted | Seeker | "Great news! You've been shortlisted" |
| Interview scheduled | Seeker | "Interview scheduled for [Date]" |
| Offer sent | Seeker | "You've received an offer from [Company]" |
| Status: Rejected | Seeker | "Update on your application" (soft) |
| Team invitation | New team member | "You're invited to join [Company] on Chessboard" |
| Welcome | New user | "Welcome to Chessboard" |

---

## 12. Data Model Relationships (Visual)

```
auth.users (Supabase managed)
    │
    ├── user_type = 'seeker'
    │   └── seeker_profiles (1:1)
    │       ├── seeker_experiences (1:many)
    │       ├── seeker_education (1:many)
    │       ├── seeker_certifications (1:many)
    │       ├── seeker_applications (1:many) ──→ job_postings
    │       └── seeker_saved_jobs (1:many) ──→ job_postings
    │
    └── user_type = 'company'
        └── users (1:1, linked to org)
            └── organizations (many:1)
                ├── company_profiles (1:1)
                ├── company_invitations (1:many)
                ├── job_postings (1:many)
                │   └── application_form_versions (1:many)
                ├── departments (1:many)
                └── establishments (1:many)

Linkage:
  seeker_applications.job_posting_id → job_postings.id
  seeker_applications.org_id → organizations.id
  (Company sees seeker_profiles through seeker_applications)
```

---

## 13. API Design (Key Endpoints)

### Public (No Auth)
```
GET  /api/v1/jobs                    → List published jobs (search, filter, paginate)
GET  /api/v1/jobs/[slug]             → Job detail
GET  /api/v1/companies/[slug]        → Company public profile
```

### Seeker (Auth Required, user_type = 'seeker')
```
GET    /api/v1/seeker/profile            → Get my profile
PUT    /api/v1/seeker/profile            → Update my profile
POST   /api/v1/seeker/experiences        → Add experience
PUT    /api/v1/seeker/experiences/[id]   → Update experience
DELETE /api/v1/seeker/experiences/[id]   → Delete experience
POST   /api/v1/seeker/education          → Add education
PUT    /api/v1/seeker/education/[id]     → Update education
DELETE /api/v1/seeker/education/[id]     → Delete education
POST   /api/v1/seeker/certifications     → Add certification
DELETE /api/v1/seeker/certifications/[id]→ Delete certification
GET    /api/v1/seeker/applications       → My applications
GET    /api/v1/seeker/applications/[id]  → Application detail
POST   /api/v1/seeker/applications       → Submit application (to a job)
PUT    /api/v1/seeker/applications/[id]  → Withdraw application
GET    /api/v1/seeker/saved-jobs         → My saved jobs
POST   /api/v1/seeker/saved-jobs         → Save a job
DELETE /api/v1/seeker/saved-jobs/[id]    → Unsave a job
POST   /api/v1/seeker/upload-cv          → Upload CV file
```

### Company (Auth Required, user_type = 'company')
```
GET    /api/v1/company/dashboard         → KPI stats
GET    /api/v1/company/profile           → Company profile
PUT    /api/v1/company/profile           → Update company profile
POST   /api/v1/company/jobs              → Create job posting
PUT    /api/v1/company/jobs/[id]         → Update job posting
DELETE /api/v1/company/jobs/[id]         → Delete (unpublish) job
PUT    /api/v1/company/jobs/[id]/publish → Publish job
PUT    /api/v1/company/jobs/[id]/close   → Close job
GET    /api/v1/company/applications      → All applications (filterable by job, status)
GET    /api/v1/company/applications/[id] → Application detail + seeker profile
PUT    /api/v1/company/applications/[id] → Update status (advance/reject)
POST   /api/v1/company/applications/[id]/note → Add internal note
GET    /api/v1/company/team              → List team members
POST   /api/v1/company/team/invite       → Send invitation
DELETE /api/v1/company/team/[id]         → Remove team member
POST   /api/v1/company/team/accept       → Accept invitation (by token)
GET    /api/v1/company/analytics         → Hiring analytics
```

---

## 14. Seed Data for Demo

### Demo Companies

| Company | Industry | Size | City | Jobs |
|---------|----------|------|------|------|
| TechVista Solutions | Technology | 51-200 | Riyadh | 4 jobs |
| BuildSaudi Construction | Construction | 201-500 | Jeddah | 3 jobs |
| HealthFirst KSA | Healthcare | 501+ | Dammam | 3 jobs |
| NEOM Digital | Smart City | 201-500 | NEOM | 5 jobs |
| Al Rajhi Ventures | Finance | 51-200 | Riyadh | 2 jobs |

### Demo Job Seekers

| Name | Title | City | Experience |
|------|-------|------|------------|
| Ahmed Al-Dosari | Senior Software Engineer | Riyadh | 5 years |
| Fatima Al-Harbi | Marketing Manager | Jeddah | 7 years |
| Mohammed Al-Zahrani | Civil Engineer | Dammam | 3 years |
| Noura Al-Shammari | Data Analyst | Riyadh | 2 years |
| Khalid Al-Ghamdi | Project Manager | NEOM | 10 years |

### Demo Applications (Pre-filled)

- Ahmed applied to 3 jobs at TechVista (1 shortlisted, 1 under review, 1 rejected)
- Fatima applied to 2 jobs (1 offered, 1 submitted)
- Each showing different status states for demo purposes

---

## 15. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google OAuth (configured in Supabase dashboard, not in env)
# GOOGLE_CLIENT_ID= (set in Supabase Auth settings)
# GOOGLE_CLIENT_SECRET= (set in Supabase Auth settings)

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@chessboard.sa

# App
NEXT_PUBLIC_APP_URL=https://chessboard-demo.vercel.app
NEXT_PUBLIC_APP_NAME=Chessboard
```

---

## 16. What to Show in the Demo Presentation

### Flow 1: Job Seeker Journey (Primary Demo)
1. Open landing page → "Find your next opportunity in Saudi Arabia"
2. Click "Continue with Google" → instant account
3. Complete profile (4 quick steps)
4. Browse /jobs → search "Software Engineer" in "Riyadh"
5. Click a job → see full details + company info
6. Click "Apply Now" → answer 2 company questions → submit
7. See application in "My Applications" with status tracking
8. Receive notification when status changes

### Flow 2: Company Journey (Secondary Demo)
1. Register company → quick setup wizard
2. Post a job in 3 minutes (title, description, questions)
3. Receive application → see seeker's full profile
4. Shortlist candidate → seeker gets notified
5. View pipeline (Kanban board)
6. Send offer → seeker receives in-app + email

### Flow 3: The Match (Wow Moment)
1. Show AI match score when company views applicant
2. Show how profile data matches job requirements
3. Demonstrate the time saved vs traditional CV review

---

## 17. File Sizes & Complexity Estimate

| Area | New Files | Modified Files | Estimated Lines |
|------|-----------|---------------|-----------------|
| Migrations (SQL) | 4 | 0 | ~300 |
| Auth (signup/login/callback) | 6 | 2 | ~600 |
| Seeker pages | 8 | 0 | ~2,000 |
| Seeker API routes | 12 | 0 | ~1,500 |
| Company new pages | 4 | 6 | ~1,200 |
| Company API routes | 8 | 4 | ~1,000 |
| Public pages (landing, jobs, company) | 5 | 2 | ~1,500 |
| Components (shared) | 15 | 5 | ~2,000 |
| Middleware + utils | 2 | 2 | ~200 |
| Seed data | 1 | 1 | ~400 |
| Email templates | 6 | 0 | ~300 |
| **Total** | **~71 files** | **~22 files** | **~11,000 lines** |

---

## 18. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Google OAuth misconfigured | Test with personal Google account first; have email fallback |
| RLS policies block data | Test each policy individually; have service-role bypass for debugging |
| Performance on job search | pg_trgm index already exists; add LIMIT + pagination from day 1 |
| Arabic RTL breaks layouts | Test every new page in Arabic mode; use existing RTL infrastructure |
| Mobile responsiveness | Build seeker pages mobile-first; test on real device |
| Supabase free tier limits | Monitor row count; demo data is small (~100 rows total) |
| Demo presentation fails | Seed reliable demo data; have backup screenshots/video |

---

## 19. Success Criteria (Demo Acceptance)

The demo is ready to present when:

- [ ] A new user can sign up with Google in < 10 seconds
- [ ] Profile completion takes < 3 minutes
- [ ] Job search returns relevant results with < 1 second load time
- [ ] Applying to a job takes < 2 minutes (including reading questions)
- [ ] A company can post a job in < 5 minutes
- [ ] A company can view a full applicant profile with AI match score
- [ ] Status changes trigger visible notifications
- [ ] The entire flow works in both Arabic and English
- [ ] Mobile experience is smooth for job seekers
- [ ] No errors or broken states in the happy path

---

## 20. Post-Demo (Production Roadmap Preview)

Once the company accepts, these are the production enhancements:

1. **Subscription billing** (Stripe) — Free tier for seekers, paid plans for companies
2. **Advanced search** (Meilisearch) — Faster, typo-tolerant, faceted search
3. **Video interviews** — Built-in video call for remote interviews
4. **Assessment tests** — Technical/personality assessments within platform
5. **Company verified badges** — CR number verification against MOL API
6. **Probation tracking** — Post-hire onboarding management
7. **Analytics Pro** — Advanced hiring analytics with benchmarks
8. **Mobile app** — React Native for seekers
9. **API access** — For enterprise integrations (HRIS, payroll)
10. **White-label** — Companies get their own branded career page
