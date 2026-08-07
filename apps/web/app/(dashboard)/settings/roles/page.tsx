import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { RolesClient } from './RolesClient'

export const metadata: Metadata = { title: 'Roles & Permissions' }

export default async function RolesPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()

  const { data: roles } = await supabase
    .from('roles')
    .select('*, role_permissions(permission)')
    .eq('org_id', profile?.org_id)
    .order('is_system', { ascending: false })
    .order('name')

  return (
    <div className="rounded-card border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          System roles are read-only. Create custom roles for fine-grained access control.
        </p>
      </div>
      <RolesClient initialRoles={roles ?? []} />
    </div>
  )
}
