import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('requisition_versions')
    .select('id, version, snapshot, created_at, changed_by:users!changed_by(id, name_en)')
    .eq('requisition_id', (await params).id)
    .order('version', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}
