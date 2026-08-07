import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  application_id:  z.string().uuid(),
  title:           z.string().min(1).default('Interview'),
  interview_type:  z.enum(['hr','technical','panel','final','assessment']).default('hr'),
  scheduled_at:    z.string().datetime({ offset: true }).optional(),
  duration_mins:   z.number().int().min(15).max(480).default(60),
  location:        z.string().optional(),
  format:          z.enum(['video','in_person','phone']).default('video'),
  notes:           z.string().optional(),
  interviewer_ids: z.array(z.string().uuid()).default([]),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const applicationId = searchParams.get('application_id')
  const mine          = searchParams.get('mine')
  const status        = searchParams.get('status')

  let query = supabase
    .from('interview_panels')
    .select(`
      id, title, interview_type, scheduled_at, duration_mins, location, format, status, notes, created_at,
      organizer:organizer_id ( id, name_en ),
      interview_interviewers ( user_id, users ( id, name_en, email ) ),
      job_applications ( id,
        candidates ( id, name_en, email ),
        job_postings ( id, title_en ) )
    `)
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  if (applicationId) query = query.eq('application_id', applicationId)
  if (status)        query = query.eq('status', status)

  if (mine) {
    // Get all interviews where user is an interviewer
    const { data: myIds } = await supabase
      .from('interview_interviewers')
      .select('interview_id')
      .eq('user_id', user.id)
    const ids = (myIds ?? []).map(r => r.interview_id)
    if (ids.length === 0) return NextResponse.json([])
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const body = await request.json()
  const { interviewer_ids, ...rest } = createSchema.parse(body)

  const { data: interview, error } = await supabase
    .from('interview_panels')
    .insert({ ...rest, org_id: profile?.org_id, organizer_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  if (interviewer_ids.length > 0) {
    await supabase.from('interview_interviewers').insert(
      interviewer_ids.map(uid => ({ interview_id: interview.id, user_id: uid }))
    )
  }

  // Advance application to interview stage if earlier
  await supabase.rpc('advance_application_stage_if_earlier', {
    p_application_id: rest.application_id,
    p_to_stage: 'interview',
    p_actor_id: user.id,
  }).catch(() => null) // best-effort — function may not exist yet, handle gracefully

  return NextResponse.json(interview, { status: 201 })
}
