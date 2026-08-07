import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export const metadata: Metadata = { title: 'User Management' }

export default async function UsersPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()

  const [{ data: users }, { data: roles }] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, name_en, name_ar, is_active, created_at, user_roles(role:roles(id, name))')
      .eq('org_id', profile?.org_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('roles')
      .select('id, name')
      .eq('org_id', profile?.org_id)
      .order('name'),
  ])

  return (
    <div className="rounded-card border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Accounts are created and managed by administrators. Users cannot self-register.
        </p>
      </div>
      <UsersClient initialUsers={(users ?? []) as any} roles={(roles ?? []) as any} currentUserId={user!.id} />
    </div>
  )
}
