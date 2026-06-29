// Данные для PDF «Книга ученика». Собираются на сервере, рендерятся react-pdf.

export interface BookObservation {
  date: string       // уже отформатированная дата (ru-RU)
  category: string   // ключ категории (academic/behavior/...)
  content: string
  author: string
  isAlert: boolean
}

export interface BookSummaries {
  overview: string | null
  interests: string | null
  academic: string | null
  extracurricular: string | null
  achievements: string | null
  psychology: string | null
}

export interface BookData {
  fullName: string
  photoUrl: string | null
  className: string
  schoolName: string
  schoolYear: number
  generatedAt: string

  enrollmentYear: string | null
  status: string            // 'active' | 'inactive'
  riskLevel: string         // 'none' | 'medium' | 'high'
  parentName: string | null
  parentPhone: string | null

  goals: string[]
  dream: string | null
  parentGoal: string | null
  familySituation: string | null
  healthStatus: string | null

  summaries: BookSummaries
  observations: BookObservation[]
  observationsTotal: number
  categoryCounts: { category: string; count: number }[]
}
