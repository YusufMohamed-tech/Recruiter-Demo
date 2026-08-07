import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { CareersClient } from './CareersClient'

export const metadata: Metadata = {
  title: 'Careers | Chessboard Group',
  description: 'Find your next opportunity at Chessboard Group — explore open positions across Saudi Arabia.',
  openGraph: {
    title: 'Careers | Chessboard Group',
    description: 'Explore open positions at Chessboard Group.',
    type: 'website',
  },
}

async function getInitialData() {
  const supabase = await createServerSupabase()

  const [{ data: jobs }, { data: departments }] = await Promise.all([
    supabase
      .from('job_postings')
      .select(`
        id, slug, title_en, title_ar, summary_en, summary_ar,
        city, employment_type, deadline, published_at,
        salary_visible, salary_min, salary_max,
        department:departments(id, name_en, name_ar)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),
    supabase
      .from('departments')
      .select('id, name_en, name_ar')
      .order('name_en'),
  ])

  return { jobs: jobs ?? [], departments: departments ?? [] }
}

export default async function CareersPage() {
  const { jobs, departments } = await getInitialData()
  return <CareersClient initialJobs={jobs} departments={departments} />
}
