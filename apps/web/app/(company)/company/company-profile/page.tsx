'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function CompanyProfileEditPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRow) { setLoading(false); return }

      const { data } = await supabase.from('company_profiles').select('*').eq('org_id', userRow.org_id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('company_profiles')
      .update({
        display_name_en: profile.display_name_en,
        display_name_ar: profile.display_name_ar,
        tagline_en: profile.tagline_en,
        description_en: profile.description_en,
        industry: profile.industry,
        company_size: profile.company_size,
        headquarters: profile.headquarters,
        website: profile.website,
        linkedin_url: profile.linkedin_url,
        benefits: profile.benefits,
        culture_values: profile.culture_values,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) { setMessage('Error: ' + error.message); return }
    setMessage('Profile saved')
    setTimeout(() => setMessage(null), 3000)
  }

  function update(field: string, value: any) {
    setProfile((p: any) => ({ ...p, [field]: value }))
  }

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
  if (!profile) return <p>No company profile found</p>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Company Profile</h1>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>

      {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>}

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company Name (EN)</Label>
            <Input value={profile.display_name_en || ''} onChange={e => update('display_name_en', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Company Name (AR)</Label>
            <Input value={profile.display_name_ar || ''} onChange={e => update('display_name_ar', e.target.value)} dir="rtl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input value={profile.tagline_en || ''} onChange={e => update('tagline_en', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>About</Label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]" value={profile.description_en || ''} onChange={e => update('description_en', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Input value={profile.industry || ''} onChange={e => update('industry', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Company Size</Label>
            <Input value={profile.company_size || ''} onChange={e => update('company_size', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input value={profile.website || ''} onChange={e => update('website', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Input value={profile.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Benefits (comma separated)</Label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px]" value={(profile.benefits || []).join(', ')} onChange={e => update('benefits', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Health insurance, Annual bonus, Remote work..." />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Public profile URL: <code className="bg-gray-100 px-1 rounded">/company/{profile.slug}</code>
      </p>
    </div>
  )
}
