import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const bypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  let userEmail: string | undefined = 'demo@chessboard.local'
  let userName: string | undefined  = 'Demo User'
  let userId: string | undefined    = '00000000-0000-0000-0000-000000000001'

  if (!bypass) {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    userEmail = user.email
    userId = user.id
    const { data: profile } = await supabase
      .from('users')
      .select('name_en')
      .eq('id', user.id)
      .single()
    userName = profile?.name_en ?? undefined
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-light-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userEmail={userEmail} userName={userName} userId={userId} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
