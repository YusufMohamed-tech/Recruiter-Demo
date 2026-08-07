import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  code:       z.string().min(1),
  event_type: z.string().min(1),
  channel:    z.enum(['email', 'sms', 'in_app']).default('email'),
  subject_en: z.string().optional(),
  subject_ar: z.string().optional(),
  body_en:    z.string().min(1),
  body_ar:    z.string().optional(),
  variables:  z.array(z.string()).default([]),
})

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('communication_template_versions')
    .select('*')
    .eq('is_active', true)
    .order('event_type')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!userRow) return NextResponse.json({ error: 'User profile not found' }, { status: 403 })

  const body = await request.json()
  const input = createSchema.parse(body)

  // Get max version for this code
  const { data: existing } = await supabase
    .from('communication_template_versions')
    .select('version')
    .eq('org_id', userRow.org_id)
    .eq('code', input.code)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = existing ? existing.version + 1 : 1

  // Deactivate previous versions
  if (existing) {
    await supabase
      .from('communication_template_versions')
      .update({ is_active: false })
      .eq('org_id', userRow.org_id)
      .eq('code', input.code)
  }

  const { data, error } = await supabase
    .from('communication_template_versions')
    .insert({
      ...input,
      org_id:     userRow.org_id,
      version:    nextVersion,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
