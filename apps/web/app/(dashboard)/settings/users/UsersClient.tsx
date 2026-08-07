'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, MoreHorizontal, KeyRound, UserX, UserCheck } from 'lucide-react'

type User = {
  id: string
  email: string
  name_en: string
  name_ar?: string
  is_active: boolean
  created_at: string
  user_roles: Array<{ role: { id: string; name: string } | null }>
}

type Role = { id: string; name: string }

const EMPTY_CREATE = { email: '', password: '', name_en: '', name_ar: '', role_id: '' }
const EMPTY_RESET  = { new_password: '', confirm: '' }

export function UsersClient({
  initialUsers, roles, currentUserId,
}: { initialUsers: User[]; roles: Role[]; currentUserId: string }) {
  const [users,       setUsers]       = useState<User[]>(initialUsers)
  const [createOpen,  setCreateOpen]  = useState(false)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [createForm,  setCreateForm]  = useState(EMPTY_CREATE)
  const [resetForm,   setResetForm]   = useState(EMPTY_RESET)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  function setC(f: string) { return (v: string) => setCreateForm(p => ({ ...p, [f]: v })) }
  function setR(f: string) { return (v: string) => setResetForm(p => ({ ...p, [f]: v })) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.role_id) { setError('Please select a role'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const created = await res.json()
      const role = roles.find(r => r.id === createForm.role_id)
      setUsers(prev => [{
        ...created,
        is_active: true,
        created_at: new Date().toISOString(),
        user_roles: role ? [{ role }] : [],
      }, ...prev])
      setCreateForm(EMPTY_CREATE)
      setCreateOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (resetForm.new_password !== resetForm.confirm) {
      setError('Passwords do not match'); return
    }
    if (resetForm.new_password.length < 8) {
      setError('Password must be at least 8 characters'); return
    }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/v1/admin/users/${resetTarget!.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetForm.new_password }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setResetForm(EMPTY_RESET)
      setResetTarget(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u: User) {
    const res = await fetch(`/api/v1/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_active: !p.is_active } : p))
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => { setCreateForm(EMPTY_CREATE); setError(null); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Create user
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(u => {
            const roleName = u.user_roles?.[0]?.role?.name ?? '—'
            const initials = u.name_en.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-brand-green text-brand-dark text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{u.name_en}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{roleName.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? 'success' : 'error'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('en-SA')}
                </TableCell>
                <TableCell>
                  {u.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setResetTarget(u); setResetForm(EMPTY_RESET); setError(null) }}>
                          <KeyRound className="mr-2 h-4 w-4" /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={u.is_active ? 'text-destructive focus:text-destructive' : ''}
                          onClick={() => toggleActive(u)}
                        >
                          {u.is_active
                            ? <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                            : <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                          }
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              Set credentials now — users cannot change their own password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cu-name-en">Name (EN) <span className="text-destructive">*</span></Label>
                <Input id="cu-name-en" required value={createForm.name_en} onChange={e => setC('name_en')(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-name-ar">Name (AR)</Label>
                <Input id="cu-name-ar" value={createForm.name_ar} onChange={e => setC('name_ar')(e.target.value)} dir="rtl" className="text-right font-arabic" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email <span className="text-destructive">*</span></Label>
              <Input id="cu-email" type="email" required value={createForm.email} onChange={e => setC('email')(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-password">Password <span className="text-destructive">*</span></Label>
              <Input id="cu-password" type="password" required minLength={8} value={createForm.password} onChange={e => setC('password')(e.target.value)} />
              <p className="text-xs text-muted-foreground">Min 8 characters. Communicate to user out-of-band.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={createForm.role_id} onValueChange={setC('role_id')}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create user'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={o => { if (!o) setResetTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetTarget?.name_en}</strong>. Communicate it to the user out-of-band.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rp-new">New password</Label>
              <Input id="rp-new" type="password" required minLength={8} value={resetForm.new_password} onChange={e => setR('new_password')(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-confirm">Confirm password</Label>
              <Input id="rp-confirm" type="password" required minLength={8} value={resetForm.confirm} onChange={e => setR('confirm')(e.target.value)} />
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Resetting…' : 'Reset password'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
