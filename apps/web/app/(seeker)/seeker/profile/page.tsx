'use client'

import { useEffect, useState } from 'react'
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

export default function SeekerProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('seeker_profiles')
      .update({
        first_name_en: profile.first_name_en,
        last_name_en: profile.last_name_en,
        phone: profile.phone,
        city: profile.city,
        nationality: profile.nationality,
        gender: profile.gender,
        headline: profile.headline,
        bio: profile.bio,
        current_title: profile.current_title,
        current_company: profile.current_company,
        total_experience_years: profile.total_experience_years,
        education_level: profile.education_level,
        education_field: profile.education_field,
        university: profile.university,
        skills: profile.skills,
        desired_job_title: profile.desired_job_title,
        desired_salary_min: profile.desired_salary_min,
        desired_salary_max: profile.desired_salary_max,
        preferred_cities: profile.preferred_cities,
        open_to_relocate: profile.open_to_relocate,
        is_public: profile.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) { setMessage('Error saving: ' + error.message); return }
    setMessage('Profile saved successfully')
    setTimeout(() => setMessage(null), 3000)
  }

  function update(field: string, value: any) {
    setProfile((p: any) => ({ ...p, [field]: value }))
  }

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
  if (!profile) {
    router.push('/seeker/onboarding')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      {/* Basic Info */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input value={profile.first_name_en || ''} onChange={e => update('first_name_en', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input value={profile.last_name_en || ''} onChange={e => update('last_name_en', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={profile.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="+966 5XX XXX XXX" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>City</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={profile.city || ''} onChange={e => update('city', e.target.value)}>
              <option value="">Select city</option>
              {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Nationality</Label>
            <Input value={profile.nationality || ''} onChange={e => update('nationality', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Professional */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Professional Summary</h2>
        <div className="space-y-1.5">
          <Label>Headline</Label>
          <Input value={profile.headline || ''} onChange={e => update('headline', e.target.value)} placeholder="Senior Software Engineer | 5 years" />
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]" value={profile.bio || ''} onChange={e => update('bio', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Current Title</Label>
            <Input value={profile.current_title || ''} onChange={e => update('current_title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Current Company</Label>
            <Input value={profile.current_company || ''} onChange={e => update('current_company', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Total Experience (years)</Label>
          <Input type="number" value={profile.total_experience_years || ''} onChange={e => update('total_experience_years', e.target.value)} />
        </div>
      </section>

      {/* Skills */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Skills</h2>
        <div className="space-y-1.5">
          <Label>Skills (comma separated)</Label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px]" value={(profile.skills || []).join(', ')} onChange={e => update('skills', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} />
        </div>
        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <span key={skill} className="bg-brand-primary/10 text-brand-primary text-xs px-2 py-1 rounded-full">{skill}</span>
            ))}
          </div>
        )}
      </section>

      {/* Preferences */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Job Preferences</h2>
        <div className="space-y-1.5">
          <Label>Desired Job Title</Label>
          <Input value={profile.desired_job_title || ''} onChange={e => update('desired_job_title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Min Salary (SAR/month)</Label>
            <Input type="number" value={profile.desired_salary_min || ''} onChange={e => update('desired_salary_min', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Max Salary (SAR/month)</Label>
            <Input type="number" value={profile.desired_salary_max || ''} onChange={e => update('desired_salary_max', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="relocate" checked={profile.open_to_relocate || false} onChange={e => update('open_to_relocate', e.target.checked)} className="rounded" />
          <Label htmlFor="relocate">Open to relocate</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="public" checked={profile.is_public !== false} onChange={e => update('is_public', e.target.checked)} className="rounded" />
          <Label htmlFor="public">Make profile visible to companies</Label>
        </div>
      </section>
    </div>
  )
}
