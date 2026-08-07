'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Construction', 'Finance', 'Education',
  'Retail', 'Manufacturing', 'Oil & Gas', 'Real Estate', 'Logistics',
  'Government', 'Consulting', 'Telecommunications', 'Hospitality', 'Other',
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

const SAUDI_CITIES = [
  'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
  'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Taif',
  'Buraidah', 'Jubail', 'Yanbu', 'Hail', 'Najran',
  'Jazan', 'Al Ahsa', 'Khamis Mushait', 'NEOM', 'Diriyah',
]

export default function CompanyOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name_en: '',
    company_name_ar: '',
    industry: '',
    company_size: '',
    headquarters: '',
    cr_number: '',
    website: '',
    description_en: '',
    tagline_en: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleComplete() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/v1/company/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/company/dashboard')
  }

  return (
    <div className="min-h-screen bg-brand-light-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold">Set Up Your Company</h1>
          <p className="text-muted-foreground mt-1">Step {step} of 3</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-card border bg-white p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Company Information</h2>
              <div className="space-y-1.5">
                <Label>Company Name (English) *</Label>
                <Input value={form.company_name_en} onChange={e => update('company_name_en', e.target.value)} placeholder="TechVista Solutions" required />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name (Arabic)</Label>
                <Input value={form.company_name_ar} onChange={e => update('company_name_ar', e.target.value)} placeholder="تك فيستا سوليوشنز" dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.industry} onChange={e => update('industry', e.target.value)}>
                    <option value="">Select</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Company Size</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.company_size} onChange={e => update('company_size', e.target.value)}>
                    <option value="">Select</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Headquarters</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.headquarters} onChange={e => update('headquarters', e.target.value)}>
                    <option value="">Select city</option>
                    {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>CR Number</Label>
                  <Input value={form.cr_number} onChange={e => update('cr_number', e.target.value)} placeholder="1010XXXXXX" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Company Profile</h2>
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input value={form.tagline_en} onChange={e => update('tagline_en', e.target.value)} placeholder="Building the future of technology in Saudi Arabia" />
              </div>
              <div className="space-y-1.5">
                <Label>About your company</Label>
                <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]" value={form.description_en} onChange={e => update('description_en', e.target.value)} placeholder="Tell job seekers about your company, culture, and what makes you a great place to work..." />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://yourcompany.com" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Review</h2>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <p><strong>{form.company_name_en}</strong></p>
                {form.tagline_en && <p className="text-sm text-muted-foreground">{form.tagline_en}</p>}
                <div className="flex gap-3 text-sm text-muted-foreground">
                  {form.industry && <span>{form.industry}</span>}
                  {form.company_size && <span>{form.company_size} employees</span>}
                  {form.headquarters && <span>{form.headquarters}</span>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You can post your first job after setup, or do it later from the dashboard.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive mt-4">{error}</p>}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.company_name_en}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Creating…' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
