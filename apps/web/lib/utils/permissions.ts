import { createServerSupabase } from '@/lib/supabase/server'

export async function checkPermission(permission: string): Promise<boolean> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(role_permissions(permission))')
    .eq('user_id', user.id)

  const permissions = (data ?? []).flatMap((ur: any) =>
    ur.role?.role_permissions?.map((rp: any) => rp.permission) ?? []
  )

  return permissions.includes(permission)
}

export async function getCurrentUser() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, user_roles(role:roles(name, role_permissions(permission)))')
    .eq('id', user.id)
    .single()

  return profile
}
