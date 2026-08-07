'use client'

import { Bell, Search, LogOut, CheckCheck, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import Link from 'next/link'

interface TopbarProps {
  userEmail?: string
  userName?: string
  userId?: string
}

const TYPE_LABELS: Record<string, string> = {
  sla_reminder:         'SLA Reminder',
  approval_needed:      'Approval Needed',
  approval_decided:     'Approval Decision',
  offer_accepted:       'Offer Accepted',
  offer_declined:       'Offer Declined',
  interview_scheduled:  'Interview Scheduled',
  application_submitted:'New Application',
}

function resourceHref(type: string | null, id: string | null): string | null {
  if (!type || !id) return null
  const map: Record<string, string> = {
    offer:                    `/offers/${id}`,
    job_requisition:          `/requisitions/${id}`,
    job_application:          `/applications/${id}`,
    interview:                `/interviews/${id}`,
    employment_readiness_case:`/readiness/${id}`,
  }
  return map[type] ?? null
}

export function Topbar({ userEmail, userName, userId }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications(userId)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : userEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-brand-neutral">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-brand-neutral">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto p-0">
            <div className="flex items-center justify-between px-3 py-2 border-b sticky top-0 bg-white z-10">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--brand-green))] hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No notifications</div>
            ) : (
              notifications.map(n => {
                const href = resourceHref(n.resource_type, n.resource_id ? String(n.resource_id) : null)
                return (
                  <div
                    key={n.id}
                    className={`px-3 py-2.5 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${!n.read_at ? 'bg-blue-50/40' : ''}`}
                    onClick={() => { if (!n.read_at) markOneRead(n.id) }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {TYPE_LABELS[n.type] ?? n.type}
                        </p>
                        <p className={`text-sm mt-0.5 ${!n.read_at ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {n.title_en}
                        </p>
                        {n.body_en && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body_en}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {!n.read_at && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                        )}
                        {href && (
                          <Link href={href} onClick={e => e.stopPropagation()}>
                            <ExternalLink className="h-3 w-3 text-gray-300 hover:text-gray-500" />
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                )
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-brand-green text-brand-dark text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {userName && <p className="text-sm font-medium">{userName}</p>}
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
