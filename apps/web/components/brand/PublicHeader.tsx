import Link from 'next/link'
import { Logo } from './Logo'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '@/components/ui/button'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo variant="full" className="h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Find Jobs
            </Link>
            <Link href="/signup/company" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              For Companies
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
