import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  item_type: z.string().min(1),
  label_en:  z.string().min(1),
  label_ar:  z.string().optional(),
  mandatory: z.boolean().default(true),
  owner_id:  z.string().uuid().optional(),
  due_date:  z.string().optional(),
  notes:     z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const body = await request.json()
  const input = createSchema.parse(body)

  // Verify case belongs to user's org
  const { data: cas } = await supabase
    .from('employment_readiness_cases')
    .select('id')
    .eq('id', (await params).id)
    .single()
  if (!cas) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('readiness_checklist_items')
    .insert({ ...input, readiness_case_id: (await params).id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Refresh SERE score
  await supabase.rpc('recalculate_sere_score', { p_case_id: (await params).id }).catch(() => null)

  return NextResponse.json(data, { status: 201 })
}
