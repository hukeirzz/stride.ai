import { createClient } from '@/lib/supabase/server'
import { ObservationForm } from '@/components/observations/ObservationForm'

export default async function NewObservationPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const { student: defaultStudentId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users').select('school_id').eq('id', user!.id).single()

  const [{ data: students }, { data: classes }] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, class_id, class:classes(name)')
      .eq('school_id', profile?.school_id ?? '')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', profile?.school_id ?? '')
      .order('name'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentList = (students ?? []).map((s: any) => ({
    id: s.id as string,
    full_name: s.full_name as string,
    class_id: s.class_id as string | null,
    class_name: (Array.isArray(s.class) ? s.class[0]?.name : s.class?.name) ?? '—',
  }))

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Добавить наблюдение</h1>
      <p className="text-sm text-gray-400 mb-6 sm:mb-8">Заполнение занимает менее 30 секунд</p>
      <ObservationForm students={studentList} classes={classes ?? []} authorId={user!.id} defaultStudentId={defaultStudentId} />
    </div>
  )
}
