import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const fieldSchema = z.object({
  key:         z.string().min(1),
  type:        z.enum(['text','textarea','select','checkbox','number','date','file']),
  label_en:    z.string().min(1),
  label_ar:    z.string().optional(),
  required:    z.boolean().default(false),
  options:     z.array(z.string()).optional(),
  placeholder: z.string().optional(),
})

const saveSchema = z.object({
  fields: z.array(fieldSchema),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('application_form_versions')
    .select('id, version, schema_json, is_active, created_at')
    .eq('job_posting_id', (await params).id)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data ?? null)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const { fields } = saveSchema.parse(body)

  // Deactivate previous version
  await supabase
    .from('application_form_versions')
    .update({ is_active: false })
    .eq('job_posting_id', (await params).id)

  const { data: existing } = await supabase
    .from('application_form_versions')
    .select('version')
    .eq('job_posting_id', (await params).id)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const newVersion = (existing?.version ?? 0) + 1

  const { data, error } = await supabase
    .from('application_form_versions')
    .insert({
      org_id:         profile?.org_id,
      job_posting_id: (await params).id,
      version:        newVersion,
      schema_json:    { fields },
      is_active:      true,
      created_by:     user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  // Link form version to job posting
  await supabase
    .from('job_postings')
    .update({ application_form_id: data.id })
    .eq('id', (await params).id)

  return NextResponse.json(data)
}
