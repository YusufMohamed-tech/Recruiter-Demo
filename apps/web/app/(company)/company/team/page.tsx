'use client'

import { useEffect, useState } from 'react'
import { Users, Mail, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function CompanyTeamPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRow) { setLoading(false); return }

      const { data: team } = await supabase
        .from('users')
        .select('id, email, name_en, is_active, created_at')
        .eq('org_id', userRow.org_id)
        .order('created_at')

      const { data: invites } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('org_id', userRow.org_id)
        .eq('status', 'pending')

      setMembers(team || [])
      setInvitations(invites || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleInvite() {
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (!userRow) return

    const { data: roles } = await supabase.from('roles').select('id').eq('org_id', userRow.org_id).limit(1)
    const roleId = roles?.[0]?.id

    if (!roleId) { setSending(false); return }

    const token = crypto.randomUUID()
    await supabase.from('company_invitations').insert({
      org_id: userRow.org_id,
      email: inviteEmail,
      role_id: roleId,
      invited_by: user.id,
      token,
    })

    setInvitations(prev => [...prev, { email: inviteEmail, status: 'pending', created_at: new Date().toISOString() }])
    setInviteEmail('')
    setShowInvite(false)
    setSending(false)
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team</h1>
        <Button onClick={() => setShowInvite(true)}><Plus className="h-4 w-4 mr-2" />Invite Member</Button>
      </div>

      {showInvite && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium mb-3">Invite a team member</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
            </div>
            <Button onClick={handleInvite} disabled={sending || !inviteEmail}>
              {sending ? 'Sending…' : 'Send Invite'}
            </Button>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg divide-y">
        <div className="p-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Members ({members.length})</h2>
        </div>
        {members.map(m => (
          <div key={m.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-sm font-bold text-brand-primary">
                {m.name_en?.charAt(0) || m.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{m.name_en || m.email}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {m.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      {invitations.length > 0 && (
        <div className="bg-white border rounded-lg divide-y">
          <div className="p-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pending Invitations</h2>
          </div>
          {invitations.map((inv, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{inv.email}</span>
              </div>
              <span className="text-xs text-yellow-600">Pending</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
