import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status:       z.enum(['pending','sent','completed','expired']).optional(),
  score:        z.number().min(0).optional(),
  max_score:    z.number().min(0).optional(),
  completed_at: z.string().datetime({ offset: true }).nullable().optional(),
  sent_at:      z.string().datetime({ offset: true }).nullable().optional(),
  notes:        z.string().nullable().optional(),
  due_at:       z.string().datetime({ offset: true }).nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const patch = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('assessments')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('assessments').delete().eq('id', (await params).id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
