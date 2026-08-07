import { Suspense } from 'react'
import { OfferDetail } from './OfferDetail'

export const metadata = { title: 'Offer' }

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <OfferDetail id={(await params).id} />
    </Suspense>
  )
}
