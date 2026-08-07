'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Notification = {
  id: string
  type: string
  title_en: string
  title_ar: string | null
  body_en: string | null
  resource_type: string | null
  resource_id: string | null
  read_at: string | null
  created_at: string
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter(n => !n.read_at).length)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(c => c + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, fetchNotifications])

  async function markAllRead() {
    await fetch('/api/v1/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }

  async function markOneRead(id: string) {
    await fetch(`/api/v1/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  return { notifications, unreadCount, markAllRead, markOneRead, refetch: fetchNotifications }
}
