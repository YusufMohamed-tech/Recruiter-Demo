import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { CandidatePortal } from './CandidatePortal'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { data: tokenRow } = await adminClient
    .from('candidate_portal_tokens')
    .select('candidate_id, expires_at')
    .eq('token', (await params).token)
    .single()

  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    notFound()
  }

  const { data: candidate } = await adminClient
    .from('candidates')
    .select(`
      id, name_en, email, phone, current_title, current_city, nationality,
      job_applications (
        id, current_stage, status, ai_match_score, created_at,
        job_postings ( id, title_en, city, employment_type )
      )
    `)
    .eq('id', tokenRow.candidate_id)
    .single()

  if (!candidate) notFound()

  return <CandidatePortal candidate={candidate as Parameters<typeof CandidatePortal>[0]['candidate']} />
}
