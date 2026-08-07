import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  name_en:                z.string().min(1).optional(),
  name_ar:                z.string().optional(),
  phone:                  z.string().optional(),
  current_city:           z.string().optional(),
  nationality:            z.string().optional(),
  education_level:        z.string().optional(),
  total_experience_years: z.number().optional(),
  current_title:          z.string().optional(),
  linkedin_url:           z.string().optional(),
  tags:                   z.array(z.string()).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(`
      *,
      job_applications (
        id, current_stage, status, ai_match_score, created_at,
        job_postings ( id, title_en, slug )
      )
    `)
    .eq('id', (await params).id)
    .single()

  if (error || !candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(candidate)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const patch = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('candidates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}
