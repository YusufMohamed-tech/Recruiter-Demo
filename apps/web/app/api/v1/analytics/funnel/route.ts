import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')

  let query = supabase
    .from('mv_pipeline_funnel')
    .select('*')
    .order('total_applications', { ascending: false })
    .limit(50)

  if (jobId) query = query.eq('job_posting_id', jobId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate across all jobs if no specific job
  if (!jobId && data && data.length > 0) {
    const agg = {
      total_applications: 0,
      stage_applied:      0,
      stage_screening:    0,
      stage_interview:    0,
      stage_assessment:   0,
      stage_offer:        0,
      stage_hired:        0,
      total_rejected:     0,
      avg_days_in_pipeline: 0,
    }
    for (const row of data) {
      agg.total_applications += Number(row.total_applications ?? 0)
      agg.stage_applied      += Number(row.stage_applied ?? 0)
      agg.stage_screening    += Number(row.stage_screening ?? 0)
      agg.stage_interview    += Number(row.stage_interview ?? 0)
      agg.stage_assessment   += Number(row.stage_assessment ?? 0)
      agg.stage_offer        += Number(row.stage_offer ?? 0)
      agg.stage_hired        += Number(row.stage_hired ?? 0)
      agg.total_rejected     += Number(row.total_rejected ?? 0)
    }
    agg.avg_days_in_pipeline = data.reduce((s, r) => s + Number(r.avg_days_in_pipeline ?? 0), 0) / data.length
    return NextResponse.json({ aggregate: agg, by_job: data })
  }

  return NextResponse.json({ aggregate: data?.[0] ?? null, by_job: data ?? [] })
}
