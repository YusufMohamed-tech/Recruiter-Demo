# Demo Implementation Blueprint
# Saudi Recruitment & Employment Readiness Platform
# Chessboard Systems — Full-Feature Demo

**Target:** Fully functional demo with all BRD features  
**Frontend Hosting:** Vercel  
**Backend/Database:** Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)  
**Domain:** TBD (Vercel auto-domain for demo)  
**Version:** 1.0  
**Date:** 2026-08-06  
**Status:** Ready for Implementation

---

## 0. Architecture Decision: Demo on Vercel + Supabase

### Why This Stack for the Demo

| Concern | Production (Hostinger Docker) | Demo (Vercel + Supabase) |
|---|---|---|
| Database | Self-hosted PostgreSQL 16 | Supabase PostgreSQL (managed) |
| Auth | Better Auth (self-hosted) | Supabase Auth (built-in) |
| File Storage | MinIO (self-hosted S3) | Supabase Storage (S3-compatible) |
| Search | Meilisearch (self-hosted) | Supabase pg_trgm + full-text search |
| Job Queue | BullMQ + Redis | Supabase Edge Functions + pg_cron |
| Workflow Engine | Temporal.io | Supabase Database Functions + state machine in DB |
| Realtime | WebSocket (custom) | Supabase Realtime (built-in) |
| Frontend | Next.js on Docker | Next.js on Vercel (native) |
| API | Hono on Docker | Next.js API Routes + Supabase Edge Functions |
| Caching | Redis | Vercel Edge Config + ISR |
| Email | Resend | Resend (same) |
| AI | Claude API | Claude API (same) |
| Cost | ~$200/mo server | Free tier → $25/mo (Supabase Pro) |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel (Frontend + API Routes)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Next.js 15 (App Router)                               │   │
│  │ ├── /app/(public)/careers/*   — Public portal (SSR)   │   │
│  │ ├── /app/(public)/apply/*     — Application flow      │   │
│  │ ├── /app/(public)/offer/*     — Candidate offer view  │   │
│  │ ├── /app/(dashboard)/*        — Internal ATS (CSR)    │   │
│  │ └── /app/api/*                — API routes            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Supabase    │    │  Supabase    │    │  External APIs   │
│  PostgreSQL  │    │  Storage     │    │  ├── Resend      │
│  + RLS       │    │  (files)     │    │  ├── Claude API  │
│  + Realtime  │    │              │    │  └── Twilio      │
└──────────────┘    └──────────────┘    └──────────────────┘
```

---

## 1. Monorepo Structure (Simplified for Demo)

```
recruitment-chessboard/
├── apps/
│   └── web/                          # Next.js 15 App Router
│       ├── app/
│       │   ├── (public)/             # Public-facing routes
│       │   │   ├── careers/          # Job board
│       │   │   │   ├── page.tsx      # Job listing with search
│       │   │   │   └── [slug]/       # Job detail + apply
│       │   │   ├── apply/            # Multi-step application
│       │   │   ├── offer/            # Candidate offer portal
│       │   │   │   └── [token]/
│       │   │   └── layout.tsx        # Public shell (header/footer)
│       │   ├── (dashboard)/          # Internal ATS (auth-protected)
│       │   │   ├── layout.tsx        # Sidebar + topbar shell
│       │   │   ├── page.tsx          # Executive dashboard
│       │   │   ├── requisitions/     # Requisition management
│       │   │   ├── jobs/             # Job posting management
│       │   │   ├── candidates/       # Candidate profiles
│       │   │   ├── applications/     # ATS Kanban + list
│       │   │   │   └── [id]/         # Application detail workspace
│       │   │   ├── offers/           # Offer management
│       │   │   ├── readiness/        # Employment readiness
│       │   │   │   └── [id]/         # Readiness case detail
│       │   │   ├── government-cases/ # Government case tracking
│       │   │   ├── interviews/       # Interview scheduling
│       │   │   ├── analytics/        # Reports & dashboards
│       │   │   └── settings/         # Org settings, roles, rules
│       │   ├── (auth)/               # Login only (no self-registration)
│       │   │   └── login/
│       │   ├── api/                  # Next.js API routes
│       │   │   ├── auth/             # Supabase auth callbacks
│       │   │   ├── v1/               # REST API (mirrors BRD spec)
│       │   │   │   ├── requisitions/
│       │   │   │   ├── jobs/
│       │   │   │   ├── candidates/
│       │   │   │   ├── applications/
│       │   │   │   ├── offers/
│       │   │   │   ├── compliance/
│       │   │   │   ├── readiness/
│       │   │   │   ├── analytics/
│       │   │   │   ├── files/
│       │   │   │   ├── privacy/
│       │   │   │   └── audit/
│       │   │   └── webhooks/
│       │   ├── layout.tsx            # Root layout (fonts, providers)
│       │   └── globals.css           # Brand tokens
│       ├── components/
│       │   ├── ui/                   # shadcn/ui components
│       │   ├── brand/                # Logo, brand elements
│       │   ├── forms/                # Reusable form components
│       │   ├── kanban/               # Kanban board
│       │   ├── compliance/           # Compliance UI elements
│       │   └── readiness/            # Readiness dashboard
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts         # Browser client
│       │   │   ├── server.ts         # Server client
│       │   │   ├── admin.ts          # Service role client
│       │   │   └── middleware.ts     # Auth middleware
│       │   ├── compliance/
│       │   │   ├── engine.ts         # Rule evaluation engine
│       │   │   └── sere.ts           # SERE score calculator
│       │   ├── ai/
│       │   │   ├── cv-parser.ts      # Claude CV parsing
│       │   │   └── match-scorer.ts   # Claude match scoring
│       │   ├── email/
│       │   │   └── resend.ts         # Email via Resend
│       │   ├── workflows/
│       │   │   ├── approval.ts       # Approval state machine
│       │   │   └── readiness.ts      # Readiness state machine
│       │   ├── validators/           # Zod schemas
│       │   └── utils/
│       │       ├── i18n.ts           # Internationalization
│       │       ├── permissions.ts    # RBAC helper
│       │       └── encryption.ts     # Field encryption
│       ├── hooks/                    # React hooks
│       ├── stores/                   # Zustand stores
│       ├── types/                    # TypeScript types
│       ├── messages/                 # i18n message files
│       │   ├── ar.json
│       │   └── en.json
│       ├── middleware.ts             # Next.js middleware (auth + i18n)
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── package.json
│       └── tsconfig.json
├── supabase/
│   ├── migrations/                   # SQL migrations
│   │   ├── 00001_organizations.sql
│   │   ├── 00002_users_rbac.sql
│   │   ├── 00003_requisitions.sql
│   │   ├── 00004_approvals.sql
│   │   ├── 00005_compliance.sql
│   │   ├── 00006_job_postings.sql
│   │   ├── 00007_candidates.sql
│   │   ├── 00008_applications.sql
│   │   ├── 00009_offers.sql
│   │   ├── 00010_readiness.sql
│   │   ├── 00011_government_cases.sql
│   │   ├── 00012_communications.sql
│   │   ├── 00013_audit.sql
│   │   ├── 00014_analytics_views.sql
│   │   ├── 00015_rls_policies.sql
│   │   ├── 00016_functions.sql
│   │   └── 00017_seed_demo_data.sql
│   ├── functions/                    # Supabase Edge Functions
│   │   ├── compliance-evaluate/
│   │   ├── sere-calculate/
│   │   ├── cv-parse/
│   │   ├── match-score/
│   │   ├── send-notification/
│   │   └── process-file/
│   ├── config.toml
│   └── seed.sql
├── scripts/
│   ├── seed-demo.ts                  # Seed realistic demo data
│   └── generate-types.ts            # Generate TypeScript from DB
├── public/
│   ├── logos/                        # Chessboard logos
│   └── fonts/
├── .env.local                        # Local dev env
├── .env.production                   # Vercel env (reference)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── vercel.json
```

---

## 2. Branding Implementation (Light Mode Only)

### 2.1 Design Tokens

```css
/* apps/web/app/globals.css */

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Kanit:wght@400;500&family=Poppins:wght@300;400;500;600;700;800&family=Sora:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ===== CHESSBOARD BRAND (Light Mode) ===== */
    
    /* Brand Core */
    --brand-green:        187 212 47;    /* #BBD42F */
    --brand-green-hover:  201 243 29;    /* #C9F31D */
    --brand-dark:         1 1 1;         /* #010101 */
    --brand-white:        255 255 255;   /* #FFFFFF */
    --brand-light-bg:     242 242 242;   /* #F2F2F2 */
    --brand-neutral:      145 147 150;   /* #919396 */

    /* Semantic Surfaces */
    --background:         255 255 255;
    --foreground:         1 1 1;
    --card:               255 255 255;
    --card-foreground:    1 1 1;
    --popover:            255 255 255;
    --popover-foreground: 1 1 1;
    --primary:            187 212 47;
    --primary-foreground: 1 1 1;
    --secondary:          242 242 242;
    --secondary-foreground: 1 1 1;
    --muted:              242 242 242;
    --muted-foreground:   145 147 150;
    --accent:             187 212 47;
    --accent-foreground:  1 1 1;
    --destructive:        239 68 68;
    --destructive-foreground: 255 255 255;
    --border:             228 228 231;
    --input:              228 228 231;
    --ring:               187 212 47;

    /* Sidebar */
    --sidebar-bg:         250 250 250;
    --sidebar-active:     187 212 47;
    --sidebar-active-text: 1 1 1;

    /* Status Colors */
    --status-success:     34 197 94;
    --status-warning:     245 158 11;
    --status-error:       239 68 68;
    --status-info:        59 130 246;
    --status-review:      139 92 246;

    /* Layout */
    --radius:             0.5rem;
    --radius-card:        1rem;
    --radius-btn:         0.5rem;
    --sidebar-width:      260px;
    --max-width:          1140px;

    /* Typography */
    --font-body:          'Poppins', sans-serif;
    --font-arabic:        'IBM Plex Sans Arabic', sans-serif;
    --font-heading:       'Sora', sans-serif;
    --font-nav:           'Kanit', sans-serif;
  }

  html {
    font-family: var(--font-body);
  }

  html[lang="ar"] {
    font-family: var(--font-arabic);
    direction: rtl;
  }
}
```

### 2.2 Tailwind Configuration

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class', // disabled — light mode only
  content: ['./app/**/*.{tsx,ts}', './components/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green:       'rgb(var(--brand-green) / <alpha-value>)',
          'green-hover': 'rgb(var(--brand-green-hover) / <alpha-value>)',
          dark:        'rgb(var(--brand-dark) / <alpha-value>)',
          neutral:     'rgb(var(--brand-neutral) / <alpha-value>)',
          'light-bg':  'rgb(var(--brand-light-bg) / <alpha-value>)',
        },
        sidebar: {
          bg:     'rgb(var(--sidebar-bg) / <alpha-value>)',
          active: 'rgb(var(--sidebar-active) / <alpha-value>)',
        },
        status: {
          success: 'rgb(var(--status-success) / <alpha-value>)',
          warning: 'rgb(var(--status-warning) / <alpha-value>)',
          error:   'rgb(var(--status-error) / <alpha-value>)',
          info:    'rgb(var(--status-info) / <alpha-value>)',
          review:  'rgb(var(--status-review) / <alpha-value>)',
        },
      },
      fontFamily: {
        body:    ['var(--font-body)'],
        arabic:  ['var(--font-arabic)'],
        heading: ['var(--font-heading)'],
        nav:     ['var(--font-nav)'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn:  'var(--radius-btn)',
      },
      maxWidth: {
        content: 'var(--max-width)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### 2.3 Logo Integration

```tsx
// apps/web/components/brand/Logo.tsx
import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'icon'
  className?: string
}

export function Logo({ variant = 'full', className }: LogoProps) {
  return (
    <Image
      src="https://chessboard-group.com/wp-content/uploads/2025/04/cropped-chess-board-logo.avif"
      alt="Chessboard Group"
      width={variant === 'full' ? 180 : 40}
      height={variant === 'full' ? 49 : 40}
      className={className}
      priority
    />
  )
}
```

### 2.4 Font Loading (Next.js)

```tsx
// apps/web/app/layout.tsx
import { Poppins, Sora, Kanit } from 'next/font/google'
import localFont from 'next/font/local'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
})

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-nav',
})

// IBM Plex Sans Arabic loaded via Google Fonts CSS import in globals.css
// (next/font/google doesn't support Arabic subset natively)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${poppins.variable} ${sora.variable} ${kanit.variable}`}
    >
      <body className="bg-white text-brand-dark font-body antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## 3. Supabase Database Schema

### 3.1 Migration Strategy

All tables from the Technical Implementation Plan's Part B are implemented as Supabase migrations. Key adaptations:

| Original Design | Supabase Adaptation |
|---|---|
| Drizzle ORM migrations | Raw SQL migrations via `supabase db push` |
| Custom RLS via app code | Native Supabase RLS policies |
| Better Auth sessions | Supabase Auth (JWT + sessions) |
| MinIO storage | Supabase Storage buckets |
| BullMQ jobs | pg_cron + Edge Functions |
| Temporal workflows | Database state machines + pg_notify |

### 3.2 Core Tables (SQL Migrations)

All tables from Part B of the Technical Implementation Plan are preserved exactly:

1. **00001_organizations.sql** — `organizations`, `establishments`, `compliance_snapshots`, `departments`, `organization_branches`, `cost_centers`
2. **00002_users_rbac.sql** — `users` (linked to Supabase auth.users), `roles`, `role_permissions`, `user_roles`
3. **00003_requisitions.sql** — `job_requisitions`, `requisition_versions`
4. **00004_approvals.sql** — `approval_workflows`, `approval_requests`, `approval_steps`
5. **00005_compliance.sql** — `compliance_rules`, `compliance_evaluations`, `compliance_evaluation_items`, `compliance_overrides`
6. **00006_job_postings.sql** — `job_postings`, `application_form_versions`, `sourcing_channels`
7. **00007_candidates.sql** — `candidates`, `candidate_sensitive_profiles`
8. **00008_applications.sql** — `job_applications`, `application_stage_events`, `rejection_reasons`
9. **00009_offers.sql** — `offers`, `offer_versions`, `offer_responses`
10. **00010_readiness.sql** — `employment_readiness_cases`, `readiness_checklist_items`, `joining_confirmations`
11. **00011_government_cases.sql** — `government_cases`, `qiwa_contract_cases`, `contract_discrepancies`
12. **00012_communications.sql** — `communications`, `communication_template_versions`, `notifications`
13. **00013_audit.sql** — `audit_events` (append-only, RLS enforced)
14. **00014_analytics_views.sql** — Materialized views for dashboards
15. **00015_rls_policies.sql** — All Row-Level Security policies
16. **00016_functions.sql** — PostgreSQL functions for compliance engine, SERE calculation
17. **00017_seed_demo_data.sql** — Realistic demo data

### 3.3 RLS Policy Design

```sql
-- Example: Tenant isolation on all tables
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON job_applications
  FOR ALL
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Audit events: immutable
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert_only" ON audit_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_no_update" ON audit_events
  FOR UPDATE USING (false);

CREATE POLICY "audit_no_delete" ON audit_events
  FOR DELETE USING (false);

CREATE POLICY "audit_select" ON audit_events
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND rp.permission = 'audit.view'
    )
  );

-- Sensitive data: permission-gated
ALTER TABLE candidate_sensitive_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sensitive_access" ON candidate_sensitive_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND rp.permission = 'candidate.view_sensitive'
    )
  );
```

### 3.4 Supabase Storage Buckets

```sql
-- Storage buckets setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('cv-uploads', 'cv-uploads', false, 10485760, '{"application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'),
  ('documents', 'documents', false, 20971520, '{"application/pdf","image/png","image/jpeg"}'),
  ('offer-documents', 'offer-documents', false, 10485760, '{"application/pdf"}'),
  ('evidence-files', 'evidence-files', false, 20971520, NULL),
  ('org-logos', 'org-logos', true, 5242880, '{"image/png","image/jpeg","image/webp","image/avif"}');
```

---

## 4. Authentication & Authorization

### 4.1 Supabase Auth Configuration

```typescript
// apps/web/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// apps/web/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 4.2 Admin-Managed User Provisioning (Demo Only)

In the demo, **only admins can create users and set/reset passwords**. Users cannot register themselves or change their own passwords.

```typescript
// apps/web/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS, used only in server-side admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

```typescript
// apps/web/app/api/v1/admin/users/route.ts — Admin creates a user with password
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verify caller is admin
  const supabase = await createServerSupabase()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin permission
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role:roles(role_permissions(permission))')
    .eq('user_id', caller.id)
  const permissions = roles?.flatMap(ur => ur.role?.role_permissions?.map(rp => rp.permission) ?? []) ?? []
  if (!permissions.includes('user.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, password, name_en, name_ar, role_id } = await request.json()

  // Create user via Admin API (sets password directly, no invite email)
  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // Skip email confirmation
    user_metadata: { name_en, name_ar },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Create profile + role assignment
  const orgId = (await supabase.from('users').select('org_id').eq('id', caller.id).single()).data?.org_id
  await supabaseAdmin.from('users').insert({
    id: newUser.user!.id,
    email,
    name_en,
    name_ar,
    org_id: orgId,
  })
  await supabaseAdmin.from('user_roles').insert({
    user_id: newUser.user!.id,
    role_id,
    org_id: orgId,
  })

  return NextResponse.json({ id: newUser.user!.id, email, name_en }, { status: 201 })
}
```

```typescript
// apps/web/app/api/v1/admin/users/[id]/reset-password/route.ts — Admin resets password
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // (admin permission check omitted for brevity — same pattern as above)

  const { new_password } = await request.json()

  const { error } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
    password: new_password,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
```

**Key constraints (demo mode):**
- `enable_signup = false` in Supabase Auth config — blocks self-registration
- No `/register` page exists — only `/login`
- No "Forgot password" or "Change password" UI exposed to users
- Admin UI in Settings > Users provides "Create User" and "Reset Password" actions
- Password reset does NOT send email — admin sets the new password directly and communicates it out-of-band

### 4.3 RBAC Middleware

```typescript
// apps/web/lib/utils/permissions.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function checkPermission(permission: string): Promise<boolean> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(role_permissions(permission))')
    .eq('user_id', user.id)

  const permissions = data?.flatMap(ur =>
    ur.role?.role_permissions?.map(rp => rp.permission) ?? []
  ) ?? []

  return permissions.includes(permission)
}
```

### 4.4 Next.js Middleware (Auth + i18n)

```typescript
// apps/web/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // RTL detection
  const lang = request.cookies.get('lang')?.value
    || request.headers.get('accept-language')?.split(',')[0]?.startsWith('ar') ? 'ar' : 'en'

  response.headers.set('x-lang', lang)
  response.headers.set('x-dir', lang === 'ar' ? 'rtl' : 'ltr')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
```

---

## 5. Feature Implementation Plan (All BRD Features)

### 5.1 Module Breakdown

#### Module 1: Organization & Settings
| Feature | BRD Ref | Implementation |
|---|---|---|
| Organization profile (AR/EN) | FR-ORG-001 | Settings page with bilingual form |
| Establishment management | FR-ORG-002 | CRUD with compliance snapshot upload |
| Department/Branch/Cost Center | FR-ORG-003 | Hierarchical settings UI |
| Brand settings (logo, colors) | FR-ORG-004 | Config stored in `brand_settings` JSONB |

#### Module 2: RBAC & Users
| Feature | BRD Ref | Implementation |
|---|---|---|
| Role management | FR-RBAC-001 | Settings > Roles page with permission matrix |
| User provisioning | FR-RBAC-002 | Admin creates users with password (no invite/self-registration) |
| Password management | FR-RBAC-002a | Admin sets & resets passwords; users cannot change own password |
| Permission scoping | FR-RBAC-003 | own/assigned/department/org/platform |
| Temporary access | FR-RBAC-004 | `expires_at` on user_roles |
| MFA enforcement | FR-RBAC-005 | Supabase Auth MFA for sensitive roles |

#### Module 3: Compliance Engine
| Feature | BRD Ref | Implementation |
|---|---|---|
| Rule registry CRUD | FR-CMP-001 | Admin UI with versioning |
| Rule evaluation engine | FR-CMP-002 | TypeScript engine in API routes |
| Stale rule detection | FR-CMP-003 | Cron check on `review_due_at` |
| Override workflow | FR-CMP-004 | Request → Approve (different user) |
| Manual review queue | FR-CMP-005 | Dashboard for compliance officers |
| Evidence & source tracking | FR-CMP-006 | Source URL, publication date per rule |
| Evaluation history | FR-CMP-007 | Immutable evaluation records |
| SERE score calculation | FR-KSA-001 | Weighted category scoring |

#### Module 4: Requisitions & Approvals
| Feature | BRD Ref | Implementation |
|---|---|---|
| Requisition CRUD + versioning | FR-REQ-001 | Form with auto-save, version history |
| Budget validation | FR-REQ-002 | Budget status field + approval gate |
| Compliance pre-check | FR-REQ-003 | Auto-evaluate on submit |
| Approval workflow builder | FR-APR-001 | Visual step builder in settings |
| Multi-step approval chain | FR-APR-002 | Sequential/parallel/any-one/majority |
| SLA + escalation | FR-APR-003 | pg_cron checks + notifications |
| Delegation | FR-APR-004 | Delegate action on approval step |
| Segregation of duties | FR-APR-005 | Requester ≠ approver enforced |

#### Module 5: Job Postings & Portal
| Feature | BRD Ref | Implementation |
|---|---|---|
| Job posting CRUD | FR-JOB-001 | Rich text editor (AR/EN) |
| Custom form builder | FR-JOB-002 | JSON-based form schema |
| SEO optimization | FR-JOB-003 | SSR, structured data, sitemap |
| Public careers page | FR-PORT-001 | Full-text search, filters |
| Job detail page | FR-PORT-002 | Branded, accessible |
| Application form | FR-PORT-003 | Multi-step wizard |
| Privacy notice capture | FR-PORT-004 | Version-tracked consent |
| Source attribution | FR-SRC-001 | UTM params + channel tracking |

#### Module 6: Candidates & Applications
| Feature | BRD Ref | Implementation |
|---|---|---|
| Candidate profile | FR-CAN-001 | Cross-application profile |
| Progressive data collection | FR-CAN-002 | Stage-appropriate fields |
| Duplicate detection | FR-DUP-001 | Email/phone/name fuzzy match |
| Duplicate merge | FR-DUP-002 | UI for review + merge action |
| Application management | FR-CAN-003 | Status tracking per application |
| Candidate portal | FR-CAN-004 | Magic-link access to status |

#### Module 7: ATS (Screening, Pipeline, Selection)
| Feature | BRD Ref | Implementation |
|---|---|---|
| Kanban board | FR-ATS-001 | Drag-drop with gate validation |
| List view + filters | FR-ATS-002 | Table with saved filter presets |
| Bulk actions | FR-ATS-003 | Multi-select + batch transition |
| Stage gate enforcement | FR-ATS-004 | Rules checked on transition |
| CV parsing (Claude) | FR-SCR-001 | AI-extracted fields with provenance |
| Match scoring (Claude) | FR-SCR-002 | Explainable score breakdown |
| Screening tools | FR-SCR-003 | Eligibility checks, notes |
| Talent pools | FR-TAL-001 | Tag + save candidates |

#### Module 8: Interviews & Assessments
| Feature | BRD Ref | Implementation |
|---|---|---|
| Interview scheduling | FR-INT-001 | Calendar integration |
| Scorecard system | FR-INT-002 | Independent submission, hidden until all done |
| Assessment tracking | FR-ASM-001 | External provider webhook support |
| Conflict of interest | FR-INT-003 | Declaration workflow |

#### Module 9: Offers
| Feature | BRD Ref | Implementation |
|---|---|---|
| Offer package builder | FR-OFR-001 | Salary, allowances, terms |
| Offer versioning | FR-OFR-002 | Immutable versions |
| Offer approval chain | FR-OFR-003 | Reuses approval workflow |
| Secure candidate portal | FR-OFR-004 | Token-based, no auth needed |
| Accept/Decline/Negotiate | FR-OFR-005 | Candidate actions with evidence |
| Electronic acceptance hash | FR-OFR-006 | SHA-256 of terms + timestamp |
| Offer withdrawal | FR-OFR-007 | With audit trail |
| Expiry countdown | FR-OFR-008 | Visual timer on candidate view |

#### Module 10: Employment Readiness
| Feature | BRD Ref | Implementation |
|---|---|---|
| Preboarding case creation | FR-PRE-001 | Auto on offer acceptance |
| Branch classification | FR-PRE-002 | Saudi/GCC/Resident/Overseas |
| Readiness checklist | FR-PRE-003 | Generated per branch type |
| SERE score dashboard | FR-KSA-001 | Visual % with blockers |
| Government case tracking | FR-GOV-001 | Qiwa, Transfer, Visa, GOSI |
| Qiwa contract tracking | FR-QIW-001 | Status + discrepancy detection |
| Ready-to-join gate | FR-JOIN-001 | All mandatory items complete |
| Joining confirmation | FR-JOIN-002 | Identity + attendance + docs |
| No-show workflow | FR-JOIN-003 | Escalation + case closure |

#### Module 11: Onboarding & Probation
| Feature | BRD Ref | Implementation |
|---|---|---|
| Onboarding plan templates | FR-ONB-001 | Task assignment per role |
| Probation case | FR-PRB-001 | Review checkpoints |
| Quality-of-hire score | FR-PRB-002 | Multi-factor calculation |

#### Module 12: Communications
| Feature | BRD Ref | Implementation |
|---|---|---|
| Email notifications | FR-COM-001 | Resend API via Edge Functions |
| SMS notifications | FR-COM-002 | Twilio API |
| In-app notifications | FR-COM-003 | Supabase Realtime + bell icon |
| Template editor (AR/EN) | FR-COM-004 | Variable substitution |
| Communication log | FR-COM-005 | Full history per candidate |
| Delivery tracking | FR-COM-006 | Webhook status updates |

#### Module 13: Analytics
| Feature | BRD Ref | Implementation |
|---|---|---|
| Executive dashboard | FR-ANA-001 | KPI tiles + charts |
| Recruiter dashboard | FR-ANA-002 | Personal pipeline metrics |
| Compliance dashboard | FR-ANA-003 | Rule pass/block rates |
| Source analytics | FR-ANA-004 | Channel ROI |
| Funnel visualization | FR-ANA-005 | Stage conversion rates |
| Time-to-fill reporting | FR-ANA-006 | Median + percentile |

#### Module 14: Privacy (PDPL)
| Feature | BRD Ref | Implementation |
|---|---|---|
| Privacy notices (versioned) | FR-PRV-001 | Tracked per application |
| Rights requests | FR-PRV-002 | Access/Obtain/Correct/Destroy |
| Retention policies | FR-PRV-003 | Configurable per outcome |
| Data anonymization | FR-PRV-004 | PII replacement |
| Breach workflow | FR-PRV-005 | Notification + evidence |

#### Module 15: Audit & Security
| Feature | BRD Ref | Implementation |
|---|---|---|
| Append-only audit log | FR-SEC-001 | All actions logged |
| Sensitive access logging | FR-SEC-002 | PII view/download tracked |
| File malware scanning | FR-SEC-003 | ClamAV via Edge Function |
| Field encryption | FR-SEC-004 | AES-256-GCM on PII |
| Rate limiting | FR-SEC-005 | Vercel Edge + Supabase |

---

## 6. UI Component Specifications

### 6.1 Component Library Setup

Using **shadcn/ui** with Chessboard brand overrides:

```bash
# Initialize shadcn
npx shadcn@latest init

# Install all needed components
npx shadcn@latest add button card input label select textarea
npx shadcn@latest add dialog drawer sheet tabs accordion
npx shadcn@latest add table badge avatar dropdown-menu
npx shadcn@latest add command popover calendar date-picker
npx shadcn@latest add form checkbox radio-group switch
npx shadcn@latest add toast sonner progress skeleton
npx shadcn@latest add breadcrumb pagination separator
```

### 6.2 Key UI Components (Custom)

| Component | Purpose | Location |
|---|---|---|
| `KanbanBoard` | Drag-drop pipeline | `components/kanban/` |
| `ComplianceBadge` | PASS/BLOCKED/WARNING indicator | `components/compliance/` |
| `SereScoreGauge` | Radial progress for readiness | `components/readiness/` |
| `ApprovalChain` | Visual step indicator | `components/approvals/` |
| `BilingualInput` | AR/EN field pair | `components/forms/` |
| `StageTimeline` | Application stage history | `components/ui/` |
| `OfferPackageCard` | Salary breakdown display | `components/offers/` |
| `GovernmentCaseCard` | Case status + actions | `components/readiness/` |
| `StatTile` | KPI number + trend | `components/analytics/` |
| `FilterBar` | Multi-filter + saved presets | `components/ui/` |

### 6.3 Page Layouts

**Public Portal Layout:**
```
Header (sticky, white, shadow-sm)
  [Logo] ─────────────────── [AR|EN] [Login]
Content (full-width, responsive)
Footer (bg-brand-dark, text-white)
  [Logo] [Links] [Social] [Copyright]
```

**Dashboard Layout:**
```
Topbar (h-14, white, border-b)
  [Menu toggle] [Logo] ────── [Notifications] [Search] [Avatar]
Sidebar (260px, #FAFAFA, border-e)  |  Main Content (#F2F2F2)
  Navigation groups              |  Page Header (white, border-b)
  Active: bg-brand-green         |  Breadcrumb + Title + Actions
                                 |  Content (max-w-content, mx-auto)
```

---

## 7. API Routes Architecture

### 7.1 API Route Organization

All API routes live in `apps/web/app/api/v1/` mirroring the endpoint structure from Part D of the Technical Implementation Plan. Using Next.js Route Handlers:

```typescript
// apps/web/app/api/v1/requisitions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createRequisitionSchema } from '@/lib/validators/requisition'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '25')

  const { data, count } = await supabase
    .from('job_requisitions')
    .select('*, department:departments(name_en, name_ar)', { count: 'exact' })
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false })

  return NextResponse.json(data, {
    headers: { 'X-Total-Count': String(count ?? 0) }
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const validated = createRequisitionSchema.parse(body)

  const { data, error } = await supabase
    .from('job_requisitions')
    .insert({ ...validated, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  // Log audit event
  await supabase.from('audit_events').insert({
    actor_type: 'user',
    actor_id: user.id,
    action: 'create',
    resource_type: 'requisition',
    resource_id: data.id,
  })

  return NextResponse.json(data, { status: 201 })
}
```

### 7.2 Supabase Edge Functions (Heavy Processing)

```typescript
// supabase/functions/compliance-evaluate/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { resource_type, resource_id, input } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch active rules matching input criteria
  const { data: rules } = await supabase
    .from('compliance_rules')
    .select('*')
    .eq('status', 'active')
    .lte('effective_from', new Date().toISOString())

  // Evaluate each rule against input
  const items = rules?.map(rule => evaluateRule(rule, input)) ?? []
  const overall = deriveOverallResult(items)
  const staleCount = items.filter(i => i.result === 'RULE_STALE').length

  // Store evaluation
  const { data: evaluation } = await supabase
    .from('compliance_evaluations')
    .insert({
      org_id: input.org_id,
      resource_type,
      resource_id,
      ruleset_snapshot: rules,
      overall_result: overall,
      input_snapshot_json: input,
      result_summary_json: { items_count: items.length, stale: staleCount },
      stale_rules_count: staleCount,
    })
    .select()
    .single()

  // Store individual items
  await supabase.from('compliance_evaluation_items').insert(
    items.map(item => ({ ...item, evaluation_id: evaluation!.id }))
  )

  return new Response(JSON.stringify({ overall_result: overall, items, stale_rules_count: staleCount }))
})
```

---

## 8. Workflow State Machines (Replacing Temporal)

For the demo, we replace Temporal.io with database-driven state machines using Supabase Database Functions + pg_notify + Edge Functions.

### 8.1 Approval Workflow State Machine

```sql
-- supabase/migrations/00016_functions.sql

CREATE OR REPLACE FUNCTION advance_approval(
  p_approval_request_id uuid,
  p_step_id uuid,
  p_decision text,
  p_comments text,
  p_actor_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_step approval_steps%ROWTYPE;
  v_request approval_requests%ROWTYPE;
  v_next_step approval_steps%ROWTYPE;
BEGIN
  -- Get current step
  SELECT * INTO v_step FROM approval_steps WHERE id = p_step_id;
  SELECT * INTO v_request FROM approval_requests WHERE id = p_approval_request_id;

  -- Record decision
  UPDATE approval_steps SET
    decision = p_decision,
    decided_at = now(),
    status = 'completed'
  WHERE id = p_step_id;

  IF p_decision = 'rejected' OR p_decision = 'changes_requested' THEN
    UPDATE approval_requests SET status = p_decision, completed_at = now()
    WHERE id = p_approval_request_id;

    PERFORM pg_notify('approval_decided', json_build_object(
      'request_id', p_approval_request_id,
      'resource_type', v_request.resource_type,
      'resource_id', v_request.resource_id,
      'decision', p_decision
    )::text);

    RETURN jsonb_build_object('outcome', p_decision);
  END IF;

  -- Find next step
  SELECT * INTO v_next_step FROM approval_steps
  WHERE approval_request_id = p_approval_request_id
    AND step_order > v_step.step_order
    AND status = 'pending'
  ORDER BY step_order LIMIT 1;

  IF v_next_step IS NULL THEN
    -- All steps complete
    UPDATE approval_requests SET status = 'approved', completed_at = now()
    WHERE id = p_approval_request_id;

    PERFORM pg_notify('approval_decided', json_build_object(
      'request_id', p_approval_request_id,
      'resource_type', v_request.resource_type,
      'resource_id', v_request.resource_id,
      'decision', 'approved'
    )::text);

    RETURN jsonb_build_object('outcome', 'approved');
  ELSE
    -- Activate next step
    UPDATE approval_steps SET status = 'active' WHERE id = v_next_step.id;

    PERFORM pg_notify('approval_step_active', json_build_object(
      'step_id', v_next_step.id,
      'approver_id', v_next_step.approver_id
    )::text);

    RETURN jsonb_build_object('outcome', 'next_step', 'step_id', v_next_step.id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.2 Readiness Workflow State Machine

```sql
CREATE OR REPLACE FUNCTION recalculate_sere_score(p_case_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_items RECORD;
  v_scores jsonb := '{}'::jsonb;
  v_total numeric := 0;
  v_blockers jsonb := '[]'::jsonb;
  v_weights jsonb := '{
    "compliance_readiness": 0.25,
    "contract_readiness": 0.20,
    "government_process": 0.20,
    "payroll_gosi": 0.15,
    "candidate_docs": 0.10,
    "internal_onboarding": 0.10
  }'::jsonb;
BEGIN
  FOR v_items IN (
    SELECT
      item_type as category,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status IN ('completed', 'waived')) as done,
      jsonb_agg(
        CASE WHEN mandatory AND status NOT IN ('completed', 'waived')
        THEN jsonb_build_object('item_type', item_type, 'owner_id', owner_id)
        ELSE NULL END
      ) FILTER (WHERE mandatory AND status NOT IN ('completed', 'waived')) as category_blockers
    FROM readiness_checklist_items
    WHERE readiness_case_id = p_case_id
    GROUP BY item_type
  ) LOOP
    v_total := v_total + (v_weights->>v_items.category)::numeric * 100
      * (v_items.done::numeric / GREATEST(v_items.total, 1));

    IF v_items.category_blockers IS NOT NULL THEN
      v_blockers := v_blockers || v_items.category_blockers;
    END IF;
  END LOOP;

  UPDATE employment_readiness_cases SET
    readiness_score = ROUND(v_total),
    mandatory_blockers = v_blockers,
    updated_at = now()
  WHERE id = p_case_id;

  RETURN jsonb_build_object(
    'score', ROUND(v_total),
    'blocked', jsonb_array_length(v_blockers) > 0,
    'blockers', v_blockers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 9. AI Integration (Claude API)

### 9.1 CV Parsing

```typescript
// apps/web/lib/ai/cv-parser.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function parseCv(fileUrl: string): Promise<ParsedProfile> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'url', url: fileUrl } },
        { type: 'text', text: `Extract structured profile data from this CV. Return JSON with:
          - name_en, name_ar (if present)
          - email, phone
          - current_city, nationality (if stated)
          - education: [{degree, institution, year, field}]
          - experience: [{title, company, from, to, description}]
          - skills: string[]
          - certifications: string[]
          - languages: [{language, level}]
          - total_experience_years: number
          Only include data explicitly stated in the document.` }
      ]
    }],
  })

  return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
}
```

### 9.2 Match Scoring

```typescript
// apps/web/lib/ai/match-scorer.ts
export async function calculateMatchScore(
  candidateProfile: ParsedProfile,
  jobRequirements: JobRequirements
): Promise<MatchResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Score this candidate against the job requirements. Return JSON:
        {
          "overall_score": 0-100,
          "breakdown": {
            "experience_match": { "score": 0-100, "explanation_en": "", "explanation_ar": "" },
            "education_match": { "score": 0-100, "explanation_en": "", "explanation_ar": "" },
            "skills_match": { "score": 0-100, "explanation_en": "", "explanation_ar": "" },
            "certifications_match": { "score": 0-100, "explanation_en": "", "explanation_ar": "" }
          },
          "strengths_en": ["..."],
          "gaps_en": ["..."],
          "strengths_ar": ["..."],
          "gaps_ar": ["..."]
        }

        Candidate: ${JSON.stringify(candidateProfile)}
        Requirements: ${JSON.stringify(jobRequirements)}`
    }],
  })

  return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
}
```

---

## 10. Deployment Configuration

### 10.1 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/v1/:path*", "destination": "/api/v1/:path*" }
  ]
}
```

### 10.2 Environment Variables (Vercel)

```bash
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=recruitment@chessboard-systems.com

# SMS (optional for demo)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Encryption
FIELD_ENCRYPTION_KEY_V1=... (32 bytes hex)

# App
NEXT_PUBLIC_APP_URL=https://recruitment-demo.vercel.app
NEXT_PUBLIC_SITE_NAME=Chessboard Recruitment
```

### 10.3 Supabase Project Configuration

```toml
# supabase/config.toml
[project]
id = "your-project-ref"
name = "recruitment-chessboard"

[db]
port = 54322
major_version = 15

[studio]
port = 54323

[auth]
site_url = "https://recruitment-demo.vercel.app"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 28800
enable_signup = false  # Admin-only user creation (no self-registration)

[auth.email]
enable_signup = false  # Users cannot sign up themselves
double_confirm_changes = false
enable_confirmations = false  # Demo mode: skip email confirmation

[auth.mfa]
max_enrolled_factors = 2

[storage]
file_size_limit = "20MB"
```

---

## 11. Demo Data Seed

### 11.1 Seed Script Overview

The demo will be pre-populated with realistic Saudi recruitment data:

```typescript
// scripts/seed-demo.ts
const DEMO_DATA = {
  organization: {
    legal_name_ar: 'مجموعة شطرنج للخدمات',
    legal_name_en: 'Chessboard Group Services',
    cr_number: '1010XXXXXX',
    headquarters_city: 'Riyadh',
  },
  establishments: [
    { name_ar: 'المقر الرئيسي — الرياض', activity_code: '7810' },
    { name_ar: 'فرع جدة', activity_code: '7810' },
    { name_ar: 'فرع الدمام', activity_code: '7810' },
  ],
  users: [
    { name_en: 'Ahmed Al-Rashid', role: 'recruiter' },
    { name_en: 'Sara Al-Otaibi', role: 'hr_manager' },
    { name_en: 'Mohamed Hassan', role: 'compliance_officer' },
    { name_en: 'Nora Al-Qahtani', role: 'government_relations' },
    { name_en: 'Khalid Al-Mansour', role: 'hiring_manager' },
  ],
  jobs: [
    { title_en: 'Software Engineer', title_ar: 'مهندس برمجيات', city: 'Riyadh' },
    { title_en: 'Sales Representative', title_ar: 'مندوب مبيعات', city: 'Jeddah' },
    { title_en: 'Procurement Specialist', title_ar: 'أخصائي مشتريات', city: 'Riyadh' },
    { title_en: 'Marketing Manager', title_ar: 'مدير تسويق', city: 'Riyadh' },
    { title_en: 'HR Coordinator', title_ar: 'منسق موارد بشرية', city: 'Dammam' },
  ],
  candidates: 50,  // Generated with realistic profiles
  applications: 120,  // Distributed across stages
  complianceRules: 15,  // Saudi-specific rules
  readinessCases: 5,  // Active cases at various completion levels
}
```

---

## 12. Implementation Sprint Plan (Demo-Optimized)

### Phase 1: Foundation (Days 1–3)
- [ ] Initialize Next.js 15 project with App Router
- [ ] Configure Tailwind with Chessboard brand tokens
- [ ] Set up shadcn/ui with brand overrides
- [ ] Integrate Chessboard logo from website
- [ ] Set up Supabase project (database + auth + storage)
- [ ] Create all database migrations (tables from Part B)
- [ ] Apply RLS policies
- [ ] Configure Supabase Auth (email + password)
- [ ] Create root layout with font loading
- [ ] Build public portal shell (header, footer)
- [ ] Build dashboard shell (sidebar, topbar)
- [ ] Set up i18n (AR/EN switching)
- [ ] Deploy skeleton to Vercel

### Phase 2: Organization & RBAC (Days 4–5)
- [ ] Organization settings page
- [ ] Establishment management CRUD
- [ ] User management (admin creates users with password, list, deactivate)
- [ ] Admin password reset for any user (via Supabase Admin API)
- [ ] Disable self-service password change (users cannot change own password)
- [ ] Role management with permission matrix
- [ ] Seed demo organization + users (pre-set passwords)
- [ ] Auth middleware (protect dashboard routes)
- [ ] Login page only (no register/signup page — admin provisions all accounts)

### Phase 3: Compliance Engine (Days 6–7)
- [ ] Compliance rules CRUD (admin UI)
- [ ] Rule evaluation engine (TypeScript)
- [ ] Stale rule detection
- [ ] Override request/approval flow
- [ ] Compliance dashboard (pass/block stats)
- [ ] Seed Saudi compliance rules

### Phase 4: Requisitions & Approvals (Days 8–10)
- [ ] Requisition create/edit form (bilingual)
- [ ] Requisition list page with filters
- [ ] Requisition detail drawer (tabs: details, compliance, approvals, history)
- [ ] Approval workflow builder (settings)
- [ ] Submit for approval action
- [ ] Approval decision UI (approve/reject/request changes)
- [ ] Compliance pre-check on submission
- [ ] Version history

### Phase 5: Job Postings & Public Portal (Days 11–13)
- [ ] Job posting CRUD with rich text (AR/EN)
- [ ] Application form builder (JSON schema)
- [ ] Public careers page (`/careers`) with search + filters
- [ ] Job detail page (`/careers/[slug]`)
- [ ] SSR + SEO (structured data, meta tags)
- [ ] RTL layout testing
- [ ] Meilisearch-style full-text search (pg_trgm)

### Phase 6: Applications & ATS (Days 14–17)
- [ ] Multi-step application form (guest flow)
- [ ] Candidate profile creation on apply
- [ ] Duplicate detection (fuzzy match)
- [ ] ATS Kanban board (drag-drop, @dnd-kit)
- [ ] ATS list view with filters
- [ ] Stage gate validation
- [ ] Application detail workspace (all tabs)
- [ ] Bulk actions (advance, reject, assign)
- [ ] CV parsing (Claude API integration)
- [ ] Match scoring (Claude API)
- [ ] Candidate portal (magic link)

### Phase 7: Interviews & Selection (Days 18–19)
- [ ] Interview scheduling UI
- [ ] Scorecard creation
- [ ] Independent scorecard submission
- [ ] Assessment tracking
- [ ] Final selection comparison view

### Phase 8: Offers (Days 20–22)
- [ ] Offer package builder
- [ ] Offer versioning
- [ ] Offer approval chain
- [ ] Candidate offer portal (`/offer/[token]`)
- [ ] Accept/Decline/Negotiate actions
- [ ] Expiry countdown
- [ ] Electronic acceptance evidence (hash)
- [ ] Offer withdrawal flow

### Phase 9: Employment Readiness (Days 23–26)
- [ ] Preboarding case auto-creation on acceptance
- [ ] Branch classification logic
- [ ] Readiness checklist generation
- [ ] SERE score calculation + display
- [ ] Government case tracking (Qiwa, Transfer, Visa, GOSI)
- [ ] Qiwa contract case + discrepancy UI
- [ ] Ready-to-join gate enforcement
- [ ] Joining confirmation page
- [ ] No-show workflow

### Phase 10: Communications & Notifications (Days 27–28)
- [ ] Resend email integration
- [ ] Notification trigger system (23 events)
- [ ] In-app notification bell (Supabase Realtime)
- [ ] Communication log per candidate
- [ ] Bilingual template system

### Phase 11: Analytics & Privacy (Days 29–30)
- [ ] Executive dashboard (KPI tiles + charts)
- [ ] Recruiter dashboard
- [ ] Compliance dashboard
- [ ] Funnel visualization
- [ ] Time-to-fill metrics
- [ ] Source analytics
- [ ] Privacy rights request workflow
- [ ] Retention policy display
- [ ] Audit log viewer

### Phase 12: Polish & Launch (Days 31–33)
- [ ] Seed full demo dataset (realistic data)
- [ ] Onboarding + probation flows
- [ ] Mobile responsiveness pass
- [ ] RTL/LTR full QA
- [ ] Accessibility checks (axe-core)
- [ ] Performance optimization (ISR, image optimization)
- [ ] Error handling + loading states
- [ ] Final Vercel deployment + custom domain
- [ ] Demo walkthrough documentation

---

## 13. Key Technical Decisions

### 13.1 Search (Replacing Meilisearch)

For the demo, we use PostgreSQL full-text search with `pg_trgm` extension:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create search index on job postings
CREATE INDEX idx_jobs_search ON job_postings USING gin (
  (title_ar || ' ' || title_en || ' ' || COALESCE(summary_ar, '') || ' ' || COALESCE(summary_en, ''))
  gin_trgm_ops
);

-- Search function
CREATE OR REPLACE FUNCTION search_jobs(query text, p_limit int DEFAULT 25)
RETURNS SETOF job_postings AS $$
  SELECT * FROM job_postings
  WHERE status = 'published'
    AND (
      title_ar ILIKE '%' || query || '%'
      OR title_en ILIKE '%' || query || '%'
      OR summary_ar ILIKE '%' || query || '%'
      OR summary_en ILIKE '%' || query || '%'
    )
  ORDER BY similarity(title_en || ' ' || title_ar, query) DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;
```

### 13.2 Realtime (Replacing WebSocket)

Supabase Realtime for live updates:

```typescript
// apps/web/hooks/useRealtimeNotifications.ts
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeNotifications(userId: string) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      }, (payload) => {
        // Show toast notification
        showNotification(payload.new)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])
}
```

### 13.3 Job Queue (Replacing BullMQ)

Using Supabase pg_cron + Edge Functions:

```sql
-- SLA reminder check (runs every hour)
SELECT cron.schedule(
  'check-approval-sla',
  '0 * * * *',
  $$
    INSERT INTO notifications (recipient_id, type, title_en, title_ar, resource_type, resource_id)
    SELECT
      a.approver_id,
      'sla_reminder',
      'Approval pending for ' || a.sla_hours || ' hours',
      'موافقة معلقة لمدة ' || a.sla_hours || ' ساعة',
      ar.resource_type,
      ar.resource_id
    FROM approval_steps a
    JOIN approval_requests ar ON ar.id = a.approval_request_id
    WHERE a.status = 'active'
      AND a.decided_at IS NULL
      AND a.reminder_sent_at IS NULL
      AND now() - (SELECT submitted_at FROM approval_requests WHERE id = a.approval_request_id) 
        > (a.sla_hours * interval '1 hour' * 0.75);
  $$
);
```

### 13.4 File Processing Pipeline

```typescript
// Supabase Storage + Edge Function trigger
// On file upload → validate → scan → mark clean/quarantined

// apps/web/app/api/v1/files/upload/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const formData = await request.formData()
  const file = formData.get('file') as File
  const purpose = formData.get('purpose') as string

  // Upload to Supabase Storage
  const key = `${crypto.randomUUID()}-${file.name}`
  const { data: upload, error } = await supabase.storage
    .from(getBucketForPurpose(purpose))
    .upload(key, file)

  if (error) return NextResponse.json({ error }, { status: 400 })

  // Create file record
  const { data: fileRecord } = await supabase
    .from('files')
    .insert({
      storage_key: key,
      original_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      sha256: await computeSha256(file),
      malware_status: 'clean', // simplified for demo
      purpose,
    })
    .select()
    .single()

  return NextResponse.json(fileRecord, { status: 201 })
}
```

---

## 14. Internationalization (i18n)

### 14.1 Strategy

- **Library:** `next-intl` for server + client components
- **Default locale:** English (for demo), Arabic fully supported
- **RTL:** Automatic via `dir="rtl"` on `<html>` + Tailwind logical properties
- **Content:** All DB content stored in both AR and EN columns
- **UI strings:** JSON message files

### 14.2 Message Files Structure

```json
// apps/web/messages/en.json
{
  "nav": {
    "dashboard": "Dashboard",
    "candidates": "Candidates",
    "applications": "Applications",
    "jobs": "Jobs",
    "requisitions": "Requisitions",
    "offers": "Offers",
    "readiness": "Employment Readiness",
    "government": "Government Cases",
    "interviews": "Interviews",
    "analytics": "Analytics",
    "settings": "Settings"
  },
  "careers": {
    "title": "Find Your Next Opportunity",
    "search_placeholder": "Search jobs...",
    "filter_department": "Department",
    "filter_city": "City",
    "filter_type": "Employment Type",
    "apply_now": "Apply Now",
    "posted": "Posted",
    "deadline": "Deadline"
  },
  "compliance": {
    "pass": "Pass",
    "blocked": "Blocked",
    "warning": "Warning",
    "manual_review": "Manual Review Required",
    "override_pending": "Override Pending",
    "rule_stale": "Rule Stale"
  }
}
```

```json
// apps/web/messages/ar.json
{
  "nav": {
    "dashboard": "لوحة التحكم",
    "candidates": "المرشحون",
    "applications": "الطلبات",
    "jobs": "الوظائف",
    "requisitions": "طلبات التوظيف",
    "offers": "العروض",
    "readiness": "الجاهزية الوظيفية",
    "government": "الحالات الحكومية",
    "interviews": "المقابلات",
    "analytics": "التقارير",
    "settings": "الإعدادات"
  },
  "careers": {
    "title": "ابحث عن فرصتك القادمة",
    "search_placeholder": "ابحث عن وظيفة...",
    "filter_department": "القسم",
    "filter_city": "المدينة",
    "filter_type": "نوع العمل",
    "apply_now": "تقدم الآن",
    "posted": "تاريخ النشر",
    "deadline": "آخر موعد"
  },
  "compliance": {
    "pass": "مجتاز",
    "blocked": "محظور",
    "warning": "تحذير",
    "manual_review": "يتطلب مراجعة يدوية",
    "override_pending": "استثناء قيد المراجعة",
    "rule_stale": "قاعدة منتهية الصلاحية"
  }
}
```

---

## 15. Package Dependencies

```json
// package.json (root)
{
  "name": "recruitment-chessboard",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "supabase db push",
    "db:seed": "tsx scripts/seed-demo.ts",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/database.ts"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "resend": "^4.0.0",
    "@tanstack/react-query": "^5.50.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.0",
    "zustand": "^5.0.0",
    "next-intl": "^4.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^4.0.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "class-variance-authority": "^0.7.0",
    "tailwindcss-animate": "^1.0.7",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-toast": "^1.2.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "supabase": "^2.0.0",
    "tsx": "^4.16.0"
  }
}
```

---

## 16. Security Measures (Demo-Appropriate)

| Measure | Implementation |
|---|---|
| Authentication | Supabase Auth (JWT, sessions, MFA); admin-managed passwords only |
| Authorization | RLS policies + application-level RBAC |
| Data isolation | `org_id` on every table + RLS |
| Field encryption | AES-256-GCM for PII (national_id, iqama, etc.) |
| File security | Supabase Storage policies (private buckets) |
| API security | Auth middleware on all `/api/v1/*` routes |
| Rate limiting | Vercel Edge middleware |
| Input validation | Zod schemas on all mutations |
| XSS prevention | React DOM escaping + CSP headers |
| CSRF | Supabase Auth uses httpOnly cookies |
| Audit trail | Append-only `audit_events` table |
| Secrets | Vercel environment variables (never in code) |

---

## 17. Performance Targets

| Metric | Target | How |
|---|---|---|
| First Contentful Paint | < 1.5s | SSR on Vercel Edge |
| Largest Contentful Paint | < 2.5s | Image optimization, ISR |
| Time to Interactive | < 3.5s | Code splitting, lazy loading |
| API response (P95) | < 500ms | Supabase connection pooling |
| Kanban drag-drop | < 100ms | Optimistic updates |
| Search results | < 200ms | pg_trgm indexed |
| Page transitions | < 300ms | Next.js prefetching |

---

## 18. Demo Walkthrough Scenarios

When the demo is complete, these are the guided scenarios:

1. **Recruiter Flow:** Login → Create requisition → Submit for approval → Publish job → Review applications → Move through pipeline → Create offer → Send to candidate
2. **Compliance Officer Flow:** Login → Review blocked requisition → Evaluate rules → Approve/Override → Monitor dashboard
3. **Candidate Flow:** Browse careers → View job → Apply (multi-step) → Check status → Receive offer → Accept → Complete preboarding tasks
4. **HR Manager Flow:** Login → Dashboard → Approve requisitions → Approve offers → Monitor readiness cases → Confirm joining
5. **Government Relations Flow:** Login → View readiness cases → Manage Qiwa contract → Track visa/transfer → Update case status

---

## 19. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Supabase free-tier limits | Use Pro plan ($25/mo) — 8GB DB, 250GB bandwidth |
| Vercel function timeout (10s) | Heavy AI calls use Edge Functions (no timeout) |
| Demo data reset | Seed script can fully repopulate in < 60s |
| Arabic font rendering | Test on Chrome, Safari, Firefox; IBM Plex Sans Arabic well-supported |
| RLS performance | Index `org_id` on all tables; use `auth.uid()` efficiently |
| File upload size | 20MB limit in Supabase Storage; sufficient for CVs/docs |

---

## 20. Post-Demo Production Migration Path

When moving to production on Hostinger:

1. Export Supabase schema → Drizzle migrations
2. Replace Supabase Auth → Better Auth
3. Replace Supabase Storage → MinIO
4. Add BullMQ + Redis for job queue
5. Add Temporal.io for durable workflows
6. Add Meilisearch for advanced Arabic search
7. Docker Compose deployment (as per original Technical Implementation Plan)
8. Nginx + TLS + domain cutover

The demo proves all features work end-to-end; production adds infrastructure hardening.

---

*This blueprint implements every feature from the BRD v2.0 and Technical Implementation Plan, adapted for rapid deployment on Vercel + Supabase while maintaining the complete Chessboard brand identity in light mode.*
