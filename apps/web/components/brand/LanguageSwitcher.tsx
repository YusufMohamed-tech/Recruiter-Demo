'use client'

import { useRouter } from 'next/navigation'

export function LanguageSwitcher() {
  const router = useRouter()

  function switchLang(lang: 'en' | 'ar') {
    document.cookie = `lang=${lang}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 text-sm font-nav">
      <button
        onClick={() => switchLang('ar')}
        className="px-2 py-1 text-brand-neutral hover:text-brand-dark transition-colors"
      >
        AR
      </button>
      <span className="text-border">|</span>
      <button
        onClick={() => switchLang('en')}
        className="px-2 py-1 text-brand-neutral hover:text-brand-dark transition-colors"
      >
        EN
      </button>
    </div>
  )
}
