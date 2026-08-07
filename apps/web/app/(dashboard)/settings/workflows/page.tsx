import { Suspense } from 'react'
import { WorkflowsClient } from './WorkflowsClient'

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <WorkflowsClient />
    </Suspense>
  )
}
