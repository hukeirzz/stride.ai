'use client'

import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { LANG_COOKIE, LOCALES, type Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { locale } = useI18n()
  const router = useRouter()

  function setLocale(l: Locale) {
    if (l === locale) return
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            'flex-1 px-2 py-1 rounded-md text-xs font-semibold uppercase transition-colors',
            locale === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
