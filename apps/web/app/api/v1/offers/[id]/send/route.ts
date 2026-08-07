import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, access_token')
    .eq('id', (await params).id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['draft','pending_approval'].includes(offer.status)) {
    return NextResponse.json({ error: 'Only draft or approved offers can be sent' }, { status: 409 })
  }

  const { error } = await supabase
    .from('offers')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', (await params).id)

  if (error) return NextResponse.json({ error }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return NextResponse.json({
    ok:  true,
    url: `${baseUrl}/offer/${offer.access_token}`,
  })
}
