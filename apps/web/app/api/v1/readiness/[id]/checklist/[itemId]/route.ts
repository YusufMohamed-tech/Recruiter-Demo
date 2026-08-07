import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status:       z.enum(['pending','in_progress','completed','waived','blocked']).optional(),
  owner_id:     z.string().uuid().nullable().optional(),
  due_date:     z.string().nullable().optional(),
  notes:        z.string().nullable().optional(),
  waive_reason: z.string().nullable().optional(),
  mandatory:    z.boolean().optional(),
  label_en:     z.string().optional(),
  label_ar:     z.string().nullable().optional(),
}).strict()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const supabase = await createServerSupabase()
  const body = await request.json()
  const updates = patchSchema.parse(body)

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = { ...updates, updated_at: now }

  if (updates.status === 'completed') payload.completed_at = now
  if (updates.status === 'waived') {
    const { data: { user } } = await supabase.auth.getUser()
    payload.waived_by = user?.id
    payload.completed_at = now
  }

  const { data, error } = await supabase
    .from('readiness_checklist_items')
    .update(payload)
    .eq('id', (await params).itemId)
    .eq('readiness_case_id', (await params).id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 400 })

  // Refresh SERE score
  await supabase.rpc('recalculate_sere_score', { p_case_id: (await params).id }).catch(() => null)

  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('readiness_checklist_items')
    .delete()
    .eq('id', (await params).itemId)
    .eq('readiness_case_id', (await params).id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await supabase.rpc('recalculate_sere_score', { p_case_id: (await params).id }).catch(() => null)
  return new NextResponse(null, { status: 204 })
}
