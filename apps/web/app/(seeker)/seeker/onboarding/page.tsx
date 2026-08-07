'use client'

import { useState, useEffect } from 'react'
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

const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
]

export default function SeekerOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChecking(false); return }
      const { data: existing } = await supabase
        .from('seeker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (existing) {
        router.push('/seeker/dashboard')
        return
      }
      setChecking(false)
    }
    checkExisting()
  }, [])

  const [form, setForm] = useState({
    first_name_en: '',
    last_name_en: '',
    phone: '',
    city: '',
    nationality: '',
    gender: '',
    current_title: '',
    total_experience_years: '',
    education_level: '',
    education_field: '',
    university: '',
    skills: '',
    headline: '',
    bio: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleComplete() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean)

    const { error: insertError } = await supabase.from('seeker_profiles').upsert({
      user_id: user.id,
      first_name_en: form.first_name_en,
      last_name_en: form.last_name_en,
      email: user.email!,
      phone: form.phone || null,
      phone_country_code: '+966',
      city: form.city || null,
      nationality: form.nationality || null,
      gender: form.gender || null,
      current_title: form.current_title || null,
      total_experience_years: form.total_experience_years ? parseFloat(form.total_experience_years) : null,
      education_level: form.education_level || null,
      education_field: form.education_field || null,
      university: form.university || null,
      skills: skillsArray,
      headline: form.headline || null,
      bio: form.bio || null,
      profile_completed: true,
      profile_completion_pct: 80,
    }, { onConflict: 'user_id' })

    if (insertError) {
      if (insertError.code === '23505') {
        router.push('/seeker/dashboard')
        return
      }
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/seeker/dashboard')
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse h-8 w-32 bg-gray-200 rounded" /></div>
  }

  return (
    <div className="min-h-screen bg-brand-light-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Step {step} of 4</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-card border bg-white p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input value={form.first_name_en} onChange={e => update('first_name_en', e.target.value)} placeholder="Ahmed" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input value={form.last_name_en} onChange={e => update('last_name_en', e.target.value)} placeholder="Al-Dosari" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 border rounded-md bg-gray-50 text-sm">+966</span>
                  <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="5XX XXX XXX" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.city} onChange={e => update('city', e.target.value)}>
                  <option value="">Select city</option>
                  {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={e => update('nationality', e.target.value)} placeholder="Saudi" />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.gender} onChange={e => update('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Professional Details</h2>
              <div className="space-y-1.5">
                <Label>Current Job Title</Label>
                <Input value={form.current_title} onChange={e => update('current_title', e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-1.5">
                <Label>Total Years of Experience</Label>
                <Input type="number" min="0" max="40" step="0.5" value={form.total_experience_years} onChange={e => update('total_experience_years', e.target.value)} placeholder="5" />
              </div>
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Input value={form.headline} onChange={e => update('headline', e.target.value)} placeholder="Senior Software Engineer | 5 years experience" />
              </div>
              <div className="space-y-1.5">
                <Label>Professional Summary</Label>
                <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]" value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Brief summary of your professional background..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Education</h2>
              <div className="space-y-1.5">
                <Label>Education Level</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.education_level} onChange={e => update('education_level', e.target.value)}>
                  <option value="">Select level</option>
                  {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Field of Study</Label>
                <Input value={form.education_field} onChange={e => update('education_field', e.target.value)} placeholder="Computer Science" />
              </div>
              <div className="space-y-1.5">
                <Label>University / Institution</Label>
                <Input value={form.university} onChange={e => update('university', e.target.value)} placeholder="King Saud University" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Skills</h2>
              <div className="space-y-1.5">
                <Label>Skills (comma separated)</Label>
                <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]" value={form.skills} onChange={e => update('skills', e.target.value)} placeholder="React, TypeScript, Node.js, PostgreSQL, Project Management" />
                <p className="text-xs text-muted-foreground">Separate each skill with a comma</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-sm mb-2">Profile Preview</h3>
                <p className="text-sm"><strong>{form.first_name_en} {form.last_name_en}</strong></p>
                {form.headline && <p className="text-sm text-muted-foreground">{form.headline}</p>}
                {form.city && <p className="text-xs text-muted-foreground">{form.city}, Saudi Arabia</p>}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive mt-4">{error}</p>}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}
            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!form.first_name_en || !form.last_name_en)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Saving…' : 'Complete Profile'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can always update your profile later
        </p>
      </div>
    </div>
  )
}
