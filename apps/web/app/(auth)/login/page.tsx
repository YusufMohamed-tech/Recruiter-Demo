import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = { title: 'Login | Chessboard' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="full" className="h-12 w-auto" />
        </div>
        <div className="rounded-card border bg-white p-8 shadow-sm">
          <h1 className="font-heading text-xl font-semibold text-center mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Sign in to your account
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
