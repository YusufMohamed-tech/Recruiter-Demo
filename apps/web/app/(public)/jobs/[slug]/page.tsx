'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Building2, Calendar, DollarSign, GraduationCap, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function JobDetailPage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const supabase = createClient()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [formResponses, setFormResponses] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: jobData } = await supabase
        .from('job_postings')
        .select(`
          *,
          organizations(id, legal_name_en, logo_url),
          application_form_versions(schema_json)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      setJob(jobData)

      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser && jobData) {
        const { data: profile } = await supabase.from('seeker_profiles').select('id').eq('user_id', currentUser.id).single()
        if (profile) {
          const { data: existingApp } = await supabase
            .from('seeker_applications')
            .select('id')
            .eq('seeker_id', profile.id)
            .eq('job_posting_id', jobData.id)
            .single()
          if (existingApp) setApplied(true)
        }
      }

      setLoading(false)
    }
    load()
  }, [slug])

  async function handleApply() {
    if (!user) { router.push(`/login?redirect=/jobs/${slug}`); return }
    setShowApplyForm(true)
  }

  async function submitApplication() {
    setApplying(true)
    setError(null)

    const { data: profile } = await supabase
      .from('seeker_profiles')
      .select('id, profile_completed')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      router.push('/seeker/onboarding')
      return
    }

    if (!profile.profile_completed) {
      setError('Please complete your profile before applying.')
      setApplying(false)
      return
    }

    const { error: applyError } = await supabase
      .from('seeker_applications')
      .insert({
        seeker_id: profile.id,
        job_posting_id: job.id,
        org_id: job.org_id,
        form_responses: formResponses,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })

    if (applyError) {
      if (applyError.code === '23505') setError('You have already applied to this job.')
      else setError(applyError.message)
      setApplying(false)
      return
    }

    setApplied(true)
    setShowApplyForm(false)
    setApplying(false)
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-96 bg-gray-200 rounded-lg animate-pulse" /></div>
  if (!job) return <div className="max-w-4xl mx-auto px-4 py-8 text-center"><p>Job not found</p></div>

  const formSchema = job.application_form_versions?.[0]?.schema_json
  const questions = formSchema?.fields || []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500">
            {job.organizations?.legal_name_en?.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{job.title_en}</h1>
            <Link href={`/company/${job.organizations?.id}`} className="text-sm text-primary hover:underline">
              {job.organizations?.legal_name_en}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {job.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.city}</span>}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{job.employment_type?.replace('_', ' ')}</span>
              {job.min_experience_years && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.min_experience_years}+ years</span>}
              {job.education_level && <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{job.education_level.replace('_', ' ')}</span>}
              {job.salary_visible && job.salary_min && (
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{Number(job.salary_min).toLocaleString()} - {Number(job.salary_max).toLocaleString()} SAR/month</span>
              )}
            </div>
          </div>
          <div>
            {applied ? (
              <Button disabled className="bg-green-600">Applied</Button>
            ) : (
              <Button onClick={handleApply} size="lg">Apply Now</Button>
            )}
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-1">Apply to {job.title_en}</h2>
            <p className="text-sm text-muted-foreground mb-4">at {job.organizations?.legal_name_en}</p>

            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 text-sm text-green-700">
              Your profile will be shared with this company.
            </div>

            {questions.length > 0 && (
              <div className="space-y-4 mb-6">
                <p className="text-sm font-medium">Screening Questions:</p>
                {questions.map((q: any, i: number) => (
                  <div key={i} className="space-y-1.5">
                    <Label>{q.label}{q.required && ' *'}</Label>
                    {q.type === 'textarea' ? (
                      <textarea
                        className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                        required={q.required}
                        value={formResponses[q.label] || ''}
                        onChange={e => setFormResponses(prev => ({ ...prev, [q.label]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        type={q.type || 'text'}
                        required={q.required}
                        value={formResponses[q.label] || ''}
                        onChange={e => setFormResponses(prev => ({ ...prev, [q.label]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowApplyForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={submitApplication} disabled={applying} className="flex-1">
                {applying ? 'Submitting…' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {job.description_en && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-3">Job Description</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{job.description_en}</div>
            </div>
          )}
          {job.requirements_en && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-3">Requirements</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{job.requirements_en}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-5">
            <h3 className="font-semibold mb-3">Job Details</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{job.employment_type?.replace('_', ' ')}</dd></div>
              {job.city && <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{job.city}</dd></div>}
              {job.min_experience_years && <div><dt className="text-muted-foreground">Experience</dt><dd className="font-medium">{job.min_experience_years}+ years</dd></div>}
              {job.education_level && <div><dt className="text-muted-foreground">Education</dt><dd className="font-medium capitalize">{job.education_level.replace('_', ' ')}</dd></div>}
              {job.deadline && <div><dt className="text-muted-foreground">Deadline</dt><dd className="font-medium">{new Date(job.deadline).toLocaleDateString()}</dd></div>}
            </dl>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <h3 className="font-semibold mb-3">About the Company</h3>
            <p className="text-sm text-muted-foreground">{job.organizations?.legal_name_en}</p>
            <Link href={`/company/${job.organizations?.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">
              View company profile
            </Link>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Posted {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
