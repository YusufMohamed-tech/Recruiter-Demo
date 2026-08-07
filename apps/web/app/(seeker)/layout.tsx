'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, FileText, User, Bookmark } from 'lucide-react'

const navItems = [
  { href: '/seeker/dashboard', label: 'Home', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Search },
  { href: '/seeker/applications', label: 'Applications', icon: FileText },
  { href: '/seeker/saved-jobs', label: 'Saved', icon: Bookmark },
  { href: '/seeker/profile', label: 'Profile', icon: User },
]

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Desktop top nav */}
      <header className="hidden md:block sticky top-0 z-50 border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/seeker/dashboard" className="font-heading font-bold text-lg text-brand-primary">
            Chessboard
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'text-brand-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/seeker/settings" className="text-sm text-muted-foreground hover:text-foreground">
            Settings
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-white">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 text-xs ${
                  active ? 'text-brand-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
