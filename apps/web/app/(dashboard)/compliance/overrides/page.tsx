import { Suspense } from 'react'
import { OverridesClient } from './OverridesClient'

export default function OverridesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Override Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and decide on compliance override requests. You cannot approve your own requests.</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <OverridesClient />
      </Suspense>
    </div>
  )
}
