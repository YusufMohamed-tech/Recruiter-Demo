import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  subject_en: z.string().optional(),
  subject_ar: z.string().optional(),
  body_en:    z.string().optional(),
  body_ar:    z.string().optional(),
  variables:  z.array(z.string()).optional(),
  is_active:  z.boolean().optional(),
}).strict()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('communication_template_versions')
    .select('*')
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
    .from('communication_template_versions')
    .update(updates)
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
