'use client'

import { createContext, useContext } from 'react'
import { translate } from './dictionaries'
import { DEFAULT_LOCALE, type Locale } from './config'

type TFn = (key: string, params?: Record<string, string | number>) => string

const I18nContext = createContext<{ locale: Locale; t: TFn }>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
})

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t: TFn = (key, params) => translate(locale, key, params)
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
