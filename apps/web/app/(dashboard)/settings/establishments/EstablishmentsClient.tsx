'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type Establishment = {
  id: string
  name_ar: string
  name_en?: string
  city?: string
  activity_code?: string
  mol_status?: string
  nitaqat_band?: string
  saudization_pct?: number
}

const EMPTY: Omit<Establishment, 'id'> = {
  name_ar: '', name_en: '', city: '', activity_code: '',
  mol_status: 'active', nitaqat_band: '', saudization_pct: undefined,
}

const NITAQAT_BANDS = ['platinum', 'high_green', 'medium_green', 'low_green', 'yellow', 'red']

const bandVariant: Record<string, any> = {
  platinum: 'info', high_green: 'success', medium_green: 'success',
  low_green: 'success', yellow: 'warning', red: 'error',
}

export function EstablishmentsClient({ initialData }: { initialData: Establishment[] }) {
  const [items, setItems] = useState<Establishment[]>(initialData)
  const [open, setOpen]   = useState(false)
  const [editing, setEditing] = useState<Establishment | null>(null)
  const [form, setForm]   = useState<Omit<Establishment, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function openCreate() { setEditing(null); setForm(EMPTY); setError(null); setOpen(true) }
  function openEdit(e: Establishment) {
    setEditing(e)
    setForm({ name_ar: e.name_ar, name_en: e.name_en ?? '', city: e.city ?? '',
              activity_code: e.activity_code ?? '', mol_status: e.mol_status ?? 'active',
              nitaqat_band: e.nitaqat_band ?? '', saudization_pct: e.saudization_pct })
    setError(null); setOpen(true)
  }

  function set(field: string) {
    return (value: string | number | undefined) =>
      setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name_ar.trim()) { setError('Arabic name is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = { ...form, saudization_pct: form.saudization_pct ?? null }
      const [url, method] = editing
        ? [`/api/v1/establishments/${editing.id}`, 'PATCH']
        : ['/api/v1/establishments', 'POST']

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message ?? 'Save failed')
      const saved = await res.json()

      setItems(prev =>
        editing
          ? prev.map(i => i.id === editing.id ? saved : i)
          : [...prev, saved]
      )
      setOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this establishment?')) return
    const res = await fetch(`/api/v1/establishments/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add establishment
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No establishments added yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Nitaqat</TableHead>
              <TableHead>Saudization %</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(est => (
              <TableRow key={est.id}>
                <TableCell>
                  <p className="font-medium">{est.name_en || est.name_ar}</p>
                  <p className="text-xs text-muted-foreground font-arabic" dir="rtl">{est.name_ar}</p>
                </TableCell>
                <TableCell>{est.city ?? '—'}</TableCell>
                <TableCell>{est.activity_code ?? '—'}</TableCell>
                <TableCell>
                  {est.nitaqat_band
                    ? <Badge variant={bandVariant[est.nitaqat_band] ?? 'secondary'}>
                        {est.nitaqat_band.replace('_', ' ')}
                      </Badge>
                    : '—'}
                </TableCell>
                <TableCell>
                  {est.saudization_pct != null ? `${est.saudization_pct}%` : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(est)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(est.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Establishment' : 'Add Establishment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="est-name-en">Name (English)</Label>
                <Input id="est-name-en" value={form.name_en} onChange={e => set('name_en')(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="est-name-ar">Name (Arabic) <span className="text-destructive">*</span></Label>
                <Input id="est-name-ar" value={form.name_ar} onChange={e => set('name_ar')(e.target.value)} dir="rtl" className="text-right font-arabic" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="est-city">City</Label>
                <Input id="est-city" value={form.city} onChange={e => set('city')(e.target.value)} placeholder="Riyadh" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="est-activity">Activity Code</Label>
                <Input id="est-activity" value={form.activity_code} onChange={e => set('activity_code')(e.target.value)} placeholder="7810" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nitaqat Band</Label>
                <Select value={form.nitaqat_band} onValueChange={set('nitaqat_band')}>
                  <SelectTrigger><SelectValue placeholder="Select band" /></SelectTrigger>
                  <SelectContent>
                    {NITAQAT_BANDS.map(b => (
                      <SelectItem key={b} value={b}>{b.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="est-saudization">Saudization %</Label>
                <Input
                  id="est-saudization" type="number" min="0" max="100" step="0.1"
                  value={form.saudization_pct ?? ''}
                  onChange={e => set('saudization_pct')(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0–100"
                />
              </div>
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
