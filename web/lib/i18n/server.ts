import { cookies } from 'next/headers'
import { normalizeLocale, LANG_COOKIE, type Locale } from './config'
import { translate } from './dictionaries'

export async function getLocale(): Promise<Locale> {
  const c = await cookies()
  return normalizeLocale(c.get(LANG_COOKIE)?.value)
}

export async function getT() {
  const locale = await getLocale()
  return {
    locale,
    t: (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
  }
}
