import { createClient } from '@/lib/supabase/server'
import { StudentsListClient } from '@/components/students/StudentsListClient'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users').select('school_id, role').eq('id', user!.id).single()

  const canAddStudent = ['admin', 'deputy', 'class_teacher', 'manager'].includes(profile?.role ?? '')
  const canDelete = ['admin', 'deputy', 'manager'].includes(profile?.role ?? '')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade, letter')
    .eq('school_id', profile?.school_id ?? '')
    .order('grade', { ascending: false })
    .order('letter', { ascending: true })

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, risk_level, status, class_id, photo_url')
    .eq('school_id', profile?.school_id ?? '')
    .eq('status', 'active')
    .order('full_name')

  const schoolId = profile?.school_id ?? ''

  // Fetch observation counts + no-recent-obs (14-day rule) in parallel
  const studentIds = (students ?? []).map((s) => s.id)
  const [obsResult, noRecentObsRes] = await Promise.all([
    studentIds.length > 0
      ? supabase.from('observations').select('student_id, is_alert').eq('source', 'manual').in('student_id', studentIds)
      : Promise.resolve({ data: [] as { student_id: string; is_alert: boolean }[] }),
    schoolId
      ? supabase.rpc('get_students_no_recent_obs', { p_school_id: schoolId })
      : Promise.resolve({ data: [] }),
  ])

  const obsMap: Record<string, { total: number; alerts: number }> = {}
  for (const o of obsResult.data ?? []) {
    if (!obsMap[o.student_id]) obsMap[o.student_id] = { total: 0, alerts: 0 }
    obsMap[o.student_id].total++
    if (o.is_alert) obsMap[o.student_id].alerts++
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noRecentObsIds = ((noRecentObsRes as any).data ?? []).map((r: any) => r.id as string)

  const classList = (classes ?? []).map((cls) => ({
    ...cls,
    students: (students ?? [])
      .filter((s) => s.class_id === cls.id)
      .map((s) => ({
        ...s,
        obs_count: obsMap[s.id]?.total ?? 0,
        alert_count: obsMap[s.id]?.alerts ?? 0,
      })),
  }))

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Список учеников</h1>
        {canAddStudent && (
          <Link
            href="/students/new"
            className="flex items-center gap-2 bg-[#2563EB] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Добавить ученика
          </Link>
        )}
      </div>

      <StudentsListClient classList={classList} canDelete={canDelete} noRecentObsIds={noRecentObsIds} />
    </div>
  )
}
