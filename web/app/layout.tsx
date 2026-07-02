import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://strideai.it.com'),
  title: {
    default: 'StrideAI — платформа аналитики и профиля ученика',
    template: '%s · StrideAI',
  },
  description:
    'StrideAI (stride.ai) — AI-платформа для школ: цифровой профиль ученика, наблюдения учителей, аналитика и книга ученика.',
  applicationName: 'StrideAI',
  keywords: ['StrideAI', 'stride.ai', 'страйд', 'профиль ученика', 'школьная аналитика', 'книга ученика', 'Stride'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://strideai.it.com',
    siteName: 'StrideAI',
    title: 'StrideAI — платформа аналитики и профиля ученика',
    description: 'AI-платформа для школ: цифровой профиль ученика, наблюдения учителей, аналитика.',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StrideAI — платформа аналитики ученика',
    description: 'AI-платформа для школ: профиль ученика, наблюдения, аналитика.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  )
}
