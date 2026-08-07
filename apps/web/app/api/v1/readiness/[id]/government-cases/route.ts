import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  case_type:        z.string().min(1),
  platform:         z.string().min(1),
  reference_number: z.string().optional(),
  notes:            z.string().optional(),
  assigned_to:      z.string().uuid().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cas } = await supabase
    .from('employment_readiness_cases')
    .select('id, org_id')
    .eq('id', (await params).id)
    .single()
  if (!cas) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const input = createSchema.parse(body)

  const { data, error } = await supabase
    .from('government_cases')
    .insert({ ...input, readiness_case_id: (await params).id, org_id: cas.org_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
