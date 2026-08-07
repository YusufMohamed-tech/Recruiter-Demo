import { Suspense } from 'react'
import { CandidatesClient } from './CandidatesClient'

export const metadata = { title: 'Candidates' }

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Candidates</h1>
        <p className="mt-1 text-sm text-muted-foreground">All candidate profiles across your organization.</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <CandidatesClient />
      </Suspense>
    </div>
  )
}
