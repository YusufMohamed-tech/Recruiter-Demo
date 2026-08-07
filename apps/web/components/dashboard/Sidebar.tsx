'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Users, FileText, BarChart2,
  Settings, ClipboardList, Gift, BookOpen, Building2,
  Calendar, Shield, Mail,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/dashboard',            label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/requisitions',         label: 'Requisitions',    icon: ClipboardList },
  { href: '/jobs',                 label: 'Jobs',            icon: Briefcase },
  { href: '/candidates',           label: 'Candidates',      icon: Users },
  { href: '/applications',         label: 'Applications',    icon: FileText },
  { href: '/interviews',           label: 'Interviews',      icon: Calendar },
  { href: '/offers',               label: 'Offers',          icon: Gift },
  { href: '/readiness',            label: 'Readiness',       icon: BookOpen },
  { href: '/government-cases',     label: 'Gov. Cases',      icon: Building2 },
  { href: '/communications',       label: 'Communications',  icon: Mail },
  { href: '/compliance',           label: 'Compliance',      icon: Shield },
  { href: '/analytics',            label: 'Analytics',       icon: BarChart2 },
  { href: '/settings',             label: 'Settings',        icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-sidebar flex-col border-e bg-sidebar-bg">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard">
          <Logo variant="full" className="h-8 w-auto" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-active text-brand-dark'
                      : 'text-brand-neutral hover:bg-brand-light-bg hover:text-brand-dark'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
