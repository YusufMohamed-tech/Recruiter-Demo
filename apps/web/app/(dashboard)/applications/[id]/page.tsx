import { Suspense } from 'react'
import { ApplicationWorkspace } from './ApplicationWorkspace'

export const metadata = { title: 'Application' }

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <ApplicationWorkspace id={(await params).id} />
    </Suspense>
  )
}
