import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status:           z.enum(['open','in_review','completed','rejected']).optional(),
  resolution_notes: z.string().optional(),
}).strict()

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates = patchSchema.parse(body)

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = { ...updates, updated_at: now }
  if (updates.status === 'completed' || updates.status === 'rejected') {
    payload.handled_by = user.id
    payload.handled_at = now
  }

  const { data, error } = await supabase
    .from('privacy_requests')
    .update(payload)
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
