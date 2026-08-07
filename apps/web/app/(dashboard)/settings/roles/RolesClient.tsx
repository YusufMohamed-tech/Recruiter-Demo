'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Permission = string
type Role = {
  id: string
  name: string
  description?: string
  is_system: boolean
  role_permissions: Array<{ permission: string }>
}

const PERMISSION_GROUPS: Array<{ group: string; permissions: Array<{ key: string; label: string }> }> = [
  {
    group: 'Organization',
    permissions: [
      { key: 'org.manage',  label: 'Manage organization settings' },
      { key: 'user.manage', label: 'Create, edit & deactivate users' },
      { key: 'role.manage', label: 'Manage roles & permissions' },
    ],
  },
  {
    group: 'Recruitment',
    permissions: [
      { key: 'requisition.manage', label: 'Manage requisitions' },
      { key: 'job.manage',         label: 'Manage job postings' },
      { key: 'candidate.manage',   label: 'View & manage candidates' },
      { key: 'candidate.view_sensitive', label: 'View sensitive candidate data (ID, Iqama)' },
      { key: 'application.manage', label: 'Manage applications & pipeline' },
      { key: 'offer.manage',       label: 'Create & manage offers' },
    ],
  },
  {
    group: 'Compliance & Readiness',
    permissions: [
      { key: 'compliance.manage', label: 'Manage compliance rules & overrides' },
      { key: 'readiness.manage',  label: 'Manage employment readiness cases' },
    ],
  },
  {
    group: 'Reports & Audit',
    permissions: [
      { key: 'analytics.view', label: 'View analytics & reports' },
      { key: 'audit.view',     label: 'View audit log' },
    ],
  },
]

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key))

function toSet(role: Role): Set<string> {
  return new Set(role.role_permissions.map(p => p.permission))
}

const EMPTY_FORM = { name: '', description: '', permissions: new Set<string>() }

export function RolesClient({ initialRoles }: { initialRoles: Role[] }) {
  const [roles,   setRoles]   = useState<Role[]>(initialRoles)
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form,    setForm]    = useState<{ name: string; description: string; permissions: Set<string> }>(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [selected, setSelected] = useState<Role | null>(roles[0] ?? null)

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', permissions: new Set() })
    setError(null); setOpen(true)
  }
  function openEdit(r: Role) {
    setEditing(r)
    setForm({ name: r.name, description: r.description ?? '', permissions: toSet(r) })
    setError(null); setOpen(true)
  }

  function togglePerm(key: string) {
    setForm(f => {
      const next = new Set(f.permissions)
      next.has(key) ? next.delete(key) : next.add(key)
      return { ...f, permissions: next }
    })
  }

  function toggleAll(keys: string[]) {
    const allOn = keys.every(k => form.permissions.has(k))
    setForm(f => {
      const next = new Set(f.permissions)
      if (allOn) keys.forEach(k => next.delete(k))
      else       keys.forEach(k => next.add(k))
      return { ...f, permissions: next }
    })
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Role name is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        permissions: Array.from(form.permissions),
      }
      const [url, method] = editing
        ? [`/api/v1/roles/${editing.id}`, 'PATCH']
        : ['/api/v1/roles', 'POST']

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message ?? 'Save failed')
      const saved = await res.json()
      const normalized: Role = {
        ...saved,
        role_permissions: payload.permissions.map(p => ({ permission: p })),
      }
      setRoles(prev =>
        editing
          ? prev.map(r => r.id === editing.id ? normalized : r)
          : [...prev, normalized]
      )
      setSelected(normalized)
      setOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(r: Role) {
    if (!confirm(`Delete role "${r.name}"? Users with this role will lose access.`)) return
    const res = await fetch(`/api/v1/roles/${r.id}`, { method: 'DELETE' })
    if (res.ok) {
      const next = roles.filter(x => x.id !== r.id)
      setRoles(next)
      if (selected?.id === r.id) setSelected(next[0] ?? null)
    }
  }

  return (
    <div className="flex gap-6">
      {/* Role list */}
      <div className="w-56 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Roles</p>
          <Button size="sm" variant="outline" onClick={openCreate} className="h-7 px-2 text-xs">
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </div>
        <ul className="space-y-0.5">
          {roles.map(r => (
            <li key={r.id}>
              <button
                onClick={() => setSelected(r)}
                className={cn(
                  'w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors',
                  selected?.id === r.id
                    ? 'bg-brand-green/20 text-brand-dark font-medium'
                    : 'text-brand-neutral hover:bg-brand-light-bg hover:text-brand-dark'
                )}
              >
                <span className="truncate">{r.name.replace(/_/g, ' ')}</span>
                {r.is_system && <Lock className="h-3 w-3 shrink-0 ml-1 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Separator orientation="vertical" className="h-auto" />

      {/* Permission detail */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold capitalize">
                  {selected.name.replace(/_/g, ' ')}
                </h3>
                {selected.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{selected.description}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <Badge variant={selected.is_system ? 'secondary' : 'outline'}>
                    {selected.is_system ? 'System role' : 'Custom role'}
                  </Badge>
                  <Badge variant="secondary">{selected.role_permissions.length} permissions</Badge>
                </div>
              </div>
              {!selected.is_system && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(selected)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-5">
              {PERMISSION_GROUPS.map(({ group, permissions }) => {
                const grantedCount = permissions.filter(p => toSet(selected).has(p.key)).length
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {group} — {grantedCount}/{permissions.length}
                    </p>
                    <div className="space-y-2">
                      {permissions.map(({ key, label }) => {
                        const granted = toSet(selected).has(key)
                        return (
                          <div key={key} className={cn('flex items-center gap-3 rounded-md px-3 py-2', granted ? 'bg-brand-green/10' : 'bg-muted/30')}>
                            <div className={cn('h-2 w-2 rounded-full shrink-0', granted ? 'bg-status-success' : 'bg-muted-foreground/30')} />
                            <span className={cn('text-sm', granted ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a role to view permissions.</p>
        )}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit role' : 'Create custom role'}</DialogTitle>
            {!editing && (
              <DialogDescription>Define a name and select which permissions this role grants.</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role name <span className="text-destructive">*</span></Label>
              <Input
                id="role-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. senior_recruiter"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Permissions</p>
                <Button
                  type="button" size="sm" variant="ghost" className="text-xs h-7"
                  onClick={() => {
                    const allOn = ALL_PERMISSIONS.every(k => form.permissions.has(k))
                    setForm(f => ({ ...f, permissions: allOn ? new Set() : new Set(ALL_PERMISSIONS) }))
                  }}
                >
                  {ALL_PERMISSIONS.every(k => form.permissions.has(k)) ? 'Clear all' : 'Select all'}
                </Button>
              </div>
              <div className="space-y-5">
                {PERMISSION_GROUPS.map(({ group, permissions }) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id={`group-${group}`}
                        checked={permissions.every(p => form.permissions.has(p.key))}
                        onCheckedChange={() => toggleAll(permissions.map(p => p.key))}
                      />
                      <label htmlFor={`group-${group}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer">
                        {group}
                      </label>
                    </div>
                    <div className="space-y-2 pl-6">
                      {permissions.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={key}
                            checked={form.permissions.has(key)}
                            onCheckedChange={() => togglePerm(key)}
                          />
                          <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save role'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
