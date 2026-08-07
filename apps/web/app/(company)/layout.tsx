'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, FileText, Users, Building2, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/company/applications', label: 'Applications', icon: FileText },
  { href: '/company/team', label: 'Team', icon: Users },
  { href: '/company/company-profile', label: 'Company Profile', icon: Building2 },
  { href: '/company/settings', label: 'Settings', icon: Settings },
]

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-white flex-col">
        <div className="p-4 border-b">
          <Link href="/company/dashboard" className="font-heading font-bold text-lg text-brand-primary">
            Chessboard
          </Link>
          <p className="text-xs text-muted-foreground">Company Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'text-muted-foreground hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-50 border-b bg-white p-4 flex items-center justify-between">
          <Link href="/company/dashboard" className="font-heading font-bold text-brand-primary">
            Chessboard
          </Link>
          <button onClick={handleSignOut} className="text-sm text-muted-foreground">Sign Out</button>
        </header>
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
