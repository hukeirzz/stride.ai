export type Role =
  | 'admin'
  | 'deputy'
  | 'teacher'
  | 'class_teacher'
  | 'psychologist'
  | 'nurse'
  | 'security'
  | 'manager'

export type RiskLevel = 'none' | 'medium' | 'high'
export type StudentStatus = 'active' | 'inactive'
export type ObservationCategory =
  | 'academic'
  | 'behavior'
  | 'psychology'
  | 'sport'
  | 'creative'
  | 'social'

export interface School {
  id: string
  name: string
  created_at: string
}

export interface User {
  id: string
  school_id: string
  role: Role
  full_name: string
  email: string
  avatar_url?: string
}

export interface Class {
  id: string
  school_id: string
  name: string
  teacher_id: string
  year: number
}

export interface Student {
  id: string
  school_id: string
  class_id: string
  full_name: string
  photo_url?: string
  status: StudentStatus
  risk_level: RiskLevel
  goals?: string[]
  parent_name?: string
  parent_phone?: string
  class?: Class
}

export interface Observation {
  id: string
  student_id: string
  author_id: string
  category: ObservationCategory
  content: string
  created_at: string
  is_alert: boolean
  author?: User
  student?: Student
}

export interface StudentInterests {
  student_id: string
  hobbies: string[]
  sports: string[]
  subjects: string[]
}

export interface AIInsight {
  id: string
  school_id: string
  student_id?: string
  content: Record<string, unknown>
  generated_at: string
}
