import { Suspense } from 'react'
import { RequisitionDetail } from './RequisitionDetail'

export default async function RequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <RequisitionDetail id={(await params).id} />
    </Suspense>
  )
}
