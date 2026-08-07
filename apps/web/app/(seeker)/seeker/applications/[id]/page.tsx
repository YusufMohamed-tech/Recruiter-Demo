'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const STAGES = ['submitted', 'under_review', 'shortlisted', 'interview', 'offered', 'hired']

export default function ApplicationDetailPage() {
  const { id } = useParams() as { id: string }
  const supabase = createClient()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('seeker_applications')
        .select(`
          *,
          job_postings(title_en, slug, city, employment_type, description_en,
            organizations(legal_name_en, logo_url)
          )
        `)
        .eq('id', id)
        .single()

      setApplication(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleWithdraw() {
    if (!confirm('Are you sure you want to withdraw this application?')) return
    await supabase
      .from('seeker_applications')
      .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
      .eq('id', id)
    setApplication((a: any) => ({ ...a, status: 'withdrawn' }))
  }

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
  if (!application) return <p>Application not found</p>

  const currentStageIndex = STAGES.indexOf(application.status)
  const isTerminal = ['rejected', 'withdrawn', 'hired'].includes(application.status)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/seeker/applications" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to applications
      </Link>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{application.job_postings?.title_en}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {application.job_postings?.organizations?.legal_name_en}
              </span>
              {application.job_postings?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {application.job_postings.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Applied {new Date(application.submitted_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {!isTerminal && application.status === 'submitted' && (
            <Button variant="outline" size="sm" onClick={handleWithdraw}>
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Application Status</h2>

        {isTerminal && application.status !== 'hired' ? (
          <div className={`p-3 rounded-md text-sm ${application.status === 'rejected' ? 'bg-gray-50 text-gray-600' : 'bg-gray-50 text-gray-500'}`}>
            {application.status === 'rejected' ? 'This application was not selected to move forward.' : 'You withdrew this application.'}
          </div>
        ) : (
          <div className="space-y-3">
            {STAGES.map((stage, i) => {
              const isComplete = i <= currentStageIndex
              const isCurrent = i === currentStageIndex
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${isComplete ? 'bg-brand-primary' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-brand-primary/30' : ''}`} />
                  <span className={`text-sm capitalize ${isComplete ? 'font-medium' : 'text-muted-foreground'}`}>
                    {stage.replace('_', ' ')}
                  </span>
                  {isCurrent && <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">Current</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Responses */}
      {application.form_responses && Object.keys(application.form_responses).length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Your Answers</h2>
          <div className="space-y-3">
            {Object.entries(application.form_responses).map(([question, answer]) => (
              <div key={question}>
                <p className="text-sm font-medium">{question}</p>
                <p className="text-sm text-muted-foreground">{answer as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
