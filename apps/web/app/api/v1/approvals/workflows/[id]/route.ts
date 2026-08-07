import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  name:      z.string().min(1).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('approval_workflows')
    .update(validated)
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select().single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { error } = await supabase
    .from('approval_workflows')
    .update({ is_active: false })
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}
