'use client'

import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { translate } from './dictionaries'
import { DEFAULT_LOCALE, LANG_COOKIE, type Locale } from './config'

type TFn = (key: string, params?: Record<string, string | number>) => string

const I18nContext = createContext<{ locale: Locale; t: TFn; setLocale: (l: Locale) => void }>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
  setLocale: () => {},
})

export function I18nProvider({ locale: initial, children }: { locale: Locale; children: React.ReactNode }) {
  const [locale, setLoc] = useState<Locale>(initial)
  const router = useRouter()

  const t: TFn = (key, params) => translate(locale, key, params)

  const setLocale = (l: Locale) => {
    if (l === locale) return
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    setLoc(l)         // мгновенно обновляем клиентские компоненты
    router.refresh()  // фоном синхронизируем серверные части (UI уже переключился)
  }

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
