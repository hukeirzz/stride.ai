'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface StudentEditFields {
  full_name: string
  parent_name: string
  parent_phone: string
  class_id: string
  goals: string[]
  dream: string
  parent_goal: string
  family_situation: string
  health_status: string
  enrollment_year: string
}

export async function updateStudent(
  studentId: string,
  fields: StudentEditFields,
  photoFile?: FormData,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }
  if (!fields.full_name.trim()) return { error: 'Введите ФИО' }

  let photo_url: string | undefined

  if (photoFile) {
    const file = photoFile.get('photo') as File | null
    if (file && file.size > 0) {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      const ext = (file.name.split('.').pop() ?? '').toLowerCase()
      if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(ext))
        return { error: 'Разрешены только изображения (JPG, PNG, WebP, GIF)' }
      if (file.size > 5 * 1024 * 1024)
        return { error: 'Фото не должно превышать 5 МБ' }

      const path = `students/${studentId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) return { error: 'Ошибка загрузки фото' }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      photo_url = urlData.publicUrl
    }
  }

  const update: Record<string, unknown> = {
    full_name:        fields.full_name.trim(),
    parent_name:      fields.parent_name.trim() || null,
    parent_phone:     fields.parent_phone.trim() || null,
    class_id:         fields.class_id || null,
    goals:            fields.goals,
    dream:            fields.dream.trim() || null,
    parent_goal:      fields.parent_goal.trim() || null,
    family_situation: fields.family_situation.trim() || null,
    health_status:    fields.health_status.trim() || null,
    enrollment_year:  fields.enrollment_year.trim() || null,
  }
  if (photo_url) update.photo_url = photo_url

  const { error } = await supabase
    .from('students')
    .update(update)
    .eq('id', studentId)

  if (error) return { error: 'Ошибка сохранения' }

  revalidatePath(`/students/${studentId}`)
  return { success: true }
}
