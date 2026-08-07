'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BilingualInput } from '@/components/forms/BilingualInput'
import { CheckCircle2 } from 'lucide-react'

interface OrgSettingsFormProps {
  org: any
}

export function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const [form, setForm] = useState({
    legal_name_en:     org?.legal_name_en ?? '',
    legal_name_ar:     org?.legal_name_ar ?? '',
    cr_number:         org?.cr_number ?? '',
    vat_number:        org?.vat_number ?? '',
    headquarters_city: org?.headquarters_city ?? '',
    address_en:        org?.address_en ?? '',
    address_ar:        org?.address_ar ?? '',
    phone:             org?.phone ?? '',
    email:             org?.email ?? '',
    website:           org?.website ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function set(field: string) {
    return (value: string) => setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false); setError(null)
    try {
      const res = await fetch('/api/v1/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message ?? 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <BilingualInput
        labelEn="Legal Name" labelAr="الاسم القانوني"
        idEn="legal_name_en" idAr="legal_name_ar"
        valueEn={form.legal_name_en} valueAr={form.legal_name_ar}
        onChangeEn={set('legal_name_en')} onChangeAr={set('legal_name_ar')}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cr_number">CR Number</Label>
          <Input id="cr_number" value={form.cr_number} onChange={e => set('cr_number')(e.target.value)} placeholder="1010XXXXXX" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vat_number">VAT Number</Label>
          <Input id="vat_number" value={form.vat_number} onChange={e => set('vat_number')(e.target.value)} placeholder="3XXXXXXXXXXXXXXXXXXX3" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="headquarters_city">HQ City</Label>
          <Input id="headquarters_city" value={form.headquarters_city} onChange={e => set('headquarters_city')(e.target.value)} placeholder="Riyadh" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="+966 11 XXX XXXX" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Contact Email</Label>
          <Input id="email" type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="info@company.com" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={form.website} onChange={e => set('website')(e.target.value)} placeholder="https://company.com" dir="ltr" />
        </div>
      </div>

      <BilingualInput
        labelEn="Address" labelAr="العنوان"
        idEn="address_en" idAr="address_ar"
        valueEn={form.address_en} valueAr={form.address_ar}
        onChangeEn={set('address_en')} onChangeAr={set('address_ar')}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Organization profile saved.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
