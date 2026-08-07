import { Suspense } from 'react'
import { ApplicationsClient } from './ApplicationsClient'

export const metadata = { title: 'Applications' }

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>
}) {
  const { job_id } = await searchParams
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track and manage candidate applications through your pipeline.</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <ApplicationsClient defaultJobId={job_id} />
      </Suspense>
    </div>
  )
}
