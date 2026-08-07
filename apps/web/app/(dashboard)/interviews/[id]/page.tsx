import { Suspense } from 'react'
import { InterviewDetail } from './InterviewDetail'

export const metadata = { title: 'Interview' }

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <InterviewDetail id={(await params).id} />
    </Suspense>
  )
}
