'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteStaff(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('role, school_id').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Нет прав' }
  if (userId === user.id) return { error: 'Нельзя удалить самого себя' }

  // Verify target user belongs to same school
  const { data: target } = await supabase
    .from('users').select('school_id').eq('id', userId).single()
  if (!target || target.school_id !== profile.school_id)
    return { error: 'Пользователь не найден' }

  const admin = createAdminClient()
  await admin.from('users').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)

  revalidatePath('/staff')
  return { success: true }
}

export async function changeStaffRole(userId: string, newRole: string, classId?: string | null, newClassGrade?: number, newClassLetter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('role, school_id').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Нет прав' }
  if (userId === user.id) return { error: 'Нельзя изменить свою роль' }

  let resolvedClassId: string | null = classId ?? null

  // Create new class if needed
  if (newRole === 'class_teacher' && classId === '__new__' && newClassGrade && newClassLetter) {
    const { data: cls, error: clsErr } = await supabase
      .from('classes')
      .insert({ school_id: profile.school_id, name: `${newClassGrade}${newClassLetter}`, grade: newClassGrade, letter: newClassLetter })
      .select('id').single()
    if (clsErr) return { error: 'Ошибка создания класса' }
    resolvedClassId = cls.id
  }

  const { error } = await supabase.from('users').update({
    role: newRole,
    class_id: newRole === 'class_teacher' ? resolvedClassId : null,
  }).eq('id', userId)
  if (error) return { error: 'Ошибка изменения роли' }

  revalidatePath('/staff')
  return { success: true }
}

export async function resetStaffPassword(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('role, school_id').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Нет прав' }

  // Verify target user belongs to same school
  const { data: target } = await supabase
    .from('users').select('school_id').eq('id', userId).single()
  if (!target || target.school_id !== profile.school_id)
    return { error: 'Пользователь не найден' }

  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const newPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { error: 'Ошибка сброса пароля' }

  return { success: true, password: newPassword }
}
