import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const orgId = userRow.org_id

  const [jobsRes, appsRes, pendingRes, teamRes] = await Promise.all([
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'published'),
    supabase.from('seeker_applications').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('seeker_applications').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'submitted'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
  ])

  return NextResponse.json({
    active_jobs: jobsRes.count || 0,
    total_applications: appsRes.count || 0,
    pending_review: pendingRes.count || 0,
    team_members: teamRes.count || 0,
  })
}
