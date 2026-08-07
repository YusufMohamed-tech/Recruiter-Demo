import { Suspense } from 'react'
import { CandidateDetail } from './CandidateDetail'

export const metadata = { title: 'Candidate Profile' }

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <CandidateDetail id={(await params).id} />
    </Suspense>
  )
}
