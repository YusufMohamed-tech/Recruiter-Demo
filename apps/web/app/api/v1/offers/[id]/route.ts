import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      candidates ( id, name_en, name_ar, email, phone, current_title, nationality ),
      job_applications ( id, current_stage, job_postings ( id, title_en ) ),
      creator:created_by ( id, name_en ),
      offer_versions ( * ),
      offer_responses ( * )
    `)
    .eq('id', (await params).id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
