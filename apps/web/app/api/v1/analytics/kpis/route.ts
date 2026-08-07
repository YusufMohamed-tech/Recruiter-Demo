import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()

  const [
    { count: openReqs },
    { count: activeApps },
    { count: pendingOffers },
    { count: readinessCases },
    { count: scheduledInterviews },
    { count: totalCandidates },
    { count: hiredThisMonth },
    { count: openPrivacyRequests },
  ] = await Promise.all([
    supabase.from('job_requisitions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).not('current_stage', 'in', '(hired,rejected,withdrawn)'),
    supabase.from('offers').select('*', { count: 'exact', head: true }).in('status', ['draft', 'pending_approval', 'sent']),
    supabase.from('employment_readiness_cases').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('interview_panels').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('job_applications').select('*', { count: 'exact', head: true })
      .eq('current_stage', 'hired')
      .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('privacy_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  return NextResponse.json({
    open_requisitions:       openReqs ?? 0,
    active_applications:     activeApps ?? 0,
    pending_offers:          pendingOffers ?? 0,
    readiness_cases:         readinessCases ?? 0,
    scheduled_interviews:    scheduledInterviews ?? 0,
    total_candidates:        totalCandidates ?? 0,
    hired_this_month:        hiredThisMonth ?? 0,
    open_privacy_requests:   openPrivacyRequests ?? 0,
  })
}
