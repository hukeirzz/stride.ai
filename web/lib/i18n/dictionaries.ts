import type { Locale } from './config'

type Dict = Record<string, string>

const ru: Dict = {
  // nav
  'nav.home': 'Главная',
  'nav.students': 'Ученики',
  'nav.staff': 'Сотрудники',
  'nav.book': 'Книга ученика',
  'nav.analytics': 'Аналитика школы',
  'nav.addObservation': 'Добавить наблюдение',
  'common.logout': 'Выйти',

  // roles
  'role.admin': 'Администрация',
  'role.deputy': 'Завуч',
  'role.teacher': 'Учитель',
  'role.class_teacher': 'Кл. руководитель',
  'role.psychologist': 'Психолог',
  'role.nurse': 'Медсестра',
  'role.security': 'Охранник',
  'role.manager': 'Менеджер',

  // observation categories
  'cat.academic': 'Академическое',
  'cat.behavior': 'Поведение',
  'cat.psychology': 'Психология',
  'cat.sport': 'Спорт',
  'cat.creative': 'Творчество',
  'cat.health': 'Здоровье',

  // add observation
  'obs.pageTitle': 'Добавить наблюдение',
  'obs.pageSubtitle': 'Заполнение занимает менее 30 секунд',
  'obs.class': 'Класс',
  'obs.allClasses': 'Все классы',
  'obs.student': 'ФИО ученика',
  'obs.studentPlaceholder': 'Выберите ученика...',
  'obs.category': 'Категория наблюдения',
  'obs.note': 'Заметка',
  'obs.notePlaceholder': 'Опишите ваше наблюдение об ученике. Что произошло? Что вы заметили? Какие рекомендации?',
  'obs.minChars': 'Минимум 10 символов',
  'obs.charsCount': '{n} символов',
  'obs.alert': 'Отметить как тревожный сигнал',
  'obs.success': 'Наблюдение успешно добавлено!',
  'obs.error': 'Не удалось сохранить. Попробуйте снова.',
  'obs.save': 'Сохранить наблюдение',
  'obs.saving': 'Сохраняем...',
  'obs.tipsTitle': 'Советы для качественного наблюдения',
  'obs.tip1': 'Описывайте конкретные факты, а не общие суждения',
  'obs.tip2': 'Укажите контекст: урок, перемена, внеклассное мероприятие',
  'obs.tip3': 'Добавьте конкретную рекомендацию, если она есть',
}

const en: Dict = {
  // nav
  'nav.home': 'Home',
  'nav.students': 'Students',
  'nav.staff': 'Staff',
  'nav.book': 'Student Book',
  'nav.analytics': 'School Analytics',
  'nav.addObservation': 'Add Observation',
  'common.logout': 'Log out',

  // roles
  'role.admin': 'Administration',
  'role.deputy': 'Deputy Head',
  'role.teacher': 'Teacher',
  'role.class_teacher': 'Class Teacher',
  'role.psychologist': 'Psychologist',
  'role.nurse': 'Nurse',
  'role.security': 'Security',
  'role.manager': 'Manager',

  // observation categories
  'cat.academic': 'Academic',
  'cat.behavior': 'Behavior',
  'cat.psychology': 'Psychology',
  'cat.sport': 'Sport',
  'cat.creative': 'Creative',
  'cat.health': 'Health',

  // add observation
  'obs.pageTitle': 'Add Observation',
  'obs.pageSubtitle': 'Takes less than 30 seconds',
  'obs.class': 'Class',
  'obs.allClasses': 'All classes',
  'obs.student': 'Student',
  'obs.studentPlaceholder': 'Select a student...',
  'obs.category': 'Observation category',
  'obs.note': 'Note',
  'obs.notePlaceholder': 'Describe your observation about the student. What happened? What did you notice? Any recommendations?',
  'obs.minChars': 'Minimum 10 characters',
  'obs.charsCount': '{n} characters',
  'obs.alert': 'Mark as an alert',
  'obs.success': 'Observation added successfully!',
  'obs.error': 'Could not save. Please try again.',
  'obs.save': 'Save observation',
  'obs.saving': 'Saving...',
  'obs.tipsTitle': 'Tips for a good observation',
  'obs.tip1': 'Describe specific facts, not general judgments',
  'obs.tip2': 'Add context: lesson, break, extracurricular activity',
  'obs.tip3': 'Add a specific recommendation if you have one',
}

export const dictionaries: Record<Locale, Dict> = { ru, en }

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let s = dictionaries[locale]?.[key] ?? dictionaries.ru[key] ?? key
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
