import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Role } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администрация',
  deputy: 'Завуч',
  teacher: 'Учитель',
  class_teacher: 'Кл. руководитель',
  psychologist: 'Психолог',
  nurse: 'Медсестра',
  security: 'Охранник',
  manager: 'Менеджер',
}

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-blue-100 text-blue-700',
  deputy: 'bg-purple-100 text-purple-700',
  teacher: 'bg-green-100 text-green-700',
  class_teacher: 'bg-teal-100 text-teal-700',
  psychologist: 'bg-orange-100 text-orange-700',
  nurse: 'bg-pink-100 text-pink-700',
  security: 'bg-gray-100 text-gray-700',
  manager: 'bg-indigo-100 text-indigo-700',
}
