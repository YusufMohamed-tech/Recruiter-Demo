import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  application_id:  z.string().uuid(),
  title:           z.string().min(1),
  provider:        z.string().optional(),
  assessment_url:  z.string().url().optional().or(z.literal('')),
  due_at:          z.string().datetime({ offset: true }).optional(),
  notes:           z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const applicationId = searchParams.get('application_id')

  let query = supabase
    .from('assessments')
    .select(`
      *,
      job_applications (
        id,
        candidates ( id, name_en ),
        job_postings ( id, title_en )
      )
    `)
    .order('created_at', { ascending: false })

  if (applicationId) query = query.eq('application_id', applicationId)

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
  const payload = createSchema.parse(body)

  const { data, error } = await supabase
    .from('assessments')
    .insert({ ...payload, org_id: profile?.org_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
