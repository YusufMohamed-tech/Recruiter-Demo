import { Suspense } from 'react'
import { InterviewsClient } from './InterviewsClient'

export const metadata = { title: 'Interviews' }

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Interviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">Schedule and track interviews across all active applications.</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <InterviewsClient />
      </Suspense>
    </div>
  )
}
