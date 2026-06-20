'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStudent(
  studentId: string,
  full_name: string,
  parent_name: string,
  parent_phone: string,
  class_id: string,
  photoFile?: FormData,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

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

  const update: Record<string, string> = { full_name, parent_name, parent_phone, class_id }
  if (photo_url) update.photo_url = photo_url

  const { error } = await supabase
    .from('students')
    .update(update)
    .eq('id', studentId)

  if (error) return { error: 'Ошибка сохранения' }

  revalidatePath(`/students/${studentId}`)
  return { success: true }
}
