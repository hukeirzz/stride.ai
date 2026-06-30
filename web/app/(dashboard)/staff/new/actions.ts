'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function addStaff(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('users').select('school_id, role').eq('id', user.id).single()
  if (!profile?.school_id) return { error: 'Школа не найдена' }
  if (!['admin', 'manager'].includes(profile.role)) return { error: 'Нет прав для добавления сотрудников' }

  const full_name = (formData.get('full_name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = formData.get('role') as string
  const password = formData.get('password') as string
  const classIds = (formData.getAll('class_ids') as string[]).filter(Boolean)
  const createNew = formData.get('create_new_class') === '1'

  if (!full_name || !email || !role || !password) return { error: 'Заполните все обязательные поля' }
  if (password.length < 8) return { error: 'Пароль должен быть минимум 8 символов' }
  if (role === 'class_teacher' && classIds.length === 0 && !createNew)
    return { error: 'Укажите хотя бы один класс для классного руководителя' }

  const admin = createAdminClient()
  const resolved = [...classIds]

  // Create a new class if requested
  if (role === 'class_teacher' && createNew) {
    const grade = parseInt(formData.get('new_class_grade') as string)
    const letter = (formData.get('new_class_letter') as string).trim()
    if (!grade || !letter) return { error: 'Укажите параллель и букву класса' }
    const { data: cls, error: clsErr } = await admin
      .from('classes')
      .insert({ school_id: profile.school_id, name: `${grade}${letter}`, grade, letter })
      .select('id').single()
    if (clsErr) return { error: 'Ошибка создания класса' }
    resolved.push(cls.id)
  }

  if (role === 'class_teacher' && resolved.length === 0)
    return { error: 'Укажите хотя бы один класс для классного руководителя' }

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (authError) return { error: authError.message.includes('already') ? 'Email уже используется' : 'Ошибка создания аккаунта' }

  const { error: profileError } = await supabase.from('users').insert({
    id: newUser.user.id,
    school_id: profile.school_id,
    full_name, email, role,
    class_id: role === 'class_teacher' ? (resolved[0] ?? null) : null,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return { error: 'Ошибка создания профиля' }
  }

  // Привязываем выбранные классы к новому классруку через classes.teacher_id
  if (role === 'class_teacher' && resolved.length > 0) {
    await admin.from('classes').update({ teacher_id: newUser.user.id }).in('id', resolved)
  }

  redirect('/staff')
}
