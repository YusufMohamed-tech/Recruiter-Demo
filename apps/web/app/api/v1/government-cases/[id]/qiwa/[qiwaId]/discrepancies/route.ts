import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  field_name:     z.string().min(1),
  offer_value:    z.string().optional(),
  contract_value: z.string().optional(),
})

const patchSchema = z.object({
  resolved:         z.boolean().optional(),
  resolution_notes: z.string().optional(),
}).strict()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qiwaId: string }> }
) {
  const supabase = await createServerSupabase()

  // Verify qiwa case belongs to user's org via gov case
  const { data: qiwa } = await supabase
    .from('qiwa_contract_cases')
    .select('id, government_cases ( org_id )')
    .eq('id', (await params).qiwaId)
    .eq('government_case_id', (await params).id)
    .single()
  if (!qiwa) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const input = createSchema.parse(body)

  const { data, error } = await supabase
    .from('contract_discrepancies')
    .insert({ ...input, qiwa_case_id: (await params).qiwaId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qiwaId: string }> }
) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)
  const discrepancyId = searchParams.get('discrepancy_id')
  if (!discrepancyId) return NextResponse.json({ error: 'discrepancy_id required' }, { status: 400 })

  const body = await request.json()
  const updates = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('contract_discrepancies')
    .update(updates)
    .eq('id', discrepancyId)
    .eq('qiwa_case_id', (await params).qiwaId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
