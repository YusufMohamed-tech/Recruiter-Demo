import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  title:           z.string().min(1).optional(),
  interview_type:  z.enum(['hr','technical','panel','final','assessment']).optional(),
  scheduled_at:    z.string().datetime({ offset: true }).nullable().optional(),
  duration_mins:   z.number().int().min(15).max(480).optional(),
  location:        z.string().nullable().optional(),
  format:          z.enum(['video','in_person','phone']).optional(),
  status:          z.enum(['scheduled','completed','cancelled','no_show']).optional(),
  notes:           z.string().nullable().optional(),
  interviewer_ids: z.array(z.string().uuid()).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('interview_panels')
    .select(`
      *,
      organizer:organizer_id ( id, name_en, email ),
      interview_interviewers ( user_id, users ( id, name_en, email ) ),
      interview_scorecards (
        id, overall_rating, recommendation, strengths, concerns, submitted_at,
        interviewer:interviewer_id ( id, name_en )
      ),
      job_applications (
        id,
        candidates ( id, name_en, email, current_title, total_experience_years ),
        job_postings ( id, title_en )
      )
    `)
    .eq('id', (await params).id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { interviewer_ids, ...rest } = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('interview_panels')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  if (interviewer_ids !== undefined) {
    await supabase.from('interview_interviewers').delete().eq('interview_id', id)
    if (interviewer_ids.length > 0) {
      await supabase.from('interview_interviewers').insert(
        interviewer_ids.map(uid => ({ interview_id: id, user_id: uid }))
      )
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('interview_panels')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', (await params).id)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
