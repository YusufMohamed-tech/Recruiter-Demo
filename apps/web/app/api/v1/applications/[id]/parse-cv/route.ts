import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { parseCV } from '@/lib/ai/cv-parser'
import { z } from 'zod'

const schema = z.object({
  cv_text: z.string().min(10),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { cv_text } = schema.parse(body)

  const { data: app } = await supabase
    .from('job_applications')
    .select('id, candidate_id')
    .eq('id', (await params).id)
    .single()

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = await parseCV(cv_text)

  await supabase
    .from('candidates')
    .update({
      parsed_profile:          parsed,
      total_experience_years:  parsed.total_experience_years ?? undefined,
      current_title:           parsed.current_title ?? undefined,
      education_level:         parsed.education_level ?? undefined,
      updated_at:              new Date().toISOString(),
    })
    .eq('id', app.candidate_id)

  return NextResponse.json({ ok: true, parsed })
}
