import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const STAGE_ORDER = [
  'applied', 'screening', 'shortlisted', 'interview', 'assessment', 'offer', 'hired',
]

const schema = z.object({
  to_stage:    z.string().min(1),
  notes:       z.string().optional(),
  gate_checks: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { to_stage, notes, gate_checks } = schema.parse(body)

  const { data: app, error: appErr } = await supabase
    .from('job_applications')
    .select('id, current_stage, status')
    .eq('id', (await params).id)
    .single()

  if (appErr || !app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'active') return NextResponse.json({ error: 'Application is not active' }, { status: 409 })

  const fromIdx = STAGE_ORDER.indexOf(app.current_stage)
  const toIdx   = STAGE_ORDER.indexOf(to_stage)
  if (toIdx === -1) return NextResponse.json({ error: `Unknown stage: ${to_stage}` }, { status: 400 })
  if (toIdx <= fromIdx) return NextResponse.json({ error: 'Can only advance forward' }, { status: 422 })

  const { error: updateErr } = await supabase
    .from('job_applications')
    .update({ current_stage: to_stage, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)

  if (updateErr) return NextResponse.json({ error: updateErr }, { status: 400 })

  await supabase.from('application_stage_events').insert({
    application_id: (await params).id,
    from_stage:     app.current_stage,
    to_stage,
    actor_id:       user.id,
    notes:          notes ?? null,
    gate_checks:    gate_checks ?? null,
  })

  return NextResponse.json({ ok: true, from_stage: app.current_stage, to_stage })
}
