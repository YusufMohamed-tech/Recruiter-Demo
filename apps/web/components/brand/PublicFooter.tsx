import Link from 'next/link'
import { Logo } from './Logo'

export function PublicFooter() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Logo variant="full" className="h-10 w-auto brightness-0 invert" />
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
            <Link href="/careers" className="hover:text-white transition-colors">Careers</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Chessboard Group. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
