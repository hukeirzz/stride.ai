'use server'

import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import type { BookData, BookObservation } from '@/lib/pdf/types'

const NO_DATA = 'Данных пока недостаточно.'

function clean(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s || s === NO_DATA) return null
  return s
}

// Скачиваем картинку на сервере, конвертируем в PNG (react-pdf не умеет webp!) и
// отдаём как data URI — тогда логотип школы и фото всегда встроены и отображаются.
async function toDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const input = Buffer.from(await res.arrayBuffer())
    const png = await sharp(input).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

export async function getStudentBookData(studentId: string): Promise<{ data?: BookData; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: student } = await supabase
    .from('students')
    .select('id, school_id, full_name, photo_url, enrollment_year, parent_name, parent_phone, goals, dream, parent_goal, family_situation, health_status, risk_level, status, class:classes(name)')
    .eq('id', studentId)
    .single()
  if (!student) return { error: 'Ученик не найден' }

  const [{ data: obs }, { data: ai }, { data: school }] = await Promise.all([
    supabase
      .from('observations')
      .select('content, category, created_at, is_alert, author:users(full_name)')
      .eq('student_id', studentId)
      .eq('source', 'manual')
      .order('created_at', { ascending: false }),
    supabase
      .from('ai_insights')
      .select('overview, interests, academic, extracurricular, achievements, psychology')
      .eq('student_id', studentId)
      .maybeSingle(),
    supabase.from('schools').select('name, school_year, logo_url').eq('id', student.school_id).single(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const className = (Array.isArray(student.class) ? (student.class[0] as any)?.name : (student.class as any)?.name) ?? '—'

  const observations: BookObservation[] = (obs ?? []).map((o: any) => ({
    date: new Date(o.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
    category: o.category as string,
    content: (o.content as string) ?? '',
    author: (Array.isArray(o.author) ? o.author[0]?.full_name : o.author?.full_name) ?? '—',
    isAlert: !!o.is_alert,
  }))

  const counts: Record<string, number> = {}
  for (const o of obs ?? []) counts[o.category] = (counts[o.category] ?? 0) + 1
  const categoryCounts = Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // Встраиваем картинки как data URI (сервер качает — без CORS/промахов на клиенте)
  const [photoUrl, schoolLogoUrl] = await Promise.all([
    toDataUri(student.photo_url),
    toDataUri((school as { logo_url?: string | null } | null)?.logo_url),
  ])

  const data: BookData = {
    fullName: student.full_name,
    photoUrl,
    className,
    schoolName: school?.name ?? '',
    schoolLogoUrl,
    schoolYear: school?.school_year ?? new Date().getFullYear(),
    generatedAt: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),

    enrollmentYear: clean(student.enrollment_year),
    status: student.status ?? 'active',
    riskLevel: student.risk_level ?? 'none',
    parentName: clean(student.parent_name),
    parentPhone: clean(student.parent_phone),

    goals: ((student.goals as string[] | null) ?? []).filter(Boolean),
    dream: clean(student.dream),
    parentGoal: clean(student.parent_goal),
    familySituation: clean(student.family_situation),
    healthStatus: clean(student.health_status),

    summaries: {
      overview: clean(ai?.overview),
      interests: clean(ai?.interests),
      academic: clean(ai?.academic),
      extracurricular: clean(ai?.extracurricular),
      achievements: clean(ai?.achievements),
      psychology: clean(ai?.psychology),
    },
    observations,
    observationsTotal: observations.length,
    categoryCounts,
  }

  return { data }
}
