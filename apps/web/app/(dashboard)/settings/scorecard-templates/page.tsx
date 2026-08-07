import { Suspense } from 'react'
import { ScorecardTemplatesClient } from './ScorecardTemplatesClient'

export const metadata = { title: 'Scorecard Templates' }

export default function ScorecardTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Scorecard Templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">Define reusable interview scorecards with criteria and weights.</p>
      </div>
      <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <ScorecardTemplatesClient />
      </Suspense>
    </div>
  )
}
