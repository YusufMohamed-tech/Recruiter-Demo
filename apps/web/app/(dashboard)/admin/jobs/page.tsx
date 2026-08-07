import { Suspense } from 'react'
import { JobsClient } from './JobsClient'

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Job Postings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage published and draft job listings</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <JobsClient />
      </Suspense>
    </div>
  )
}
