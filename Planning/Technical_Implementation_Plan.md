# Technical Implementation Plan
# Saudi Recruitment & Employment Readiness Platform
# منصة التوظيف والجاهزية الوظيفية — Chessboard Systems

**Domain:** recruitment.chessboard-systems.com  
**Hosting:** Hostinger Cloud Enterprise  
**Version:** 1.0  
**Date:** 2026-08-04  
**Status:** Implementation Ready

---

## 0. Reading This Document

This plan translates every requirement in the BRD v2.0 into concrete technical decisions. It is organized as follows:

- **Part A** — Architecture, stack, and infrastructure
- **Part B** — Domain modules and their data contracts
- **Part C** — Screen-by-screen UI specification with branding
- **Part D** — API surface and integration contracts
- **Part E** — Security, privacy, and compliance implementation
- **Part F** — Testing, migration, and deployment pipeline

Every BRD requirement ID (FR-*, BR-*, AC-*) is referenced against the section that implements it.

---

## Part A — Architecture, Stack, and Infrastructure

### A.1 Technology Decisions

#### A.1.1 Full Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | **Next.js 15 (App Router)** | SSR for SEO on public portal, RSC for ATS performance, strong i18n |
| UI component library | **shadcn/ui + Radix UI primitives** | Unstyled/accessible, easy to theme with brand tokens |
| Styling | **Tailwind CSS v4** | Utility-first, trivial RTL with `dir` and logical properties |
| State / server sync | **TanStack Query v5** | Fine-grained cache invalidation for ATS Kanban |
| Forms | **React Hook Form + Zod** | Schema validation mirrors backend Zod schemas |
| Backend framework | **Node.js + Hono** | Lightweight, edge-ready, excellent TypeScript, ~10× faster than Express |
| ORM | **Drizzle ORM** | Type-safe, SQL-first, excellent migration tooling |
| Database | **PostgreSQL 16** | Row-level security, JSONB, full-text search, UUID generation |
| Job queue | **BullMQ + Redis 7** | Durable jobs for emails, webhooks, compliance eval, sync |
| Search | **Meilisearch** | Self-hosted, Arabic-aware, fast full-text on jobs and candidates |
| File storage | **MinIO** (S3-compatible, self-hosted on Hostinger) | Private buckets, signed URLs, encryption |
| Email | **Resend** (SMTP fallback) | Reliable, delivery webhooks, Arabic Unicode support |
| SMS | **Twilio** (Unifonic fallback for KSA) | KSA delivery, Arabic support |
| Auth | **Better Auth** | Multi-tenant aware, MFA support, session management |
| Caching | **Redis 7** | Session store, rate limiting, feature flags |
| Workflow engine | **Temporal.io** (self-hosted) | Durable workflows for approval chains, readiness cases, preboarding |
| AI/ML | **Anthropic Claude API** (claude-sonnet-5) | CV parsing, match scoring, draft generation — all human-reviewed |
| PDF generation | **Puppeteer** (headless) | Offer letters, audit exports |
| Monitoring | **OpenTelemetry → Grafana + Loki + Tempo** | Structured logs, traces, metrics |
| Error tracking | **Sentry** | Frontend + backend error capture |

#### A.1.2 Monorepo Structure

```
recruitment-chessboard/
├── apps/
│   ├── web/                    # Next.js — public portal + internal ATS
│   └── api/                    # Hono API server
├── packages/
│   ├── db/                     # Drizzle schema + migrations
│   ├── ai/                     # Claude integration, CV parser, matcher
│   ├── compliance/             # Rule engine
│   ├── workflow/               # Temporal workflow definitions
│   ├── email/                  # React Email templates (AR + EN)
│   ├── ui/                     # Shared shadcn components + brand tokens
│   ├── validators/             # Shared Zod schemas
│   └── config/                 # Environment + feature flags
├── infra/
│   ├── docker/
│   └── nginx/
└── scripts/
    └── migrate/
```

**Toolchain:** pnpm workspaces, Turborepo, TypeScript 5.x strict mode, ESLint + Prettier, Vitest, Playwright.

---

### A.2 Hostinger Cloud Enterprise Deployment

#### A.2.1 Server Layout

Hostinger Cloud Enterprise provides VPS-class Linux servers. Use Docker Compose for orchestration (no Kubernetes overhead for MVP scale).

```
┌─────────────────────────────────────────────────────┐
│  Nginx (reverse proxy + TLS termination)             │
│  recruitment.chessboard-systems.com                  │
│  → /          → Next.js web container (port 3000)    │
│  → /api/*     → Hono API container (port 4000)       │
│  → /minio/*   → MinIO console (internal only)        │
└─────────────────────────────────────────────────────┘
         │
┌────────┴────────────────────────────────────────────┐
│  Docker Compose services                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ next-web │ │ hono-api │ │ temporal-server      │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ postgres │ │  redis   │ │ meilisearch          │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  ┌──────────┐ ┌──────────┐                          │
│  │  minio   │ │  bullmq  │                          │
│  └──────────┘ └──────────┘                          │
└─────────────────────────────────────────────────────┘
```

#### A.2.2 Domain and TLS

```nginx
# /infra/nginx/recruitment.conf
server {
    listen 443 ssl http2;
    server_name recruitment.chessboard-systems.com;

    ssl_certificate     /etc/letsencrypt/live/recruitment.chessboard-systems.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recruitment.chessboard-systems.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location /api/ {
        proxy_pass http://hono-api:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://next-web:3000;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name recruitment.chessboard-systems.com;
    return 301 https://$server_name$request_uri;
}
```

Certificate via **Certbot (Let's Encrypt)**. Auto-renew cron.

#### A.2.3 Docker Compose (production)

```yaml
# infra/docker/docker-compose.prod.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: recruitment
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --save 60 1000
    volumes:
      - redis_data:/data
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    restart: unless-stopped

  meilisearch:
    image: getmeili/meilisearch:v1.9
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
    volumes:
      - meili_data:/meili_data
    restart: unless-stopped

  temporal:
    image: temporalio/auto-setup:1.24
    environment:
      DB: postgresql
      DB_PORT: 5432
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PWD: ${DB_PASSWORD}
      POSTGRES_SEEDS: postgres
    depends_on: [postgres]
    restart: unless-stopped

  hono-api:
    build:
      context: ../..
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/recruitment
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MEILI_HOST: http://meilisearch:7700
      TEMPORAL_ADDRESS: temporal:7233
    depends_on: [postgres, redis, minio, meilisearch, temporal]
    restart: unless-stopped

  next-web:
    build:
      context: ../..
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: https://recruitment.chessboard-systems.com/api
    depends_on: [hono-api]
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/recruitment.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [next-web, hono-api]
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
  meili_data:
```

---

### A.3 Branding System (Light Mode)

All design tokens are defined once in `packages/ui/tokens.ts` and consumed by Tailwind and CSS variables.

```css
/* packages/ui/globals.css — Light mode (default) */
:root {
  /* Brand */
  --brand-green:        #BBD42F;
  --brand-green-hover:  #C9F31D;
  --brand-dark:         #010101;
  --brand-white:        #FFFFFF;
  --brand-light-bg:     #F2F2F2;
  --brand-neutral:      #919396;

  /* Semantic surface */
  --bg-page:            #FFFFFF;
  --bg-surface:         #F2F2F2;
  --bg-surface-hover:   #E8E8E8;
  --bg-sidebar:         #FAFAFA;

  /* Text */
  --text-primary:       #010101;
  --text-secondary:     #54595F;
  --text-muted:         #919396;
  --text-inverse:       #FFFFFF;

  /* Accent */
  --accent:             #BBD42F;
  --accent-hover:       #C9F31D;
  --accent-foreground:  #010101;

  /* Status */
  --status-success:     #22c55e;
  --status-warning:     #f59e0b;
  --status-error:       #ef4444;
  --status-info:        #3b82f6;
  --status-blocked:     #ef4444;
  --status-pending:     #f59e0b;
  --status-pass:        #22c55e;
  --status-review:      #8b5cf6;

  /* Border */
  --border:             #E4E4E7;
  --border-focus:       #BBD42F;

  /* Typography */
  --font-body:          'Poppins', sans-serif;
  --font-arabic:        'IBM Plex Sans Arabic', sans-serif;
  --font-heading:       'Sora', sans-serif;
  --font-nav:           'Kanit', sans-serif;

  /* Layout */
  --radius-card:        1rem;      /* 16px — softer than brand's 25px for dense UI */
  --radius-btn:         0.5rem;
  --radius-input:       0.375rem;
  --max-width:          1140px;
  --sidebar-width:      260px;
}
```

```js
// tailwind.config.ts — extend with brand tokens
import type { Config } from 'tailwindcss'

export default {
  content: ['./apps/**/*.{tsx,ts}', './packages/ui/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green:   '#BBD42F',
          'green-hover': '#C9F31D',
          dark:    '#010101',
          neutral: '#919396',
          'light-bg': '#F2F2F2',
        },
      },
      fontFamily: {
        body:    ['Poppins', 'sans-serif'],
        arabic:  ['IBM Plex Sans Arabic', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
        nav:     ['Kanit', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        btn:  '0.5rem',
      },
    },
  },
} satisfies Config
```

**Font loading** (Next.js `layout.tsx`):
```tsx
import { Poppins, Sora, Kanit } from 'next/font/google'
// IBM Plex Sans Arabic loaded separately for Arabic locale
```

**RTL strategy**: Next.js middleware detects `Accept-Language` or explicit `?lang=ar` param. Sets `<html dir="rtl" lang="ar">` for Arabic. Tailwind's logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) handle flipping automatically.

---

## Part B — Domain Modules and Data Contracts

### B.1 Database Schema

All tables use PostgreSQL with Drizzle ORM. Every tenant-owned table includes `org_id uuid NOT NULL REFERENCES organizations(id)`.

#### B.1.1 Identity and Organizations

```sql
-- packages/db/schema/organizations.ts (Drizzle notation)

organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name_ar text NOT NULL,
  legal_name_en text NOT NULL,
  display_name_ar text,
  display_name_en text,
  cr_number     text,             -- commercial registration
  unified_number text,
  main_activity_code text,
  headquarters_city text,
  timezone      text NOT NULL DEFAULT 'Asia/Riyadh',
  currency      text NOT NULL DEFAULT 'SAR',
  default_language text NOT NULL DEFAULT 'ar',
  logo_file_id  uuid REFERENCES files(id),
  brand_settings jsonb DEFAULT '{}',
  privacy_controller_name text,
  privacy_contact_email text,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)

establishments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id),
  name_ar           text NOT NULL,
  name_en           text,
  government_reference text,      -- Qiwa/HRSD establishment ID
  cr_number         text,
  unified_number    text,
  activity_code     text,
  city              text,
  address           jsonb,
  operational_status text DEFAULT 'active',
  wp_compliance_indicator text,   -- work-permit status
  wage_protection_indicator text,
  last_reconciled_at timestamptz,
  evidence_file_id  uuid REFERENCES files(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
)

compliance_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  establishment_id uuid REFERENCES establishments(id),
  snapshot_date   date NOT NULL,
  source_type     text NOT NULL,   -- 'manual'|'imported'|'integration'
  nitaqat_category text,
  saudi_count     int,
  total_count     int,
  metrics_json    jsonb NOT NULL DEFAULT '{}',
  evidence_file_id uuid REFERENCES files(id),
  certified_by    uuid REFERENCES users(id),
  certified_at    timestamptz,
  immutable       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
)

-- After certify: trigger sets immutable=true, blocks all future UPDATEs via RLS policy
```

#### B.1.2 Users and RBAC

```sql
users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  email        text NOT NULL,
  name_ar      text,
  name_en      text NOT NULL,
  status       text NOT NULL DEFAULT 'active',   -- active|suspended|deprovisioned
  mfa_enabled  boolean DEFAULT false,
  last_login_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(org_id, email)
)

roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id  uuid REFERENCES organizations(id),  -- NULL = platform role
  name    text NOT NULL,
  is_system boolean DEFAULT false
)

role_permissions (
  role_id    uuid REFERENCES roles(id),
  permission text NOT NULL,   -- 'requisition.create', 'offer.approve', etc.
  scope      text NOT NULL,   -- 'own'|'assigned'|'department'|'org'|'platform'
  PRIMARY KEY (role_id, permission)
)

user_roles (
  user_id    uuid REFERENCES users(id),
  role_id    uuid REFERENCES roles(id),
  scope_type text,             -- optional override scope
  scope_id   uuid,             -- department_id, branch_id, etc.
  granted_by uuid REFERENCES users(id),
  expires_at timestamptz,      -- for temporary access (FR-RBAC-004)
  PRIMARY KEY (user_id, role_id)
)
```

Full permission list (maps to FR-RBAC-001):
```
requisition.create | requisition.approve | requisition.view_confidential
job.create | job.publish | job.close
candidate.view_basic | candidate.view_sensitive | candidate.export | candidate.merge
application.screen | application.advance | application.reject | application.bulk_action
interview.schedule | interview.score
offer.create | offer.approve | offer.withdraw
compliance.review | compliance.override
government_case.manage | government_case.view
privacy_request.manage | privacy_request.view
onboarding.manage | probation.decide
audit.view | audit.export
tenant.admin | platform.super_admin
```

#### B.1.3 Requisitions

```sql
job_requisitions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id),
  establishment_id      uuid REFERENCES establishments(id),
  branch_id             uuid REFERENCES organization_branches(id),
  department_id         uuid REFERENCES departments(id),
  cost_center_id        uuid REFERENCES cost_centers(id),
  title_ar              text NOT NULL,
  title_en              text NOT NULL,
  internal_title        text,
  public_title_ar       text,
  public_title_en       text,
  occupation_code       text NOT NULL,    -- Saudi ISCO/HRSD code
  headcount             int NOT NULL DEFAULT 1,
  filled_headcount      int DEFAULT 0,
  hiring_reason         text NOT NULL,   -- 'new_position'|'replacement'|'expansion'
  replacement_employee_id uuid,          -- access-controlled (FR-REQ-004)
  justification_ar      text,
  justification_en      text,
  employment_type       text NOT NULL,   -- 'full_time'|'part_time'|'contractor'|'temporary'
  work_mode             text,            -- 'onsite'|'hybrid'|'remote'
  contract_duration_months int,
  target_start_date     date,
  salary_min            numeric(14,2),
  salary_max            numeric(14,2),
  currency              text DEFAULT 'SAR',
  budget_source         text,
  budget_status         text DEFAULT 'pending', -- 'approved'|'pending'|'unbudgeted'
  nationality_strategy  text,            -- 'saudi_only'|'open'|'non_saudi_permitted'
  required_education    text,
  required_experience_years int,
  required_skills       jsonb DEFAULT '[]',
  required_licences     jsonb DEFAULT '[]',
  shift_details         jsonb,
  travel_required       boolean DEFAULT false,
  relocation_required   boolean DEFAULT false,
  confidentiality_level text DEFAULT 'standard', -- 'standard'|'confidential'|'executive'
  hiring_manager_id     uuid REFERENCES users(id),
  created_by            uuid NOT NULL REFERENCES users(id),
  status                text NOT NULL DEFAULT 'draft',
  version               int NOT NULL DEFAULT 1,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
)

-- Status enum: DRAFT | PENDING_BUDGET_REVIEW | PENDING_COMPLIANCE_REVIEW |
--   PENDING_APPROVAL | CHANGES_REQUESTED | APPROVED | APPROVED_WITH_CONDITIONS |
--   REJECTED | POSTING_IN_PROGRESS | OPEN | ON_HOLD | FILLED | CLOSED | CANCELLED

requisition_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES job_requisitions(id),
  version_no     int NOT NULL,
  snapshot_json  jsonb NOT NULL,
  changed_by     uuid REFERENCES users(id),
  change_reason  text,
  changed_at     timestamptz DEFAULT now()
)
```

#### B.1.4 Approvals (generic, reused for requisitions, offers, overrides)

```sql
approval_workflows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  name        text NOT NULL,
  resource_type text NOT NULL,   -- 'requisition'|'job'|'offer'|'compliance_override'
  conditions  jsonb NOT NULL,    -- JSON logic: salary_gt, grade_in, dept_eq, etc.
  steps_json  jsonb NOT NULL,    -- ordered steps with approver rules
  version     int DEFAULT 1,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
)

approval_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  resource_type       text NOT NULL,
  resource_id         uuid NOT NULL,
  workflow_version_id uuid REFERENCES approval_workflows(id),
  status              text NOT NULL DEFAULT 'pending',
  submitted_by        uuid REFERENCES users(id),
  submitted_at        timestamptz DEFAULT now(),
  completed_at        timestamptz
)

approval_steps (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid NOT NULL REFERENCES approval_requests(id),
  step_order          int NOT NULL,
  group_type          text NOT NULL,   -- 'sequential'|'parallel'|'any_one'|'majority'
  approver_type       text NOT NULL,   -- 'user'|'role'|'dynamic'
  approver_id         uuid,
  approver_role       text,
  status              text DEFAULT 'pending',
  decision            text,            -- 'approved'|'rejected'|'changes_requested'|'delegated'|'abstained'
  comments            text,
  decided_at          timestamptz,
  delegated_to        uuid REFERENCES users(id),
  sla_hours           int,
  reminder_sent_at    timestamptz,
  escalated_at        timestamptz
)
```

#### B.1.5 Compliance Rules and Evaluations

```sql
compliance_rules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code           text UNIQUE NOT NULL,
  category            text NOT NULL,      -- 'saudization'|'profession_lock'|'licence'|'salary'
  title_ar            text NOT NULL,
  title_en            text NOT NULL,
  description         text,
  applicability_json  jsonb NOT NULL,     -- activity codes, establishment sizes, occupation codes, etc.
  logic_json          jsonb NOT NULL,     -- executable rule definition
  severity            text NOT NULL,      -- 'blocking'|'warning'|'informational'
  automation_level    text NOT NULL,      -- 'full'|'partial'|'manual'
  confidence_level    text,
  effective_from      date NOT NULL,
  effective_to        date,
  grace_end           date,
  source_url          text,
  source_published_at date,
  review_due_at       date NOT NULL,
  status              text DEFAULT 'draft', -- 'draft'|'active'|'superseded'|'retired'
  version             int DEFAULT 1,
  approved_by         uuid REFERENCES users(id),
  approved_at         timestamptz,
  created_at          timestamptz DEFAULT now()
)

compliance_evaluations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id),
  resource_type        text NOT NULL,   -- 'requisition'|'application'|'readiness_case'
  resource_id          uuid NOT NULL,
  ruleset_snapshot     jsonb NOT NULL,  -- rule versions active at eval time
  overall_result       text NOT NULL,   -- PASS|PASS_WITH_WARNING|MANUAL_REVIEW_REQUIRED|BLOCKED|etc.
  evaluated_at         timestamptz DEFAULT now(),
  input_snapshot_json  jsonb NOT NULL,
  result_summary_json  jsonb NOT NULL,
  stale_rules_count    int DEFAULT 0,
  evaluated_by         text DEFAULT 'engine'  -- 'engine'|user_id
)

compliance_evaluation_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id       uuid NOT NULL REFERENCES compliance_evaluations(id),
  rule_id             uuid NOT NULL REFERENCES compliance_rules(id),
  rule_code           text NOT NULL,
  result              text NOT NULL,
  explanation_ar      text,
  explanation_en      text,
  evidence_json       jsonb,
  requires_manual_review boolean DEFAULT false
)

compliance_overrides (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id),
  evaluation_item_id    uuid NOT NULL REFERENCES compliance_evaluation_items(id),
  requested_by          uuid NOT NULL REFERENCES users(id),
  reason_code           text NOT NULL,
  justification         text NOT NULL,
  evidence_file_id      uuid REFERENCES files(id),
  status                text DEFAULT 'pending',  -- 'pending'|'approved'|'rejected'|'expired'
  approved_by           uuid REFERENCES users(id),
  approved_at           timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz DEFAULT now()
  -- Note: requested_by and approved_by MUST differ (FR-APR-005, BR-015)
)
```

#### B.1.6 Job Postings

```sql
job_postings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organizations(id),
  requisition_id          uuid REFERENCES job_requisitions(id),
  title_ar                text NOT NULL,
  title_en                text NOT NULL,
  public_slug             text UNIQUE NOT NULL,
  summary_ar              text,
  summary_en              text,
  responsibilities_ar     text,
  responsibilities_en     text,
  requirements_ar         text,
  requirements_en         text,
  preferred_qualifications_ar text,
  preferred_qualifications_en text,
  benefits_ar             text,
  benefits_en             text,
  occupation_code         text NOT NULL,
  employment_type         text NOT NULL,
  work_mode               text,
  city                    text,
  branch_id               uuid REFERENCES organization_branches(id),
  salary_visible          boolean DEFAULT false,
  salary_min              numeric(14,2),
  salary_max              numeric(14,2),
  openings                int DEFAULT 1,
  deadline                timestamptz,
  form_version_id         uuid REFERENCES application_form_versions(id),
  privacy_notice_version_id uuid NOT NULL REFERENCES privacy_notice_versions(id),
  compliance_evaluation_id uuid REFERENCES compliance_evaluations(id),
  accessibility_statement text,
  status                  text NOT NULL DEFAULT 'draft',
  publish_at              timestamptz,
  published_at            timestamptz,
  closed_at               timestamptz,
  created_by              uuid REFERENCES users(id),
  version                 int DEFAULT 1,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
)

-- SEO fields stored in job_posting_seo table (canonical, og, structured data)
```

#### B.1.7 Candidates and Applications

```sql
candidates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id),
  preferred_name    text,
  name_ar           text,
  name_en           text NOT NULL,
  email_normalized  text NOT NULL,
  email_original    text NOT NULL,
  phone_normalized  text,
  phone_original    text,
  current_city      text,
  current_country   text DEFAULT 'SA',
  preferred_language text DEFAULT 'ar',
  do_not_contact    boolean DEFAULT false,
  dnc_reason        text,
  dnc_set_by        uuid REFERENCES users(id),
  profile_status    text DEFAULT 'active',
  legacy_ref        text,          -- migration source ID
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(org_id, email_normalized)
)

candidate_sensitive_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id            uuid NOT NULL UNIQUE REFERENCES candidates(id),
  nationality             text,
  residency_class         text,    -- 'saudi'|'gcc'|'resident_iqama'|'overseas'
  date_of_birth_encrypted bytea,
  national_id_encrypted   bytea,
  iqama_encrypted         bytea,
  passport_encrypted      bytea,
  identity_expiry_date    date,
  work_authorization_status text,
  bank_iban_encrypted     bytea,
  bank_name               text,
  encryption_key_version  int DEFAULT 1,
  updated_at              timestamptz DEFAULT now()
  -- Access controlled by separate permission: candidate.view_sensitive
)

job_applications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organizations(id),
  job_posting_id          uuid NOT NULL REFERENCES job_postings(id),
  candidate_id            uuid NOT NULL REFERENCES candidates(id),
  source_id               uuid REFERENCES sourcing_channels(id),
  utm_params              jsonb,
  current_stage           text NOT NULL DEFAULT 'APPLIED',
  candidate_visible_status text DEFAULT 'under_review',
  assigned_recruiter_id   uuid REFERENCES users(id),
  eligibility_status      text,
  match_score             numeric(5,2),
  match_explanation_json  jsonb,
  compliance_status       text,
  applied_at              timestamptz DEFAULT now(),
  withdrawn_at            timestamptz,
  rejected_at             timestamptz,
  rejection_reason_id     uuid REFERENCES rejection_reasons(id),
  rejection_internal_note text,
  version                 int DEFAULT 1,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
)

application_stage_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES job_applications(id),
  from_stage     text,
  to_stage       text NOT NULL,
  reason_code    text,
  actor_id       uuid REFERENCES users(id),
  actor_type     text DEFAULT 'user',   -- 'user'|'system'|'candidate'
  occurred_at    timestamptz DEFAULT now(),
  correlation_id uuid,
  metadata_json  jsonb
)
-- Immutable — no UPDATE, no DELETE
```

#### B.1.8 Offers

```sql
offers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(id),
  application_id     uuid NOT NULL UNIQUE REFERENCES job_applications(id),
  current_version_id uuid REFERENCES offer_versions(id),
  status             text NOT NULL DEFAULT 'draft',
  approved_at        timestamptz,
  sent_at            timestamptz,
  viewed_at          timestamptz,
  responded_at       timestamptz,
  expires_at         timestamptz,
  created_at         timestamptz DEFAULT now()
)

offer_versions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id              uuid NOT NULL REFERENCES offers(id),
  version_no            int NOT NULL,
  job_title_ar          text,
  job_title_en          text,
  occupation_code       text,
  grade                 text,
  department_id         uuid,
  branch_id             uuid,
  reporting_manager_id  uuid,
  basic_salary          numeric(14,2) NOT NULL,
  housing_allowance     numeric(14,2) DEFAULT 0,
  transport_allowance   numeric(14,2) DEFAULT 0,
  other_allowances      jsonb DEFAULT '[]',
  total_package         numeric(14,2),
  medical_insurance_category text,
  annual_leave_days     int,
  working_hours_weekly  numeric(5,2),
  contract_type         text,
  contract_duration_months int,
  probation_months      int,
  proposed_start_date   date,
  relocation_support    text,
  conditions_json       jsonb DEFAULT '[]',
  terms_json            jsonb NOT NULL,
  document_file_id      uuid REFERENCES files(id),
  document_hash         text,
  status                text NOT NULL DEFAULT 'draft',
  created_by            uuid REFERENCES users(id),
  created_at            timestamptz DEFAULT now(),
  supersedes_version_id uuid REFERENCES offer_versions(id)
  -- Immutable after status transitions past 'draft'
)

offer_responses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_version_id uuid NOT NULL REFERENCES offer_versions(id),
  response         text NOT NULL,   -- 'accepted'|'declined'|'negotiation_requested'
  comments         text,
  responded_at     timestamptz DEFAULT now(),
  ip_hash          text,
  user_agent_hash  text,
  acceptance_hash  text,            -- SHA-256 of terms_json + responded_at
  evidence_json    jsonb
)
```

#### B.1.9 Employment Readiness Cases

```sql
employment_readiness_cases (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organizations(id),
  application_id           uuid NOT NULL UNIQUE REFERENCES job_applications(id),
  candidate_id             uuid NOT NULL REFERENCES candidates(id),
  branch_type              text NOT NULL,   -- SAUDI_CITIZEN|GCC_CITIZEN|NON_SAUDI_RESIDENT_TRANSFER|etc.
  accepted_offer_version_id uuid NOT NULL REFERENCES offer_versions(id),
  status                   text NOT NULL DEFAULT 'PREBOARDING_CASE_CREATED',
  readiness_score          numeric(5,2),    -- 0–100, SERE score
  mandatory_blockers       jsonb DEFAULT '[]',
  target_join_date         date,
  actual_join_date         date,
  owner_id                 uuid REFERENCES users(id),
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
)

government_cases (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  readiness_case_id   uuid NOT NULL REFERENCES employment_readiness_cases(id),
  case_type           text NOT NULL,   -- 'qiwa_contract'|'transfer'|'visa'|'work_permit'|'professional_verification'|'gosi'|'ajeer'
  establishment_id    uuid REFERENCES establishments(id),
  external_reference  text,
  status              text NOT NULL DEFAULT 'NOT_STARTED',
  submitted_at        timestamptz,
  completed_at        timestamptz,
  expires_at          timestamptz,
  owner_id            uuid REFERENCES users(id),
  last_reconciled_at  timestamptz,
  metadata_json       jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
)

qiwa_contract_cases (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  government_case_id     uuid NOT NULL UNIQUE REFERENCES government_cases(id),
  contract_reference     text,
  contract_version       int,
  status                 text NOT NULL DEFAULT 'NOT_STARTED',
  employee_response      text,
  submitted_at           timestamptz,
  documented_at          timestamptz,
  last_reconciled_at     timestamptz,
  contract_snapshot_json jsonb,
  evidence_file_id       uuid REFERENCES files(id)
)

contract_discrepancies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qiwa_contract_case_id uuid NOT NULL REFERENCES qiwa_contract_cases(id),
  field_name            text NOT NULL,
  internal_value_hash   text,
  external_value_hash   text,
  severity              text NOT NULL,  -- 'material'|'minor'
  status                text NOT NULL DEFAULT 'open',
  resolution            text,
  resolved_by           uuid REFERENCES users(id),
  resolved_at           timestamptz
)

readiness_checklist_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  readiness_case_id uuid NOT NULL REFERENCES employment_readiness_cases(id),
  item_type         text NOT NULL,
  mandatory         boolean DEFAULT true,
  status            text DEFAULT 'pending',
  owner_type        text,
  owner_id          uuid,
  due_at            timestamptz,
  completed_at      timestamptz,
  waived_by         uuid REFERENCES users(id),
  waiver_reason     text,
  evidence_file_id  uuid REFERENCES files(id),
  dependency_json   jsonb DEFAULT '[]'
)

joining_confirmations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  readiness_case_id uuid NOT NULL REFERENCES employment_readiness_cases(id),
  planned_date      date,
  actual_date       date,
  location_id       uuid,
  status            text NOT NULL DEFAULT 'pending',
  confirmed_by      uuid REFERENCES users(id),
  confirmed_at      timestamptz,
  identity_check_outcome text,
  attendance_confirmed boolean,
  documents_verified boolean,
  equipment_delivered boolean,
  notes             text
)
```

#### B.1.10 Files (central, all uploads)

```sql
files (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  storage_key         text NOT NULL UNIQUE,   -- MinIO object key
  original_name       text NOT NULL,
  content_type        text NOT NULL,
  size_bytes          bigint NOT NULL,
  sha256              text NOT NULL,
  malware_status      text DEFAULT 'pending', -- 'pending'|'clean'|'quarantined'
  encryption_metadata jsonb,
  visibility_class    text DEFAULT 'confidential',
  purpose             text,
  created_by          uuid REFERENCES users(id),
  created_at          timestamptz DEFAULT now()
)
-- Files are NEVER served directly. API generates short-lived signed MinIO URLs.
-- Quarantined files are inaccessible until cleared (FR-SEC-003, AC-078).
```

#### B.1.11 Communications and Audit

```sql
communications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  candidate_id        uuid REFERENCES candidates(id),
  application_id      uuid REFERENCES job_applications(id),
  readiness_case_id   uuid REFERENCES employment_readiness_cases(id),
  channel             text NOT NULL,   -- 'email'|'sms'|'portal'|'calendar'
  direction           text DEFAULT 'outbound',
  template_version_id uuid REFERENCES communication_template_versions(id),
  recipient           text NOT NULL,
  subject             text,
  body_preview        text,
  status              text DEFAULT 'queued',
  provider            text,
  provider_reference  text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  failed_at           timestamptz,
  failure_reason      text,
  idempotency_key     text UNIQUE
)

audit_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid,
  actor_type      text NOT NULL,   -- 'user'|'candidate'|'system'|'integration'
  actor_id        uuid,
  action          text NOT NULL,   -- 'create'|'view_sensitive'|'download'|'export'|'approve'|etc.
  resource_type   text NOT NULL,
  resource_id     uuid,
  occurred_at     timestamptz DEFAULT now(),
  ip_hash         text,
  user_agent_hash text,
  before_summary  jsonb,
  after_summary   jsonb,
  reason          text,
  correlation_id  uuid
)
-- Append-only. RLS: no DELETE, no UPDATE on this table — enforced at DB level.
```

---

### B.2 Compliance Rule Engine

The engine is a TypeScript module in `packages/compliance/`. Rules are stored as JSON logic in `compliance_rules.logic_json`. The engine evaluates rules against an input snapshot.

```typescript
// packages/compliance/engine.ts

export type ComplianceResult =
  | 'PASS'
  | 'PASS_WITH_WARNING'
  | 'MANUAL_REVIEW_REQUIRED'
  | 'BLOCKED'
  | 'OVERRIDE_PENDING'
  | 'OVERRIDE_APPROVED'
  | 'NOT_APPLICABLE'
  | 'DATA_INCOMPLETE'
  | 'RULE_STALE'

export interface EvaluationInput {
  org_id: string
  establishment_id: string
  occupation_code: string
  nationality_strategy: string
  candidate_nationality?: string
  candidate_residency_class?: string
  basic_salary?: number
  establishment_snapshot?: ComplianceSnapshot
}

export interface RuleEvaluation {
  rule_code: string
  result: ComplianceResult
  explanation_ar: string
  explanation_en: string
  evidence: Record<string, unknown>
  requires_manual_review: boolean
}

export async function evaluate(
  input: EvaluationInput,
  db: Database,
): Promise<{
  overall_result: ComplianceResult
  items: RuleEvaluation[]
  stale_rules_count: number
}> {
  const rules = await getActiveRules(input, db)
  const now = new Date()

  const items: RuleEvaluation[] = []
  let stale = 0

  for (const rule of rules) {
    if (rule.review_due_at < now && rule.status !== 'retired') {
      stale++
      items.push({
        rule_code: rule.rule_code,
        result: 'RULE_STALE',
        explanation_ar: 'القاعدة تجاوزت تاريخ المراجعة',
        explanation_en: 'Rule has passed its review date',
        evidence: { review_due_at: rule.review_due_at },
        requires_manual_review: true,
      })
      continue
    }
    items.push(evaluateSingleRule(rule, input))
  }

  const overall = deriveOverallResult(items)
  return { overall_result: overall, items, stale_rules_count: stale }
}
```

The rule logic JSON uses a simple condition-action format evaluated by a sandboxed interpreter (no `eval`), e.g.:

```json
{
  "conditions": {
    "occupation_code_in": ["2141", "2142", "2143"],
    "saudi_localization_percentage_lt": 100
  },
  "result": "BLOCKED",
  "explanation_ar": "هذه المهنة محجوزة للمواطنين السعوديين",
  "explanation_en": "This occupation is reserved for Saudi nationals"
}
```

---

### B.3 Temporal Workflow Definitions

Temporal handles all durable multi-step processes.

#### B.3.1 Approval Workflow

```typescript
// packages/workflow/src/approval.workflow.ts
import { defineWorkflow, defineActivity } from '@temporalio/workflow'

export const approvalWorkflow = defineWorkflow(
  async (input: ApprovalWorkflowInput) => {
    const { steps, resource_type, resource_id } = input

    for (const step of steps) {
      await createApprovalStep(step)
      await sendApproverNotification(step.approver_id)

      const result = await waitForApprovalDecision({
        step_id: step.id,
        sla_hours: step.sla_hours,
      })

      if (result.decision === 'rejected') {
        await markResourceStatus(resource_id, 'CHANGES_REQUESTED')
        return { outcome: 'rejected', step_id: step.id, reason: result.comments }
      }

      if (result.timed_out) {
        await escalateStep(step)
      }
    }

    await markResourceStatus(resource_id, 'APPROVED')
    return { outcome: 'approved' }
  }
)
```

#### B.3.2 Employment Readiness Workflow

```typescript
// packages/workflow/src/readiness.workflow.ts
export const readinessWorkflow = defineWorkflow(
  async (caseId: string) => {
    const readinessCase = await getReadinessCase(caseId)
    const branch = readinessCase.branch_type

    // Generate branch-specific tasks
    await generateReadinessTasks(caseId, branch)
    await calculateSereScore(caseId)

    // Wait loop — re-evaluate score every time a task completes
    while (true) {
      const status = await waitForTaskCompletion(caseId)

      if (status === 'ALL_MANDATORY_COMPLETE') {
        await setStatus(caseId, 'READY_TO_JOIN_REVIEW')
        const approval = await waitForReadyToJoinApproval(caseId)
        if (approval.approved) {
          await setStatus(caseId, 'READY_TO_JOIN')
          break
        }
      }

      if (status === 'CANCELLED') break
      await recalculateSereScore(caseId)
    }
  }
)
```

---

## Part C — UI Specification

### C.1 Application Shell

**Two distinct surfaces:**
1. **Public Portal** (`/careers/*`, `/apply/*`, `/offer/*`) — candidate-facing, mobile-first, full RTL support
2. **Internal ATS** (`/dashboard/*`) — recruiter/HR workspace, sidebar nav

#### C.1.1 Public Portal Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (sticky, bg-white, shadow-sm)                    │
│ [Chessboard Logo] ──────────────── [AR | EN]  [Login]  │
└─────────────────────────────────────────────────────────┘
│ PAGE CONTENT                                            │
└─────────────────────────────────────────────────────────┘
│ FOOTER (bg-[#010101], text-white)                       │
│ Logo · Links · Social · © Chessboard 2026              │
└─────────────────────────────────────────────────────────┘
```

RTL (`dir="rtl"`): logo flips to right, language toggle to left, all padding/margins invert via Tailwind logical properties.

#### C.1.2 Internal ATS Layout

```
┌──────────────────────────────────────────────────────────┐
│ TOPBAR (h-14, bg-white, border-b)                        │
│ [≡ Menu] [Chessboard Logo]  ───── [🔔] [Search] [Avatar]│
└──────────────────────────────────────────────────────────┘
│SIDEBAR(260px)    │  MAIN CONTENT                        │
│bg-[#FAFAFA]      │  bg-[#F2F2F2]                        │
│border-e          │                                       │
│                  │  PAGE HEADER (bg-white, border-b)    │
│  Navigation      │  Breadcrumb + Page Title + Actions   │
│  groups with     │                                       │
│  icon + label    │  CONTENT AREA                        │
│                  │  max-w-[1140px] mx-auto px-6         │
│  Active item:    │                                       │
│  bg-brand-green  │                                       │
│  text-[#010101]  │                                       │
└──────────────────┴──────────────────────────────────────┘
```

### C.2 Public Careers Portal

#### C.2.1 `/careers` — Job Board

```
HERO STRIP (bg-[#010101], text-white, py-16)
  "المسمى الوظيفي الذي تبحث عنه" — Large heading, Sora font
  Search bar [input] [🔍 Search] — accent border on focus
  Filter chips: القسم · المدينة · نوع العمل · نمط العمل

JOB COUNT BAR (bg-[#F2F2F2], py-3)
  "عرض 24 وظيفة"  ·  Sort dropdown

JOB GRID (2-col desktop, 1-col mobile, gap-6)
  ┌─────────────────────────────┐
  │ JOB CARD (bg-white, rounded-card, shadow-sm)
  │ [Company] · [Location badge]
  │ Job Title (Sora, 18px, #010101)
  │ Department · Employment Type · Work Mode
  │ ────────────────────────────
  │ Posted date          [Apply →]
  │               (bg-brand-green, rounded-btn)
  └─────────────────────────────┘

PAGINATION (centered, brand-green active page)
```

**Implementation:**
- Server-side rendered via Next.js App Router
- Meilisearch powers instant search and filters
- Structured data (`application/ld+json`, `JobPosting` schema) for SEO
- Canonical URL per job, sitemap auto-generation
- Only `PUBLISHED` jobs visible (enforced at query level)

#### C.2.2 `/careers/[slug]` — Job Detail

```
BREADCRUMB: الرئيسية / الوظائف / [Job Title]

JOB HEADER (bg-white, rounded-card, p-8)
  Job Title (Sora, 28px)
  [Department] [City] [Employment Type] [Work Mode]
  Application Deadline · Openings count
  [تقدم الآن] (lg primary button, brand-green)

TABS: التفاصيل | المتطلبات | عن الشركة

CONTENT BODY
  Responsibilities, Requirements, Benefits (prose, IBM Plex Sans Arabic)

FOOTER NOTE
  Privacy Notice link · Accessibility statement
```

#### C.2.3 Application Form

Multi-step wizard matching FR-CAN-002 and FR-CAN-003 (progressive data collection):

```
Step 1 — المعلومات الأساسية (Basic Info)
  Full name (AR + EN) · Email · Mobile
  Current city · Current country
  [Privacy notice acknowledgement checkbox — required]

Step 2 — المستندات (Documents)
  CV upload (PDF/DOCX, max 10MB)
  Additional files (optional)

Step 3 — أسئلة الوظيفة (Job Questions)
  Dynamic — rendered from form_version
  Conditional logic, file uploads per question

Step 4 — المراجعة والإرسال (Review & Submit)
  Summary of all entered data
  [Edit] per section
  [إرسال الطلب] — idempotency key prevents double submit

Confirmation Screen
  ✓ Reference number: REF-2026-XXXXX
  Expected next step description
  [تتبع طلبك] link to candidate portal
```

### C.3 Internal ATS

#### C.3.1 Sidebar Navigation Structure

```
LOGO (Chessboard)
──────────────────
📊  لوحة التحكم       /dashboard
👥  المرشحون          /dashboard/candidates
📋  الطلبات           /dashboard/applications
  └─ [Active Job filter]
💼  الوظائف           /dashboard/jobs
📝  طلبات التوظيف     /dashboard/requisitions
📜  العروض             /dashboard/offers
✅  الجاهزية الوظيفية  /dashboard/readiness
🏛️  الحالات الحكومية   /dashboard/government-cases
📆  المقابلات         /dashboard/interviews
──────────────────
📊  التقارير          /dashboard/analytics
⚙️  الإعدادات         /dashboard/settings
  ├─ المستخدمون
  ├─ الأدوار
  ├─ قواعد الامتثال
  ├─ القوالب
  └─ التكاملات
```

Active item: `bg-brand-green text-[#010101] font-semibold rounded-btn`.

#### C.3.2 Requisitions Board

**List view** with filters: Status · Department · Hiring Manager · Date · Compliance status

```
PAGE HEADER
  "طلبات التوظيف" [+ طلب جديد]

FILTER BAR
  [Status chips] [Department ▾] [Recruiter ▾] [Date range]

TABLE
  # | Title | Department | Status | Compliance | Approver | Created | Actions
  ─────────────────────────────────────────────────────────────────────────
  Each row: status badge (colored by state) · compliance badge
  Row click → Requisition Detail drawer
```

**Requisition Detail Drawer (side panel, 560px)**:
```
HEADER: Job Title · Status badge
TABS:
  التفاصيل | الامتثال | الموافقات | السجل

تفاصيل tab:
  All requisition fields in read-only form layout
  [تعديل] [إرسال للموافقة] [نشر وظيفة] CTAs

الامتثال tab:
  Compliance evaluation result card
  Per-rule breakdown with PASS/BLOCKED/WARNING icons
  [طلب مراجعة يدوية] [طلب استثناء] actions
  Source URL + last review date per rule

الموافقات tab:
  Approval chain visual (steps, current step highlighted)
  Each approver card: name, role, status, timestamp, comments

السجل tab:
  Timeline of all state transitions with actor + timestamp
```

#### C.3.3 ATS Kanban Board

```
JOB HEADER
  "مهندس برمجيات — فرع الرياض" · [24 طلب] · Compliance badge

KANBAN TOOLBAR
  [List ⊞] [Kanban ⊟]  [Filter ▾] [Assign ▾] [Bulk ▾]

KANBAN COLUMNS (horizontal scroll)
  Each column: Stage name · Count · SLA indicator (orange if overdue)

  APPLIED (12)          SCREENING (8)         SHORTLISTED (4)   ...
  ┌────────────┐        ┌────────────┐
  │ CARD       │        │ CARD       │
  │ Ahmed A.   │        │ Sara M.    │
  │ Score: 82  │        │ Score: 74  │
  │ 🟡 3 days  │        │ 🟢 PASS    │
  │ [View]     │        │ [View]     │
  └────────────┘        └────────────┘

  Drag-and-drop validated against gate rules.
  Blocked transition: toast with gate explanation.
```

Card colors: compliance badge `bg-green-100 text-green-800` / `bg-red-100 text-red-800` / `bg-yellow-100 text-yellow-800`.

#### C.3.4 Candidate Detail Workspace

Full-width page at `/dashboard/applications/[id]`:

```
HEADER
  [← Back to Kanban]
  Ahmed Abdullah  ·  مهندس برمجيات  ·  [Status badge]
  [Advance Stage ▾] [Reject] [Add Note] [Send Message]

TABS ROW
  نظرة عامة | السيرة الذاتية | الأسئلة | الأهلية | التقييم |
  المقابلات | التواصل | الامتثال | الحالات الحكومية |
  المستندات | السجل | الخصوصية

──── نظرة عامة ────
  LEFT COLUMN (360px)
    Contact info (phone masked unless has_permission)
    Source attribution
    Application timeline
    Assigned recruiter
    SLA indicator

  RIGHT COLUMN
    Match Score card (component breakdown visual)
    Next required action
    Open blockers list

──── السيرة الذاتية ────
  CV viewer (PDF embed) + parsed profile
  Parsed fields editable with provenance indicator
  Original file always available

──── الامتثال ────
  Compliance evaluation result
  Per-rule results with evidence
  Override panel (if permitted)
  SERE readiness score (after offer acceptance)

──── الحالات الحكومية ────
  Case cards: Qiwa contract · Transfer · Visa · GOSI · Permits
  Each card: status, external reference, owner, SLA, actions
  [+ إضافة حالة] for government relations team
```

#### C.3.5 Offer Management

```
/dashboard/applications/[id]/offer

OFFER HEADER
  Version 2 of 3  ·  Status: PENDING_APPROVAL
  [View version history]

OFFER PACKAGE (read-only in review, editable in draft)
  Job Title · Grade · Department
  الراتب الأساسي: 18,000 SAR
  بدل السكن: 3,000 SAR
  بدل المواصلات: 800 SAR
  المجموع: 21,800 SAR/شهر

  Contract type · Probation period · Start date
  Medical insurance category · Annual leave
  Conditions (list)

APPROVAL CHAIN STATUS
  [Step 1: Recruiter ✓] → [Step 2: HR Manager ⏳] → [Step 3: Finance pending]

ACTIONS
  [إرسال للموافقة] [معاينة عرض المرشح] [سحب العرض]
```

**Candidate offer view** (`/offer/[secure-token]`):
```
CLEAN BRANDED PAGE (public, no auth required, token-validated)
  Chessboard Logo
  "مرحباً Ahmed، يسعدنا تقديم هذا العرض لك"

  OFFER SUMMARY TABLE
  [قبول العرض] [طلب التفاوض] [رفض العرض]

  Expiry countdown: "ينتهي العرض خلال 5 أيام"
  Privacy note
```

#### C.3.6 Employment Readiness Dashboard

```
/dashboard/readiness/[case-id]

SERE SCORE HEADER
  Ahmed Abdullah — Procurement Specialist
  Readiness: 72% ████████░░  BLOCKED

  Critical Blockers (red cards):
  ❌ Profession localization review required → [Compliance Officer: Mohamed]
  ❌ Qiwa contract not submitted → [Gov. Relations: Nora]
  ❌ GOSI wage data not prepared → [Payroll: Ahmed]

  Warnings (yellow cards):
  ⚠️  Bank details not collected (due in 5 days)

CHECKLIST SECTIONS (accordion)
  ✅ Compliance Readiness (25%) — 25/25
  ❌ Contract Readiness (20%) — 0/20 — BLOCKED
  ❌ Government Process (20%) — 0/20 — BLOCKED
  ⏳ Payroll/GOSI (15%) — 5/15
  ⏳ Candidate Docs (10%) — 6/10
  ✅ Internal Onboarding (10%) — 10/10

CHECKLIST ITEM DETAIL (expandable)
  Task name · Owner · Due date · Status · Evidence · [Complete] [Waive]

TIMELINE
  Accepted offer: 2026-07-28
  Preboarding case created: 2026-07-28
  Target join date: 2026-09-01
  Days remaining: 28
```

---

## Part D — API Surface

### D.1 API Design Conventions

- Base URL: `https://recruitment.chessboard-systems.com/api/v1`
- Auth: Bearer JWT (Better Auth) on all `/api/*` except `/api/public/*`
- Tenant scoping: JWT contains `org_id`; all queries filter by it
- Idempotency: `Idempotency-Key` header required for POST/PATCH on mutations
- Pagination: `?page=1&limit=25` with `X-Total-Count` response header
- Errors: structured JSON (bilingual) matching BRD §15.3
- Optimistic concurrency: `version` field on mutable resources; 409 on conflict

### D.2 Core Endpoint Groups

```
# Organization
GET    /api/v1/org
PATCH  /api/v1/org
GET    /api/v1/org/establishments
POST   /api/v1/org/establishments
POST   /api/v1/org/compliance-snapshots

# Requisitions
GET    /api/v1/requisitions
POST   /api/v1/requisitions
GET    /api/v1/requisitions/:id
PATCH  /api/v1/requisitions/:id
POST   /api/v1/requisitions/:id/submit
POST   /api/v1/requisitions/:id/compliance-check
GET    /api/v1/requisitions/:id/approvals

# Jobs
GET    /api/v1/jobs
POST   /api/v1/jobs
GET    /api/v1/jobs/:id
PATCH  /api/v1/jobs/:id
POST   /api/v1/jobs/:id/publish
POST   /api/v1/jobs/:id/pause
POST   /api/v1/jobs/:id/close

# Public portal (no auth)
GET    /api/v1/public/careers
GET    /api/v1/public/careers/:slug
POST   /api/v1/public/careers/:slug/apply
GET    /api/v1/public/careers/:slug/form

# Candidates
GET    /api/v1/candidates
GET    /api/v1/candidates/:id
PATCH  /api/v1/candidates/:id
POST   /api/v1/candidates/:id/merge
GET    /api/v1/candidates/:id/applications
GET    /api/v1/candidates/:id/documents
POST   /api/v1/candidates/:id/privacy-requests
GET    /api/v1/candidates/duplicates

# Applications
GET    /api/v1/applications
GET    /api/v1/applications/:id
POST   /api/v1/applications/:id/transition
POST   /api/v1/applications/:id/assign
GET    /api/v1/applications/:id/screening
POST   /api/v1/applications/:id/screenings
GET    /api/v1/applications/:id/assessments
POST   /api/v1/applications/:id/assessments
GET    /api/v1/applications/:id/interviews
POST   /api/v1/applications/:id/interviews
POST   /api/v1/applications/:id/selection
POST   /api/v1/applications/bulk-transition

# Offers
GET    /api/v1/offers
POST   /api/v1/offers
GET    /api/v1/offers/:id
GET    /api/v1/offers/:id/versions
POST   /api/v1/offers/:id/versions
POST   /api/v1/offers/:id/submit-approval
POST   /api/v1/offers/:id/send
POST   /api/v1/offers/:id/withdraw
POST   /api/v1/public/offers/:token/respond  # candidate response, no auth

# Compliance
GET    /api/v1/compliance/rules
POST   /api/v1/compliance/rules
PATCH  /api/v1/compliance/rules/:id
POST   /api/v1/compliance/evaluate
GET    /api/v1/compliance/evaluations/:id
POST   /api/v1/compliance/overrides

# Employment Readiness
GET    /api/v1/readiness-cases
GET    /api/v1/readiness-cases/:id
POST   /api/v1/readiness-cases/:id/evaluate-sere
GET    /api/v1/readiness-cases/:id/checklist
PATCH  /api/v1/readiness-cases/:id/checklist/:item_id
GET    /api/v1/readiness-cases/:id/government-cases
POST   /api/v1/readiness-cases/:id/government-cases
PATCH  /api/v1/readiness-cases/:id/government-cases/:case_id
POST   /api/v1/readiness-cases/:id/ready-to-join
POST   /api/v1/readiness-cases/:id/confirm-joining
POST   /api/v1/readiness-cases/:id/no-show

# Interviews
GET    /api/v1/interviews
POST   /api/v1/interviews
PATCH  /api/v1/interviews/:id
DELETE /api/v1/interviews/:id
POST   /api/v1/interviews/:id/scorecards
GET    /api/v1/interviews/:id/scorecards  # hides others before submission if independent mode

# Analytics
GET    /api/v1/analytics/executive-dashboard
GET    /api/v1/analytics/recruiter-dashboard
GET    /api/v1/analytics/compliance-dashboard
GET    /api/v1/analytics/source-analytics
GET    /api/v1/analytics/funnel
GET    /api/v1/analytics/time-to-fill

# Webhooks (inbound from providers)
POST   /api/v1/webhooks/email-provider
POST   /api/v1/webhooks/sms-provider
POST   /api/v1/webhooks/assessment/:provider
POST   /api/v1/webhooks/calendar

# Files
POST   /api/v1/files/upload       # returns upload URL + file_id
GET    /api/v1/files/:id/download # returns short-lived signed URL
DELETE /api/v1/files/:id          # soft delete + MinIO delete

# Privacy
POST   /api/v1/privacy/requests
GET    /api/v1/privacy/requests
PATCH  /api/v1/privacy/requests/:id
GET    /api/v1/privacy/notices    # current active notices
GET    /api/v1/privacy/retention-due  # records due for deletion

# Audit
GET    /api/v1/audit/events       # filtered, paginated, scoped to org
GET    /api/v1/audit/events/export  # permission-checked, logged
```

### D.3 Webhook Event Payload Standard

```json
{
  "event_id": "uuid",
  "event_type": "offer.accepted",
  "event_version": "1.0",
  "org_id": "uuid",
  "occurred_at": "2026-08-04T10:00:00Z",
  "correlation_id": "uuid",
  "actor": { "type": "candidate", "id": "uuid" },
  "resource": {
    "type": "offer",
    "id": "uuid",
    "version": 3
  },
  "payload": {}
}
```

---

## Part E — Security, Privacy, and Compliance Implementation

### E.1 Authentication (Better Auth)

```typescript
// apps/api/src/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { multiTenant, mfa } from 'better-auth/plugins'

export const auth = betterAuth({
  database: drizzleAdapter(db),
  plugins: [
    multiTenant({ orgField: 'org_id' }),
    mfa({ required_for_roles: ['compliance_officer', 'privacy_officer', 'tenant_admin', 'platform_super_admin'] }),
  ],
  session: {
    expiresIn: 8 * 60 * 60,         // 8 hours
    updateAge: 60 * 60,              // refresh every hour
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    window: 60,
    max: 100,
    customRules: {
      '/api/v1/public/careers/*/apply': { window: 60, max: 10 },
    },
  },
})
```

### E.2 Row-Level Security (PostgreSQL)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON job_applications
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Audit events: append-only
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_no_delete ON audit_events
  FOR DELETE USING (false);
CREATE POLICY audit_no_update ON audit_events
  FOR UPDATE USING (false);

-- Sensitive profiles: separate permission check
ALTER TABLE candidate_sensitive_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY sensitive_access ON candidate_sensitive_profiles
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = current_setting('app.current_user_id')::uuid
      AND permission = 'candidate.view_sensitive'
    )
  );
```

### E.3 File Security

All uploads go through a two-phase process:

1. Client requests an upload URL from `/api/v1/files/upload`
2. API creates a `files` record with `malware_status = 'pending'`, returns a short-lived presigned MinIO PUT URL
3. Client uploads directly to MinIO
4. MinIO bucket notification triggers a BullMQ job to scan with ClamAV
5. After scan: update `malware_status` to `'clean'` or `'quarantined'`
6. Only `clean` files are servable via signed download URLs (15-minute expiry)

### E.4 PDPL Implementation

```typescript
// packages/privacy/retention.ts
export async function identifyRetentionDue(db: Database): Promise<CandidateRecord[]> {
  // Query candidates where retention period has elapsed
  // based on application outcome + retention_policies table
  // Returns records for DPO review before destruction
}

export async function anonymizeCandidate(
  candidateId: string,
  db: Database,
  approvedBy: string,
): Promise<void> {
  // Replace PII fields with anonymized tokens
  // Delete files from MinIO
  // Retain audit log entry without PII content
  // Create audit event: action='anonymize', resource_type='candidate'
}
```

Privacy rights request flow (FR-PRV-006):
1. Candidate submits request via portal or email
2. System creates `privacy_requests` record, sends confirmation
3. SLA timer starts (configurable, default 30 days)
4. Privacy Officer assigned, receives in-app notification
5. Identity verification step (for access/obtain/destroy requests)
6. Decision + response document created
7. For destruction: calls `anonymizeCandidate` after approval
8. Audit event logged throughout

### E.5 Data Encryption

Field-level encryption for Highly Confidential class:

```typescript
// packages/db/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const KEY_VERSION = 1
// Keys stored in environment variables (never in code or DB)
// Rotation: increment KEY_VERSION, re-encrypt affected rows in migration

export function encryptField(value: string): Buffer {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', getKey(KEY_VERSION), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Store: KEY_VERSION(1 byte) + IV(16 bytes) + AuthTag(16 bytes) + Ciphertext
  return Buffer.concat([Buffer.from([KEY_VERSION]), iv, authTag, encrypted])
}

export function decryptField(data: Buffer): string {
  const keyVersion = data[0]
  const iv = data.slice(1, 17)
  const authTag = data.slice(17, 33)
  const ciphertext = data.slice(33)
  const decipher = createDecipheriv('aes-256-gcm', getKey(keyVersion), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
```

Encrypted fields: `national_id`, `iqama`, `passport`, `date_of_birth`, `bank_iban`.

---

## Part F — Testing, Migration, and CI/CD

### F.1 Testing Strategy

| Layer | Tool | Coverage Target |
|---|---|---|
| Unit (validators, rule engine, pure functions) | Vitest | 90%+ |
| Integration (API routes + DB) | Vitest + testcontainers (real PostgreSQL) | Core flows |
| E2E (full browser flows) | Playwright | All acceptance criteria (AC-001 to AC-088) |
| Accessibility | Playwright + axe-core | WCAG 2.2 AA |
| Security | OWASP ZAP (CI), Snyk (deps) | Before each release |
| Performance | Lighthouse CI, k6 load tests | NFR targets §17.1 |
| RTL/i18n | Playwright with `lang=ar` | All public + ATS core flows |

E2E test example mapping to AC-043:
```typescript
// tests/e2e/offer-acceptance.spec.ts
test('AC-043: accepted offer does not create active employee', async ({ page }) => {
  await acceptOffer(page, testOffer)
  const employee = await db.query.employees.findFirst({
    where: eq(employees.source_readiness_case_id, testCase.id)
  })
  expect(employee).toBeNull()
  const readinessCase = await db.query.employmentReadinessCases.findFirst({...})
  expect(readinessCase?.status).toBe('PREBOARDING_CASE_CREATED')
})
```

### F.2 Migration Plan

Migration from existing recruitment module (BRD §22):

```
scripts/migrate/
  01_export_legacy_data.ts      # Export current DB to JSON
  02_normalize_candidates.ts    # Normalize emails/phones, detect duplicates
  03_map_statuses.ts            # Legacy → new status mapping table
  04_import_candidates.ts       # Insert candidates with legacy_ref
  05_import_applications.ts     # Import applications with stage events
  06_import_documents.ts        # Copy files to MinIO, scan, create file records
  07_import_templates.ts        # Job templates
  08_reconciliation_report.ts   # Count validation, orphan detection
  09_duplicate_queue.ts         # Load uncertain merges into review queue
```

Rules:
- Legacy source IDs stored in `legacy_ref` columns
- Migrated files go through malware scan before becoming available
- Uncertain duplicate candidates created with `profile_status = 'pending_dedup_review'`
- All migrated data flagged with `source = 'migration'` in stage events
- Rollback: rename tables rather than delete; keep old module accessible read-only for 30 days

### F.3 CI/CD Pipeline

```yaml
# .github/workflows/main.yml
on:
  push:
    branches: [main, staging]
  pull_request:

jobs:
  quality:
    steps:
      - TypeScript type check (tsc --noEmit)
      - ESLint + Prettier check
      - Vitest (unit + integration with testcontainers)
      - Snyk dependency scan
      - Secret scanning (gitleaks)

  e2e:
    needs: quality
    steps:
      - Docker Compose test environment
      - Playwright E2E suite
      - Accessibility checks (axe-core)
      - Lighthouse CI

  deploy_staging:
    needs: e2e
    if: branch == 'staging'
    steps:
      - Build Docker images
      - Push to Hostinger registry
      - SSH deploy to staging server
      - Run smoke tests

  deploy_production:
    needs: e2e
    if: branch == 'main'
    steps:
      - Manual approval gate
      - Build Docker images
      - Push to Hostinger registry
      - Blue-green deploy on Hostinger Cloud
      - Run migration scripts
      - Health check
      - Rollback on failure
```

**Blue-green on Hostinger**: spin up new container set, health check passes → switch Nginx upstream → drain old containers. Rollback = revert Nginx upstream, keep old containers warm for 10 minutes.

---

## Part G — SERE (Saudi Employment Readiness Engine)

Implements BRD §11 in full.

### G.1 Score Calculation

```typescript
// packages/compliance/sere.ts

const WEIGHTS = {
  compliance_readiness:       0.25,
  contract_readiness:         0.20,
  government_process:         0.20,
  payroll_gosi:               0.15,
  candidate_docs:             0.10,
  internal_onboarding:        0.10,
}

export async function calculateSereScore(
  caseId: string,
  db: Database,
): Promise<SereScore> {
  const items = await getChecklistItems(caseId, db)

  const scores: Record<string, number> = {}
  for (const [category, weight] of Object.entries(WEIGHTS)) {
    const categoryItems = items.filter(i => i.category === category)
    if (categoryItems.length === 0) { scores[category] = weight * 100; continue }
    const completed = categoryItems.filter(i => i.status === 'completed' || i.status === 'waived').length
    scores[category] = weight * 100 * (completed / categoryItems.length)
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)

  // Mandatory blockers override numeric score
  const blockers = items.filter(i => i.mandatory && i.status !== 'completed' && i.status !== 'waived')

  return {
    score: Math.round(total),
    blocked: blockers.length > 0,
    blockers: blockers.map(b => ({
      item_type: b.item_type,
      owner_id: b.owner_id,
      owner_type: b.owner_type,
    })),
    category_scores: scores,
    disclaimer: 'This score is not a legal conclusion. Any mandatory blocker overrides the numeric score.',
    disclaimer_ar: 'هذه النسبة ليست خلاصة قانونية. أي مانع إلزامي يلغي النسبة العددية.',
  }
}
```

### G.2 Branch-Specific Task Generation

When a readiness case is created (triggered by `offer.accepted` event):

```typescript
// packages/workflow/src/readiness-tasks.ts
export async function generateReadinessTasks(
  caseId: string,
  branch: CandidateBranch,
  db: Database,
): Promise<void> {
  const templates = await getReadinessTemplate(branch, db)
  // Templates configured per branch type in admin settings
  // Each template item → readiness_checklist_items row
  // Task owners: HR, GovRelations, Payroll, IT, Facilities, Candidate

  for (const item of templates) {
    await db.insert(readinessChecklistItems).values({
      readiness_case_id: caseId,
      item_type: item.type,
      mandatory: item.mandatory,
      owner_type: item.owner_type,
      owner_id: resolveOwner(item.owner_type, caseId, db),
      due_at: calculateDueDate(item.sla_days),
      dependency_json: item.dependencies,
    })
  }
}
```

---

## Part H — Notification System

### H.1 Queue Architecture

All notifications go through BullMQ:

```
notification-queue
  ├── email-job       → Resend API
  ├── sms-job         → Twilio API
  ├── in-app-job      → PostgreSQL notifications table + WebSocket push
  └── calendar-job    → Google/M365 Calendar API
```

Each job: 3 retries with exponential backoff, dead-letter queue after exhaustion, creates recruiter action on DLQ entry (FR-COM-005).

### H.2 Template System

Templates stored in `communication_template_versions`. Bilingual (AR + EN). Variables in `{{ variable_name }}` format. Arabic templates validated for RTL rendering before activation.

Trigger examples mapped to BRD §21:
```typescript
// packages/notifications/triggers.ts
export const notificationTriggers: Record<string, NotificationConfig> = {
  'offer.accepted': {
    recipients: ['recruiter', 'hr_manager', 'compliance_officer'],
    channels: ['in_app', 'email'],
    template: 'offer_accepted_internal',
    priority: 'high',
  },
  'compliance.blocked': {
    recipients: ['recruiter', 'compliance_owner'],
    channels: ['in_app', 'email'],
    template: 'compliance_blocked',
    priority: 'urgent',
  },
  'government_case.overdue': {
    recipients: ['government_relations_owner'],
    channels: ['in_app', 'email'],
    template: 'government_case_overdue',
    sla_based: true,
  },
  // ... all 23 events from BRD notification matrix
}
```

---

## Part I — Analytics Implementation

### I.1 Materialized Views

Heavy dashboard queries use PostgreSQL materialized views, refreshed every 5 minutes via BullMQ cron job.

```sql
-- funnel_metrics: pre-aggregated per org per job per day
CREATE MATERIALIZED VIEW funnel_metrics AS
SELECT
  org_id,
  job_posting_id,
  DATE(applied_at) as date,
  COUNT(*) FILTER (WHERE current_stage = 'APPLIED') as applied,
  COUNT(*) FILTER (WHERE current_stage IN ('RECRUITER_SCREENING','SHORTLISTED')) as screening,
  COUNT(*) FILTER (WHERE current_stage LIKE 'INTERVIEW%') as interviewing,
  COUNT(*) FILTER (WHERE current_stage = 'OFFER_ACCEPTED') as offer_accepted,
  COUNT(*) FILTER (WHERE current_stage = 'JOINED') as joined
FROM job_applications
GROUP BY org_id, job_posting_id, DATE(applied_at);

CREATE UNIQUE INDEX ON funnel_metrics (org_id, job_posting_id, date);
```

### I.2 Time-to-Fill Calculation

```sql
-- Uses application_stage_events for precision (BRD §20.3)
SELECT
  req.id,
  MIN(jp.published_at) as first_published,
  MIN(jc.actual_date) as first_join,
  EXTRACT(DAY FROM MIN(jc.actual_date) - MIN(jp.published_at)) as time_to_fill_days
FROM job_requisitions req
JOIN job_postings jp ON jp.requisition_id = req.id
JOIN job_applications ja ON ja.job_posting_id = jp.id
JOIN employment_readiness_cases erc ON erc.application_id = ja.id
JOIN joining_confirmations jc ON jc.readiness_case_id = erc.id
WHERE jc.status = 'confirmed'
GROUP BY req.id;
```

---

## Part J — Implementation Sequence (Sprint Plan)

### Sprint 0 (Week 1–2): Foundation
- Monorepo setup, Docker Compose, CI pipeline
- Drizzle schema: organizations, users, roles, files
- Better Auth integration
- Brand tokens, Tailwind config, font loading
- Base layout components (shell, sidebar, topbar)
- Nginx + TLS on Hostinger

### Sprint 1 (Week 3–4): Organization and Compliance Framework
- Organization + establishment CRUD
- Compliance snapshot management
- Compliance rule registry (CRUD, versioning)
- Compliance engine (rule evaluation, stale detection)
- RBAC (roles, permissions, user-roles)
- Audit event system

### Sprint 2 (Week 5–6): Requisitions and Approvals
- Requisition CRUD + versioning
- Approval workflow builder
- Temporal approval workflow
- Compliance pre-check integration
- Requisition UI (list, detail drawer, compliance tab)

### Sprint 3 (Week 7–8): Job Postings and Public Portal
- Job posting CRUD + form builder
- Public careers portal (`/careers`, `/careers/[slug]`)
- Meilisearch indexing
- SEO (structured data, sitemap, meta)
- RTL/LTR toggle and testing
- WCAG 2.2 AA pass on public pages

### Sprint 4 (Week 9–10): Candidate Applications
- Application form (multi-step, guest flow)
- Candidate profile creation
- Duplicate detection + review queue
- Application confirmation + magic-link portal
- Privacy notice versioning + acknowledgement capture

### Sprint 5 (Week 11–12): ATS Core
- Kanban board with drag-and-drop + gate validation
- List view with filters, saved views, bulk actions
- Candidate detail workspace (all tabs)
- Stage transition enforcement
- CV parser (Claude API integration)
- Explainable match score UI

### Sprint 6 (Week 13–14): Interviews and Assessments
- Interview scheduling (availability, time zones)
- Interview invitations (email + calendar)
- Scorecard creation and independent submission
- Assessment configuration and provider webhook handler
- Conflict of interest workflow

### Sprint 7 (Week 15–16): Selection and Offers
- Final selection UI (candidate comparison)
- Pre-offer checks tracking
- Offer package builder + versioning
- Offer approval chain
- Secure candidate offer portal (`/offer/[token]`)
- Offer response tracking + electronic evidence

### Sprint 8 (Week 17–18): Employment Readiness Core
- Preboarding case creation on offer acceptance
- Branch classification + task generation
- Readiness checklist UI
- SERE score calculation
- Government case tracking (Qiwa, Transfer, Visa, GOSI)
- Qiwa contract case + discrepancy detection
- Ready-to-join gate enforcement
- Joining confirmation + employee activation

### Sprint 9 (Week 19–20): Preboarding, Onboarding, Probation
- Preboarding task orchestration (Temporal)
- Candidate preboarding portal tasks
- Onboarding plan templates
- Probation case + review checkpoints
- Quality-of-hire score
- No-show workflow

### Sprint 10 (Week 21–22): Communications and Notifications
- BullMQ email/SMS queue
- All 23 notification triggers from BRD matrix
- Bilingual template editor with preview
- Communication log UI
- Suppression list, bounce handling

### Sprint 11 (Week 23–24): Analytics and Privacy
- Executive dashboard materialized views
- Recruiter dashboard
- Compliance dashboard
- Source analytics
- Privacy rights request workflow
- Retention policy engine + disposition reports
- Data breach workflow

### Sprint 12 (Week 25–26): Migration, Security Hardening, Launch
- Legacy data migration scripts
- Reconciliation reports and dedup queue resolution
- Penetration test (OWASP ZAP + manual)
- Full E2E test suite pass (all AC-001–AC-088)
- Load testing (k6, NFR targets)
- RTL/i18n QA pass
- Runbook documentation
- Production deployment + DNS cutover to `recruitment.chessboard-systems.com`

---

## Part K — Environment Variables

```bash
# .env.production (stored in Hostinger secrets manager, never in git)

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/recruitment
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://:pass@localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=recruitment-files

# Meilisearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=...

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=recruitment

# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://recruitment.chessboard-systems.com

# Email
RESEND_API_KEY=...
EMAIL_FROM=recruitment@chessboard-systems.com

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...

# AI
ANTHROPIC_API_KEY=...
AI_MODEL=claude-sonnet-5

# Encryption
FIELD_ENCRYPTION_KEY_V1=...   # 32 bytes, hex-encoded

# Public URL
NEXT_PUBLIC_APP_URL=https://recruitment.chessboard-systems.com
NEXT_PUBLIC_API_URL=https://recruitment.chessboard-systems.com/api/v1
```

---

## Appendix: BRD Requirement Coverage Matrix

| BRD Section | Implementation Location |
|---|---|
| FR-ORG-001–004 | Part B §B.1.1, Sprint 1 |
| FR-REQ-001–005 | Part B §B.1.3, Sprint 2 |
| FR-CMP-001–008 | Part B §B.1.5 + §B.2, Sprint 1–2 |
| FR-APR-001–005 | Part B §B.1.4 + §B.3.1, Sprint 2 |
| FR-JOB-001–005 | Part B §B.1.6, Sprint 3 |
| FR-SRC-001–006 | Part D §D.2, Sprint 3 |
| FR-PORT-001–005 | Part C §C.2, Sprint 3 |
| FR-CAN-001–008 | Part C §C.2.3, Sprint 4 |
| FR-DUP-001–004 | Part B §B.1.7 + API, Sprint 4 |
| FR-SCR-001–007 | Part C §C.3.4 + AI module, Sprint 5 |
| FR-ATS-001–008 | Part C §C.3.3–C.3.4, Sprint 5 |
| FR-TAL-001–006 | Part D §D.2 + Sprint 5 |
| FR-ASM-001–005 | Sprint 6 |
| FR-INT-001–008 | Part C §C.3.4, Sprint 6 |
| FR-SEL-001–004 | Part C §C.3.4, Sprint 7 |
| FR-CHK-001–004 | Sprint 7 |
| FR-OFR-001–008 | Part C §C.3.5, Sprint 7 |
| FR-PRE-001–003 | Part B §B.1.9, Sprint 8 |
| FR-KSA-001–004 | Part G + Sprint 8 |
| FR-TRN-001–004 | Part B §B.1.9, Sprint 8 |
| FR-VIS-001–005 | Sprint 8 |
| FR-QIW-001–005 | Part B §B.1.9, Sprint 8 |
| FR-GOV-001–006 | Sprint 8 |
| FR-ONB-001–005 | Sprint 9 |
| FR-JOIN-001–004 | Sprint 8–9 |
| FR-PRB-001–006 | Sprint 9 |
| FR-COM-001–006 | Part H, Sprint 10 |
| FR-ANA-001–006 | Part I, Sprint 11 |
| FR-ADM-001–006 | Sprint 1–3 (progressive) |
| FR-RBAC-001–005 | Part E §E.1, Sprint 1 |
| FR-PRV-001–011 | Part E §E.4, Sprint 11 |
| FR-SEC-001–007 | Part E §E.1–E.3, Sprint 1 + 12 |
| SERE (§11) | Part G, Sprint 8 |
| All BR-001–020 | Enforced at API layer, gate validation |
| All AC-001–088 | E2E test suite, Sprint 12 |
| NFR §17.1–17.7 | k6 load tests, Lighthouse CI, Sprint 12 |
