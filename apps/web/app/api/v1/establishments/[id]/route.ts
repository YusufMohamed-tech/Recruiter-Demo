import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name_ar:          z.string().min(1).optional(),
  name_en:          z.string().optional(),
  unified_number:   z.string().optional(),
  activity_code:    z.string().optional(),
  activity_desc_ar: z.string().optional(),
  city:             z.string().optional(),
  mol_status:       z.string().optional(),
  nitaqat_band:     z.string().optional(),
  saudization_pct:  z.number().min(0).max(100).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = schema.parse(body)

  const { data, error } = await supabase
    .from('establishments')
    .update(validated)
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'update', resource_type: 'establishment', resource_id: (await params).id,
  })

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const { error } = await supabase
    .from('establishments')
    .delete()
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'delete', resource_type: 'establishment', resource_id: (await params).id,
  })

  return NextResponse.json({ success: true })
}
