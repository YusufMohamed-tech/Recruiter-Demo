import { Suspense } from 'react'
import { OffersClient } from './OffersClient'

export const metadata = { title: 'Offers' }

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Offers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build, send, and track offer letters.</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <OffersClient />
      </Suspense>
    </div>
  )
}
