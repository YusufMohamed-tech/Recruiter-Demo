'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Job = {
  id: string; slug: string; title_en: string; title_ar?: string
  department?: { name_en: string }; city?: string
}

type Step = 'personal' | 'professional' | 'privacy' | 'submitted'

const STEPS: { key: Step; label: string }[] = [
  { key: 'personal',     label: 'Personal Info'   },
  { key: 'professional', label: 'Professional'    },
  { key: 'privacy',      label: 'Privacy & Submit'},
]

const EL_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'high_school', label: 'High School' },
  { value: 'diploma',     label: 'Diploma'     },
  { value: 'bachelor',    label: "Bachelor's"  },
  { value: 'master',      label: "Master's"    },
  { value: 'phd',         label: 'PhD'         },
]

const CITIES = ['Riyadh','Jeddah','Dammam','Khobar','Mecca','Medina','Tabuk','Abha','Other']

export function ApplicationForm({ job }: { job: Job }) {
  const [step, setStep] = useState<Step>('personal')

  // Personal
  const [nameEn, setNameEn]     = useState('')
  const [nameAr, setNameAr]     = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [city, setCity]         = useState('')
  const [nationality, setNat]   = useState('')

  // Professional
  const [title, setTitle]       = useState('')
  const [expYears, setExpYears] = useState<number | ''>('')
  const [education, setEdu]     = useState('')
  const [linkedin, setLinkedin] = useState('')

  // Privacy
  const [privacyAccepted, setPrivacy] = useState(false)

  const [error, setError]     = useState('')
  const [submitting, setSub]  = useState(false)

  function validateStep(): boolean {
    setError('')
    if (step === 'personal') {
      if (!nameEn.trim()) { setError('Full name (EN) is required'); return false }
      if (!email.trim() || !email.includes('@')) { setError('Valid email is required'); return false }
    }
    if (step === 'privacy') {
      if (!privacyAccepted) { setError('You must accept the privacy notice to continue'); return false }
    }
    return true
  }

  function next() {
    if (!validateStep()) return
    const idx = STEPS.findIndex(s => s.key === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key)
  }

  function prev() {
    const idx = STEPS.findIndex(s => s.key === step)
    if (idx > 0) setStep(STEPS[idx - 1].key)
  }

  async function submit() {
    if (!validateStep()) return
    setSub(true); setError('')

    const res = await fetch('/api/v1/public/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_posting_id:         job.id,
        name_en:                nameEn,
        name_ar:                nameAr || undefined,
        email,
        phone:                  phone || undefined,
        current_city:           city || undefined,
        nationality:            nationality || undefined,
        current_title:          title || undefined,
        total_experience_years: expYears !== '' ? Number(expYears) : undefined,
        education_level:        education || undefined,
        linkedin_url:           linkedin || undefined,
        privacy_accepted:       true,
      }),
    })

    setSub(false)
    if (res.ok) {
      setStep('submitted')
    } else {
      const d = await res.json()
      setError(d?.error ?? 'Submission failed. Please try again.')
    }
  }

  const currentIdx = STEPS.findIndex(s => s.key === step)

  if (step === 'submitted') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20 mb-6">
          <CheckCircle2 className="h-8 w-8 text-brand-dark" />
        </div>
        <h1 className="font-heading text-2xl font-bold">Application Submitted!</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you for applying for <strong>{job.title_en}</strong>. We'll review your application and get back to you shortly.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/careers">Browse more positions</Link>
          </Button>
          <Button asChild>
            <Link href={`/careers/${job.slug}`}>Back to job</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/careers/${job.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to job
        </Link>
        <h1 className="font-heading text-2xl font-bold">Apply for {job.title_en}</h1>
        {job.department && <p className="mt-1 text-sm text-muted-foreground">{job.department.name_en}{job.city ? ` · ${job.city}` : ''}</p>}
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < currentIdx  ? 'bg-brand-green text-brand-dark' :
                i === currentIdx ? 'bg-brand-dark text-white' :
                                   'bg-muted text-muted-foreground'
              }`}>
                {i < currentIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <p className={`ms-2 text-sm font-medium hidden sm:block ${i === currentIdx ? 'text-brand-dark' : 'text-muted-foreground'}`}>
                {s.label}
              </p>
              {i < STEPS.length - 1 && <div className={`mx-3 flex-1 h-0.5 ${i < currentIdx ? 'bg-brand-green' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="rounded-xl border bg-card p-7 space-y-5">
        {step === 'personal' && (
          <>
            <h2 className="font-heading text-lg font-semibold">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name (EN) *"><Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="John Smith" /></Field>
              <Field label="Full Name (AR)"><Input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" className="text-right font-arabic" placeholder="محمد العمر" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email Address *"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
              <Field label="Phone Number"><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current City">
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">— Select —</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Nationality"><Input value={nationality} onChange={e => setNat(e.target.value)} placeholder="Saudi, Egyptian…" /></Field>
            </div>
          </>
        )}

        {step === 'professional' && (
          <>
            <h2 className="font-heading text-lg font-semibold">Professional Background</h2>
            <Field label="Current Job Title"><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior Software Engineer" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Years of Experience">
                <Input type="number" min={0} max={50} value={expYears} onChange={e => setExpYears(e.target.value === '' ? '' : Number(e.target.value))} placeholder="5" />
              </Field>
              <Field label="Education Level">
                <select value={education} onChange={e => setEdu(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {EL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="LinkedIn Profile URL">
              <Input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
            </Field>
          </>
        )}

        {step === 'privacy' && (
          <>
            <h2 className="font-heading text-lg font-semibold">Privacy Notice & Submission</h2>
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2 max-h-48 overflow-y-auto">
              <p className="font-medium text-foreground">Personal Data Processing Notice (PDPL)</p>
              <p>By submitting this application, you consent to Chessboard Group collecting and processing your personal data for recruitment purposes in accordance with Saudi Arabia's Personal Data Protection Law (PDPL).</p>
              <p>Your data will be retained for up to 12 months after the recruitment process concludes. You have the right to access, correct, or request deletion of your data at any time by contacting <strong>privacy@chessboard-group.com</strong>.</p>
              <p>Your data will not be shared with third parties outside the recruitment process without your explicit consent.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacy(e.target.checked)} className="mt-0.5 rounded" />
              <span className="text-sm">I have read and accept the privacy notice, and consent to the processing of my personal data for recruitment purposes. *</span>
            </label>

            {/* Summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="font-medium mb-2">Review your details:</p>
              <SummaryRow label="Name" value={nameEn} />
              <SummaryRow label="Email" value={email} />
              {phone && <SummaryRow label="Phone" value={phone} />}
              {city && <SummaryRow label="City" value={city} />}
              {title && <SummaryRow label="Current Role" value={title} />}
              {expYears !== '' && <SummaryRow label="Experience" value={`${expYears} years`} />}
              {education && <SummaryRow label="Education" value={education} />}
            </div>
          </>
        )}

        {error && <p className="text-sm text-status-error">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {currentIdx > 0 ? (
          <Button variant="outline" onClick={prev}><ChevronLeft className="me-1 h-4 w-4" />Back</Button>
        ) : (
          <div />
        )}
        {step !== 'privacy' ? (
          <Button onClick={next}>Next <ChevronRight className="ms-1 h-4 w-4" /></Button>
        ) : (
          <Button onClick={submit} disabled={submitting || !privacyAccepted}>
            {submitting ? <><Loader2 className="me-1.5 h-4 w-4 animate-spin" />Submitting…</> : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
