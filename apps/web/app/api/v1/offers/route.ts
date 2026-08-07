import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  application_id: z.string().uuid(),
  job_title:      z.string().min(1),
  start_date:     z.string().optional(),
  base_salary:    z.number().min(0).optional(),
  currency:       z.string().default('SAR'),
  allowances:     z.record(z.number()).optional().default({}),
  benefits:       z.array(z.string()).optional().default([]),
  terms_en:       z.string().optional(),
  terms_ar:       z.string().optional(),
  expires_at:     z.string().datetime({ offset: true }).optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '25'))
  const offset = (page - 1) * limit

  let query = supabase
    .from('offers')
    .select(`
      id, status, current_version, expires_at, accepted_at, declined_at, withdrawn_at, created_at,
      candidates ( id, name_en, email ),
      job_applications ( id, job_postings ( id, title_en ) ),
      creator:created_by ( id, name_en )
    `, { count: 'exact' })
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })

  const res = NextResponse.json(data)
  res.headers.set('X-Total-Count', String(count ?? 0))
  return res
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const body = await request.json()
  const { application_id, job_title, start_date, base_salary, currency, allowances, benefits, terms_en, terms_ar, expires_at } = createSchema.parse(body)

  // Lookup candidate_id from application
  const { data: app } = await supabase
    .from('job_applications')
    .select('candidate_id')
    .eq('id', application_id)
    .single()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .insert({
      org_id:         profile?.org_id,
      application_id,
      candidate_id:   app.candidate_id,
      status:         'draft',
      expires_at:     expires_at ?? null,
      created_by:     user.id,
    })
    .select()
    .single()

  if (offerErr) return NextResponse.json({ error: offerErr }, { status: 400 })

  // Create version 1
  const { error: verErr } = await supabase
    .from('offer_versions')
    .insert({
      offer_id:   offer.id,
      version:    1,
      job_title,
      start_date: start_date ?? null,
      base_salary: base_salary ?? null,
      currency,
      allowances:  allowances ?? {},
      benefits:    { items: benefits },
      terms_en:    terms_en ?? null,
      terms_ar:    terms_ar ?? null,
      created_by:  user.id,
    })

  if (verErr) return NextResponse.json({ error: verErr }, { status: 400 })

  return NextResponse.json(offer, { status: 201 })
}
