import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  reason_en: z.string().min(1),
  reason_ar: z.string().optional(),
})

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const { data, error } = await supabase
    .from('rejection_reasons')
    .select('id, reason_en, reason_ar')
    .eq('org_id', profile?.org_id)
    .eq('is_active', true)
    .order('reason_en')

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const body = await request.json()
  const { reason_en, reason_ar } = createSchema.parse(body)

  const { data, error } = await supabase
    .from('rejection_reasons')
    .insert({ org_id: profile?.org_id, reason_en, reason_ar })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
