import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Service-role client for insert — candidates apply without being logged in
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const schema = z.object({
  job_posting_id:         z.string().uuid(),
  name_en:                z.string().min(1),
  name_ar:                z.string().optional(),
  email:                  z.string().email(),
  phone:                  z.string().optional(),
  current_city:           z.string().optional(),
  nationality:            z.string().optional(),
  current_title:          z.string().optional(),
  total_experience_years: z.number().min(0).optional(),
  education_level:        z.string().optional(),
  linkedin_url:           z.string().url().optional().or(z.literal('')),
  form_responses:         z.record(z.unknown()).optional().default({}),
  privacy_accepted:       z.boolean(),
  source_utm:             z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = schema.parse(body)

  if (!validated.privacy_accepted) {
    return NextResponse.json({ error: 'Privacy notice must be accepted' }, { status: 400 })
  }

  // Fetch job to get org_id
  const supabase = await createServerSupabase()
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, org_id, status')
    .eq('id', validated.job_posting_id)
    .single()

  if (!job || job.status !== 'published') {
    return NextResponse.json({ error: 'Job not found or no longer accepting applications' }, { status: 404 })
  }

  const orgId = job.org_id

  // Upsert candidate (duplicate detection by org+email)
  const { data: candidate, error: cErr } = await adminClient
    .from('candidates')
    .upsert({
      org_id:                 orgId,
      name_en:                validated.name_en,
      name_ar:                validated.name_ar,
      email:                  validated.email,
      phone:                  validated.phone,
      current_city:           validated.current_city,
      nationality:            validated.nationality,
      current_title:          validated.current_title,
      total_experience_years: validated.total_experience_years,
      education_level:        validated.education_level,
      linkedin_url:           validated.linkedin_url || null,
    }, { onConflict: 'org_id,email', ignoreDuplicates: false })
    .select('id')
    .single()

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })

  // Create application (guard duplicate)
  const { data: existing } = await adminClient
    .from('job_applications')
    .select('id')
    .eq('job_posting_id', validated.job_posting_id)
    .eq('candidate_id', candidate!.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You have already applied for this position.' }, { status: 409 })
  }

  const { data: application, error: aErr } = await adminClient
    .from('job_applications')
    .insert({
      org_id:                  orgId,
      job_posting_id:          validated.job_posting_id,
      candidate_id:            candidate!.id,
      form_responses:          validated.form_responses,
      privacy_notice_accepted: true,
      privacy_notice_version:  '1.0',
      privacy_accepted_at:     new Date().toISOString(),
      source_utm:              validated.source_utm ?? null,
      current_stage:           'applied',
      status:                  'active',
    })
    .select('id')
    .single()

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 })

  // Stage event
  await adminClient.from('application_stage_events').insert({
    application_id: application!.id,
    to_stage: 'applied',
  })

  return NextResponse.json({ success: true, application_id: application!.id }, { status: 201 })
}
