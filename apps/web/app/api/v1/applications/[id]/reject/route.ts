import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  rejection_reason_id: z.string().uuid().optional(),
  notes:               z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { rejection_reason_id, notes } = schema.parse(body)

  const { data: app, error: appErr } = await supabase
    .from('job_applications')
    .select('id, current_stage, status')
    .eq('id', (await params).id)
    .single()

  if (appErr || !app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'active') return NextResponse.json({ error: 'Application is already closed' }, { status: 409 })

  const updatePayload: Record<string, unknown> = {
    status:     'rejected',
    updated_at: new Date().toISOString(),
  }
  if (rejection_reason_id) updatePayload.rejection_reason_id = rejection_reason_id

  const { error: updateErr } = await supabase
    .from('job_applications')
    .update(updatePayload)
    .eq('id', (await params).id)

  if (updateErr) return NextResponse.json({ error: updateErr }, { status: 400 })

  await supabase.from('application_stage_events').insert({
    application_id: (await params).id,
    from_stage:     app.current_stage,
    to_stage:       'rejected',
    actor_id:       user.id,
    notes:          notes ?? null,
  })

  return NextResponse.json({ ok: true })
}
