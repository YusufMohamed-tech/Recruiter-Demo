import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', (await params).id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (offer.status === 'withdrawn') return NextResponse.json({ error: 'Already withdrawn' }, { status: 409 })
  if (offer.status === 'accepted')  return NextResponse.json({ error: 'Cannot withdraw an accepted offer' }, { status: 409 })

  const body = await request.json().catch(() => ({}))
  const { reason } = schema.parse(body)

  const { error } = await supabase
    .from('offers')
    .update({
      status:         'withdrawn',
      withdrawn_at:   new Date().toISOString(),
      withdraw_reason: reason ?? null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', (await params).id)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
