import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  ids:    z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['advance', 'reject', 'assign']),
  // advance
  to_stage: z.string().optional(),
  notes:    z.string().optional(),
  // reject
  rejection_reason_id: z.string().uuid().optional(),
  // assign
  assigned_to: z.string().uuid().nullable().optional(),
})

const STAGE_ORDER = ['applied','screening','shortlisted','interview','assessment','offer','hired']

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ids, action, to_stage, notes, rejection_reason_id, assigned_to } = schema.parse(body)

  const results = await Promise.allSettled(ids.map(async (id) => {
    if (action === 'advance') {
      const { data: app } = await supabase
        .from('job_applications')
        .select('id, current_stage, status')
        .eq('id', id)
        .single()
      if (!app || app.status !== 'active') throw new Error('skipped')
      if (!to_stage) throw new Error('to_stage required')
      const toIdx = STAGE_ORDER.indexOf(to_stage)
      const fromIdx = STAGE_ORDER.indexOf(app.current_stage)
      if (toIdx <= fromIdx) throw new Error('Cannot go backward')
      await supabase.from('job_applications').update({ current_stage: to_stage, updated_at: new Date().toISOString() }).eq('id', id)
      await supabase.from('application_stage_events').insert({ application_id: id, from_stage: app.current_stage, to_stage, actor_id: user.id, notes: notes ?? null })
      return { id, ok: true }
    }

    if (action === 'reject') {
      const { data: app } = await supabase.from('job_applications').select('id, current_stage, status').eq('id', id).single()
      if (!app || app.status !== 'active') throw new Error('skipped')
      const upd: Record<string, unknown> = { status: 'rejected', updated_at: new Date().toISOString() }
      if (rejection_reason_id) upd.rejection_reason_id = rejection_reason_id
      await supabase.from('job_applications').update(upd).eq('id', id)
      await supabase.from('application_stage_events').insert({ application_id: id, from_stage: app.current_stage, to_stage: 'rejected', actor_id: user.id, notes: notes ?? null })
      return { id, ok: true }
    }

    if (action === 'assign') {
      await supabase.from('job_applications').update({ assigned_to: assigned_to ?? null, updated_at: new Date().toISOString() }).eq('id', id)
      return { id, ok: true }
    }
  }))

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed    = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ succeeded, failed })
}
