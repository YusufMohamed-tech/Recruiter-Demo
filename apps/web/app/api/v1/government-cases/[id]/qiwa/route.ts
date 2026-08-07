import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  contract_number: z.string().optional(),
  qiwa_ref:        z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()

  // Verify gov case belongs to user's org
  const { data: govCase } = await supabase
    .from('government_cases')
    .select('id')
    .eq('id', (await params).id)
    .single()
  if (!govCase) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const input = createSchema.parse(body)

  const { data, error } = await supabase
    .from('qiwa_contract_cases')
    .insert({ ...input, government_case_id: (await params).id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
