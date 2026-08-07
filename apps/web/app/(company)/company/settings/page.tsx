'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function CompanySettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Account</h2>
        <Button variant="outline" className="w-full justify-start" disabled>
          Change Password (coming soon)
        </Button>
        <Button variant="outline" className="w-full justify-start" disabled>
          Billing & Subscription (coming soon)
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <Button variant="destructive" onClick={handleSignOut} disabled={loading} className="w-full">
          {loading ? 'Signing out…' : 'Sign Out'}
        </Button>
      </div>
    </div>
  )
}
