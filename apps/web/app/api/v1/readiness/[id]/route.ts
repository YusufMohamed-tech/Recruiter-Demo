import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status:           z.enum(['open','in_progress','ready','joined','no_show']).optional(),
  branch_type:      z.enum(['saudi','resident_expat','new_expat']).optional(),
  target_join_date: z.string().nullable().optional(),
  actual_join_date: z.string().nullable().optional(),
  assigned_to:      z.string().uuid().nullable().optional(),
}).strict()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('employment_readiness_cases')
    .select(`
      id, status, branch_type, readiness_score, mandatory_blockers,
      target_join_date, actual_join_date, created_at, updated_at,
      candidates ( id, name_en, name_ar, email, phone, nationality ),
      job_applications ( id, job_postings ( id, title_en, title_ar, city ) ),
      offers (
        id, current_version, status,
        offer_versions ( version, basic_salary, currency, total_compensation )
      ),
      assigned_user:assigned_to ( id, name_en ),
      readiness_checklist_items (
        id, item_type, label_en, label_ar, mandatory, status,
        due_date, completed_at, waive_reason, notes,
        owner:owner_id ( id, name_en ),
        waived_user:waived_by ( id, name_en )
      ),
      government_cases (
        id, case_type, platform, status, reference_number,
        submitted_at, completed_at, notes,
        assigned_user:assigned_to ( id, name_en ),
        qiwa_contract_cases (
          id, contract_number, contract_status, submitted_at, signed_at, qiwa_ref,
          contract_discrepancies ( id, field_name, offer_value, contract_value, resolved )
        )
      ),
      joining_confirmations (
        id, identity_verified, attendance_confirmed, documents_received,
        notes, no_show, no_show_reason, created_at,
        confirmed_by_user:confirmed_by ( id, name_en )
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
    .from('employment_readiness_cases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
