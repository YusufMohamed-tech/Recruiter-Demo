import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status:           z.enum(['pending','in_progress','completed','cancelled']).optional(),
  reference_number: z.string().nullable().optional(),
  submitted_at:     z.string().nullable().optional(),
  completed_at:     z.string().nullable().optional(),
  notes:            z.string().nullable().optional(),
  assigned_to:      z.string().uuid().nullable().optional(),
}).strict()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('government_cases')
    .select(`
      id, case_type, platform, status, reference_number,
      submitted_at, completed_at, notes, created_at, updated_at,
      assigned_user:assigned_to ( id, name_en ),
      employment_readiness_cases (
        id, branch_type,
        candidates ( id, name_en, name_ar, email )
      ),
      qiwa_contract_cases (
        id, contract_number, contract_status, submitted_at, signed_at, qiwa_ref,
        contract_discrepancies ( id, field_name, offer_value, contract_value, resolved, resolution_notes )
      )
    `)
    .eq('id', (await params).id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const body = await request.json()
  const updates = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('government_cases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
