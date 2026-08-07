import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const submitSchema = z.object({
  template_id:    z.string().uuid().optional(),
  scores:         z.record(z.object({
    rating: z.number().min(1).max(5).optional(),
    notes:  z.string().optional(),
  })).default({}),
  overall_rating:  z.number().min(1).max(5).optional(),
  recommendation:  z.enum(['strong_hire','hire','neutral','no_hire','strong_no_hire']).default('neutral'),
  strengths:       z.string().optional(),
  concerns:        z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('interview_scorecards')
    .select(`
      *,
      interviewer:interviewer_id ( id, name_en ),
      scorecard_templates ( id, name, criteria )
    `)
    .eq('interview_id', (await params).id)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user is an interviewer on this panel
  const { data: panelMember } = await supabase
    .from('interview_interviewers')
    .select('user_id')
    .eq('interview_id', (await params).id)
    .eq('user_id', user.id)
    .single()

  if (!panelMember) return NextResponse.json({ error: 'You are not assigned to this interview' }, { status: 403 })

  const body = await request.json()
  const payload = submitSchema.parse(body)

  const upsertData = {
    interview_id:   (await params).id,
    interviewer_id: user.id,
    ...payload,
    submitted_at:   new Date().toISOString(),
    updated_at:     new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('interview_scorecards')
    .upsert(upsertData, { onConflict: 'interview_id,interviewer_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}
