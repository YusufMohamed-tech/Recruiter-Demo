import { Suspense } from 'react'
import { FormBuilderClient } from './FormBuilderClient'

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Application Form Builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add custom questions to the application form for this job posting.</p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
        <FormBuilderClient jobId={id} />
      </Suspense>
    </div>
  )
}
