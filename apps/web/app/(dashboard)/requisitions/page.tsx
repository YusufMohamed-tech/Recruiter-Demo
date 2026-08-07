import { Suspense } from 'react'
import { RequisitionsClient } from './RequisitionsClient'

export default function RequisitionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Requisitions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage hiring requests and approval workflows</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RequisitionsClient />
      </Suspense>
    </div>
  )
}
