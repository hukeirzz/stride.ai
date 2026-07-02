'use client'

import { useI18n } from '@/lib/i18n/I18nProvider'
import { LOCALES } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

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
