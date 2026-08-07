import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  identity_verified:    z.boolean(),
  attendance_confirmed: z.boolean(),
  documents_received:   z.boolean(),
  notes:                z.string().optional(),
  no_show:              z.boolean().default(false),
  no_show_reason:       z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('joining_confirmations')
    .select('*, confirmed_by_user:confirmed_by ( id, name_en )')
    .eq('readiness_case_id', (await params).id)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const input = createSchema.parse(body)

  // Verify case exists and belongs to user's org
  const { data: cas } = await supabase
    .from('employment_readiness_cases')
    .select('id, status')
    .eq('id', (await params).id)
    .single()
  if (!cas) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('joining_confirmations')
    .select('id')
    .eq('readiness_case_id', (await params).id)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('joining_confirmations')
      .update({ ...input })
      .eq('id', existing.id)
      .select('*, confirmed_by_user:confirmed_by ( id, name_en )')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Update case status based on outcome
    const newStatus = input.no_show ? 'no_show' : 'joined'
    const patch: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (!input.no_show) patch.actual_join_date = new Date().toISOString().split('T')[0]
    await supabase.from('employment_readiness_cases').update(patch).eq('id', (await params).id)

    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('joining_confirmations')
    .insert({ ...input, readiness_case_id: (await params).id, confirmed_by: user.id })
    .select('*, confirmed_by_user:confirmed_by ( id, name_en )')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const newStatus = input.no_show ? 'no_show' : 'joined'
  const patch: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }
  if (!input.no_show) patch.actual_join_date = new Date().toISOString().split('T')[0]
  await supabase.from('employment_readiness_cases').update(patch).eq('id', (await params).id)

  return NextResponse.json(data, { status: 201 })
}
