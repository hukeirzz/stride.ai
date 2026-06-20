'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function advanceSchoolYear() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('school_id, role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) return { error: 'Только директор или администратор может менять учебный год' }

  const admin = createAdminClient()

  // Increment school_year
  const { data: school } = await admin
    .from('schools').select('school_year').eq('id', profile.school_id).single()
  const newYear = (school?.school_year ?? 2026) + 1

  await admin.from('schools').update({ school_year: newYear }).eq('id', profile.school_id)

  // Increment all class grades by 1
  await admin.rpc('increment_class_grades', { p_school_id: profile.school_id })

  revalidatePath('/')
  return { success: true, newYear }
}

export async function revertSchoolYear() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('school_id, role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) return { error: 'Только директор или администратор может менять учебный год' }

  const admin = createAdminClient()

  const { data: school } = await admin
    .from('schools').select('school_year').eq('id', profile.school_id).single()
  const newYear = (school?.school_year ?? 2026) - 1

  await admin.from('schools').update({ school_year: newYear }).eq('id', profile.school_id)
  await admin.rpc('decrement_class_grades', { p_school_id: profile.school_id })

  revalidatePath('/')
  return { success: true, newYear }
}

export async function deleteClass(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'deputy'].includes(profile?.role)) return { error: 'Нет прав' }

  const { error } = await supabase.from('classes').delete().eq('id', classId)
  if (error) return { error: 'Ошибка удаления класса' }

  revalidatePath('/students')
  return { success: true }
}
