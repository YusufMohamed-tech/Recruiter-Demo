import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  job_title:   z.string().min(1),
  start_date:  z.string().optional(),
  base_salary: z.number().min(0).optional(),
  currency:    z.string().default('SAR'),
  allowances:  z.record(z.number()).optional().default({}),
  benefits:    z.array(z.string()).optional().default([]),
  terms_en:    z.string().optional(),
  terms_ar:    z.string().optional(),
  expires_at:  z.string().datetime({ offset: true }).nullable().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: offer } = await supabase
    .from('offers')
    .select('id, current_version, status')
    .eq('id', (await params).id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (['accepted','withdrawn'].includes(offer.status)) {
    return NextResponse.json({ error: 'Cannot revise an accepted or withdrawn offer' }, { status: 409 })
  }

  const body = await request.json()
  const { expires_at, benefits, ...rest } = schema.parse(body)

  const newVersion = offer.current_version + 1

  const { data: version, error: verErr } = await supabase
    .from('offer_versions')
    .insert({
      offer_id:  (await params).id,
      version:   newVersion,
      ...rest,
      benefits:  { items: benefits },
      created_by: user.id,
    })
    .select()
    .single()

  if (verErr) return NextResponse.json({ error: verErr }, { status: 400 })

  await supabase
    .from('offers')
    .update({
      current_version: newVersion,
      status:          'draft',
      expires_at:      expires_at ?? null,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', (await params).id)

  return NextResponse.json(version, { status: 201 })
}
