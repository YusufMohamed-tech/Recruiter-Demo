import { Suspense } from 'react'
import { RejectionReasonsClient } from './RejectionReasonsClient'

export const metadata = { title: 'Rejection Reasons' }

export default function RejectionReasonsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Rejection Reasons</h2>
        <p className="mt-1 text-sm text-muted-foreground">Standard reasons for rejecting applications.</p>
      </div>
      <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RejectionReasonsClient />
      </Suspense>
    </div>
  )
}
