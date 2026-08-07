import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const updateOrgSchema = z.object({
  legal_name_en:       z.string().min(1),
  legal_name_ar:       z.string().min(1),
  cr_number:           z.string().optional(),
  vat_number:          z.string().optional(),
  headquarters_city:   z.string().optional(),
  address_en:          z.string().optional(),
  address_ar:          z.string().optional(),
  phone:               z.string().optional(),
  email:               z.string().email().optional().or(z.literal('')),
  website:             z.string().url().optional().or(z.literal('')),
})

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data, error } = await supabase.from('organizations').select('*').eq('id', profile?.org_id).single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = updateOrgSchema.parse(body)

  const { data, error } = await supabase
    .from('organizations')
    .update(validated)
    .eq('id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'update', resource_type: 'organization', resource_id: profile?.org_id,
  })

  return NextResponse.json(data)
}
