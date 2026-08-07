import { Suspense } from 'react'
import { RulesClient } from './RulesClient'

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Compliance Rules</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage KSA regulatory rules and conditions</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RulesClient />
      </Suspense>
    </div>
  )
}
