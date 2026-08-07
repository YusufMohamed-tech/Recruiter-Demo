import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data, error } = await supabase
    .from('departments')
    .select('id, name_en, name_ar, code')
    .eq('org_id', profile?.org_id)
    .order('name_en')

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}
