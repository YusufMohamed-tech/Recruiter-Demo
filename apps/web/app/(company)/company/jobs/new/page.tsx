'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const SAUDI_CITIES = [
  'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
  'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Taif',
  'Buraidah', 'Jubail', 'Yanbu', 'Hail', 'Najran',
  'Jazan', 'Al Ahsa', 'Khamis Mushait', 'NEOM', 'Diriyah',
]

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
]

export default function NewJobPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title_en: '',
    title_ar: '',
    city: '',
    employment_type: 'full_time',
    min_experience_years: '',
    education_level: '',
    salary_visible: false,
    salary_min: '',
    salary_max: '',
    description_en: '',
    requirements_en: '',
  })

  const [questions, setQuestions] = useState<{ label: string; type: string; required: boolean }[]>([])

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addQuestion() {
    setQuestions(prev => [...prev, { label: '', type: 'text', required: false }])
  }

  function updateQuestion(index: number, field: string, value: any) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  function removeQuestion(index: number) {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(publish: boolean) {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (!userRow) return

    const slug = form.title_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .insert({
        org_id: userRow.org_id,
        title_en: form.title_en,
        title_ar: form.title_ar || null,
        slug,
        city: form.city || null,
        employment_type: form.employment_type,
        min_experience_years: form.min_experience_years ? parseInt(form.min_experience_years) : null,
        education_level: form.education_level || null,
        salary_visible: form.salary_visible,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        description_en: form.description_en,
        requirements_en: form.requirements_en || null,
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (jobError) { setError(jobError.message); setLoading(false); return }

    if (questions.length > 0 && job) {
      await supabase.from('application_form_versions').insert({
        org_id: userRow.org_id,
        job_posting_id: job.id,
        version: 1,
        schema_json: { fields: questions.filter(q => q.label.trim()) },
        is_active: true,
        created_by: user.id,
      })
    }

    router.push('/company/jobs')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Post a New Job</h1>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Job Details</h2>
        <div className="space-y-1.5">
          <Label>Job Title (English) *</Label>
          <Input value={form.title_en} onChange={e => update('title_en', e.target.value)} placeholder="Senior Software Engineer" required />
        </div>
        <div className="space-y-1.5">
          <Label>Job Title (Arabic)</Label>
          <Input value={form.title_ar} onChange={e => update('title_ar', e.target.value)} placeholder="مهندس برمجيات أول" dir="rtl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>City</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.city} onChange={e => update('city', e.target.value)}>
              <option value="">Select city</option>
              {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Employment Type</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.employment_type} onChange={e => update('employment_type', e.target.value)}>
              {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Min Experience (years)</Label>
            <Input type="number" min="0" value={form.min_experience_years} onChange={e => update('min_experience_years', e.target.value)} placeholder="3" />
          </div>
          <div className="space-y-1.5">
            <Label>Education Level</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.education_level} onChange={e => update('education_level', e.target.value)}>
              <option value="">Any</option>
              <option value="high_school">High School</option>
              <option value="diploma">Diploma</option>
              <option value="bachelors">Bachelor&apos;s</option>
              <option value="masters">Master&apos;s</option>
              <option value="phd">PhD</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="salary_visible" checked={form.salary_visible} onChange={e => update('salary_visible', e.target.checked)} className="rounded" />
            <Label htmlFor="salary_visible">Show salary range to applicants</Label>
          </div>
          {form.salary_visible && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min Salary (SAR/month)</Label>
                <Input type="number" value={form.salary_min} onChange={e => update('salary_min', e.target.value)} placeholder="10000" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Salary (SAR/month)</Label>
                <Input type="number" value={form.salary_max} onChange={e => update('salary_max', e.target.value)} placeholder="20000" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Job Description *</Label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[150px]" value={form.description_en} onChange={e => update('description_en', e.target.value)} placeholder="Describe the role, responsibilities, and what the candidate will work on..." />
        </div>
        <div className="space-y-1.5">
          <Label>Requirements</Label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]" value={form.requirements_en} onChange={e => update('requirements_en', e.target.value)} placeholder="List the skills, experience, and qualifications required..." />
        </div>
      </div>

      {/* Screening Questions */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Screening Questions</h2>
          <Button variant="outline" size="sm" onClick={addQuestion}>Add Question</Button>
        </div>
        <p className="text-sm text-muted-foreground">Add custom questions applicants must answer</p>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2 items-start border rounded-md p-3">
            <div className="flex-1 space-y-2">
              <Input value={q.label} onChange={e => updateQuestion(i, 'label', e.target.value)} placeholder="Your question..." />
              <div className="flex items-center gap-3">
                <select className="border rounded-md px-2 py-1 text-xs" value={q.type} onChange={e => updateQuestion(i, 'type', e.target.value)}>
                  <option value="text">Short text</option>
                  <option value="textarea">Long text</option>
                  <option value="number">Number</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={q.required} onChange={e => updateQuestion(i, 'required', e.target.checked)} className="rounded" />
                  Required
                </label>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeQuestion(i)}>×</Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading || !form.title_en}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={loading || !form.title_en || !form.description_en}>
          {loading ? 'Publishing…' : 'Publish Job'}
        </Button>
      </div>
    </div>
  )
}
