'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const tabs = [
  { href: '/settings/organization',   label: 'Organization' },
  { href: '/settings/establishments', label: 'Establishments' },
  { href: '/settings/users',          label: 'Users' },
  { href: '/settings/roles',          label: 'Roles & Permissions' },
  { href: '/settings/workflows',      label: 'Approval Workflows' },
  { href: '/settings/scorecard-templates', label: 'Scorecard Templates' },
  { href: '/settings/rejection-reasons',   label: 'Rejection Reasons' },
  { href: '/settings/privacy-requests',    label: 'Privacy Requests' },
  { href: '/settings/audit-log',           label: 'Audit Log' },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav className="w-48 shrink-0">
      <ul className="space-y-0.5">
        {tabs.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-brand-green/20 text-brand-dark font-semibold'
                  : 'text-brand-neutral hover:bg-brand-light-bg hover:text-brand-dark'
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
