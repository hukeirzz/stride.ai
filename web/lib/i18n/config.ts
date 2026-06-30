export const LOCALES = ['ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ru'
export const LANG_COOKIE = 'lang'

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === 'en' ? 'en' : 'ru'
}
