'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Mail, Briefcase, GraduationCap, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ApplicationDetailPage() {
  const { id } = useParams() as { id: string }
  const supabase = createClient()
  const [app, setApp] = useState<any>(null)
  const [seeker, setSeeker] = useState<any>(null)
  const [experiences, setExperiences] = useState<any[]>([])
  const [education, setEducation] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: application } = await supabase
        .from('seeker_applications')
        .select('*, job_postings(title_en)')
        .eq('id', id)
        .single()

      if (!application) { setLoading(false); return }
      setApp(application)

      const { data: profile } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('id', application.seeker_id)
        .single()

      setSeeker(profile)

      if (profile) {
        const { data: exp } = await supabase
          .from('seeker_experiences')
          .select('*')
          .eq('seeker_id', profile.id)
          .order('start_date', { ascending: false })

        const { data: edu } = await supabase
          .from('seeker_education')
          .select('*')
          .eq('seeker_id', profile.id)
          .order('end_year', { ascending: false })

        setExperiences(exp || [])
        setEducation(edu || [])
      }

      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(newStatus: string) {
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'under_review') updates.reviewed_at = new Date().toISOString()
    if (newStatus === 'shortlisted') updates.shortlisted_at = new Date().toISOString()
    if (newStatus === 'rejected') updates.rejected_at = new Date().toISOString()

    await supabase.from('seeker_applications').update(updates).eq('id', id)
    setApp((a: any) => ({ ...a, status: newStatus }))
  }

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
  if (!app || !seeker) return <p>Application not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/company/applications" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to applications
      </Link>

      {/* Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{seeker.first_name_en} {seeker.last_name_en}</h1>
            {seeker.headline && <p className="text-muted-foreground">{seeker.headline}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {seeker.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{seeker.city}</span>}
              {seeker.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{seeker.phone_country_code}{seeker.phone}</span>}
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{seeker.email}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Applied for: <strong>{app.job_postings?.title_en}</strong> on {new Date(app.submitted_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {app.ai_match_score && (
              <div className="text-center bg-brand-primary/10 rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">AI Match</p>
                <p className="text-lg font-bold text-brand-primary">{Math.round(app.ai_match_score)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {app.status === 'submitted' && (
            <>
              <Button size="sm" onClick={() => updateStatus('under_review')}>Start Review</Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus('rejected')}>Reject</Button>
            </>
          )}
          {app.status === 'under_review' && (
            <>
              <Button size="sm" onClick={() => updateStatus('shortlisted')}>Shortlist</Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus('rejected')}>Reject</Button>
            </>
          )}
          {app.status === 'shortlisted' && (
            <>
              <Button size="sm" onClick={() => updateStatus('interview')}>Schedule Interview</Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus('rejected')}>Reject</Button>
            </>
          )}
          {app.status === 'interview' && (
            <Button size="sm" onClick={() => updateStatus('offered')}>Send Offer</Button>
          )}
          {app.status === 'offered' && (
            <Button size="sm" onClick={() => updateStatus('hired')}>Mark as Hired</Button>
          )}
          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* Application Answers */}
      {app.form_responses && Object.keys(app.form_responses).length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-3">Screening Answers</h2>
          <div className="space-y-3">
            {Object.entries(app.form_responses).map(([q, a]) => (
              <div key={q}>
                <p className="text-sm font-medium">{q}</p>
                <p className="text-sm text-muted-foreground">{a as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Summary */}
      {seeker.bio && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-3">Professional Summary</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{seeker.bio}</p>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" />Experience</h2>
          <div className="space-y-4">
            {experiences.map(exp => (
              <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                <p className="font-medium text-sm">{exp.title}</p>
                <p className="text-sm text-muted-foreground">{exp.company_name}{exp.city && ` • ${exp.city}`}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(exp.start_date).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                  {' – '}
                  {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : ''}
                </p>
                {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" />Education</h2>
          <div className="space-y-3">
            {education.map(edu => (
              <div key={edu.id}>
                <p className="font-medium text-sm">{edu.degree} in {edu.field_of_study}</p>
                <p className="text-sm text-muted-foreground">{edu.institution}</p>
                {edu.end_year && <p className="text-xs text-muted-foreground">{edu.end_year}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {seeker.skills?.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {seeker.skills.map((skill: string) => (
              <span key={skill} className="bg-gray-100 text-sm px-3 py-1 rounded-full">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* CV Download */}
      {seeker.cv_file_url && (
        <div className="bg-white border rounded-lg p-6">
          <a href={seeker.cv_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
            <Download className="h-4 w-4" />Download CV
          </a>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-green-100 text-green-700',
    interview: 'bg-purple-100 text-purple-700',
    offered: 'bg-amber-100 text-amber-700',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
