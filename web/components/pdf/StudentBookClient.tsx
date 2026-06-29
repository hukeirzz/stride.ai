'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Download, Printer, Share2, BookOpen, X, Loader2 } from 'lucide-react'
import { getStudentBookData } from '@/app/(dashboard)/student-book/actions'



interface ClassItem { id: string; name: string }
interface StudentItem { id: string; full_name: string; class_id: string; photo_url?: string | null }

const CONTENTS = [
  'Обложка',
  'Общий профиль и цели',
  'Аналитические сводки по разделам',
  'Наблюдения учителей',
]

function formatDate() {
  return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function StudentBookClient({ classes, students }: { classes: ClassItem[]; students: StudentItem[] }) {
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const comboRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const byClass = classId ? students.filter((s) => s.class_id === classId) : students
  const filteredStudents = search.trim()
    ? byClass.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()))
    : byClass

  const selectedStudent = students.find((s) => s.id === studentId)
  const selectedClass = classes.find((c) => c.id === (selectedStudent?.class_id ?? classId))

  function selectStudent(s: StudentItem) {
    setStudentId(s.id)
    setSearch(s.full_name)
    setOpen(false)
  }

  function clearStudent() {
    setStudentId('')
    setSearch('')
    setOpen(false)
  }

  async function handleGenerate() {
    if (!studentId || !selectedStudent || generating) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await getStudentBookData(studentId)
      if (res.error || !res.data) { setGenError(res.error ?? 'Не удалось получить данные'); return }
      const { generateBookBlob } = await import('@/lib/pdf/StudentBookDocument')
      const blob = await generateBookBlob(res.data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Книга ученика — ${selectedStudent.full_name}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setGenError('Не удалось сформировать PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Книга ученика</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Автоматически сформированный профиль · PDF формат</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 px-3 py-2 sm:px-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap">
            <Printer className="w-4 h-4" /> Печать
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-2 sm:px-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap">
            <Share2 className="w-4 h-4" /> Поделиться
          </button>
          <button
            onClick={handleGenerate}
            disabled={!studentId || generating}
            className="flex items-center gap-1.5 text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-2 sm:px-4 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Формируем…' : 'Скачать PDF'}
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:px-5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <BookOpen className="hidden sm:block w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Класс:</span>
            <select
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setStudentId('') }}
              className="flex-1 px-2.5 py-2 sm:py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="">Все классы</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Ученик:</span>
            <div ref={comboRef} className="relative flex-1">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setStudentId(''); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  placeholder="Поиск по имени..."
                  className="px-2.5 py-2 sm:py-1.5 text-sm outline-none bg-transparent flex-1 min-w-0 w-full"
                />
                {search && (
                  <button onClick={clearStudent} className="pr-2 text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {open && filteredStudents.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onMouseDown={() => selectStudent(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {s.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!studentId || generating}
              className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? 'Формируем…' : 'Создать PDF'}
            </button>
            {selectedStudent && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Обновлено: {formatDate()}
              </span>
            )}
          </div>
        </div>
      </div>

      {genError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{genError}</p>
      )}

      {/* Main: book + contents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Book preview — left */}
        <BookCover student={selectedStudent} studentClass={selectedClass} />

        {/* Contents — right */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Содержание</h3>
          <ol className="space-y-4">
            {CONTENTS.map((item, i) => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function BookCover({ student, studentClass }: { student: StudentItem | undefined; studentClass: ClassItem | undefined }) {
  if (!student) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center min-h-[480px]">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Выберите ученика для предпросмотра</p>
        </div>
      </div>
    )
  }

  const initials = student.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ minHeight: 480 }}>
      {/* Card content */}
      <div className="flex flex-col h-full" style={{ minHeight: 480 }}>
        {/* Upper section */}
        <div className="flex-1 px-8 pt-8 pb-4">
          {/* Logo */}
          <div className="mb-10">
            <Image src="/logo.png" width={100} height={33} alt="stride.ai" />
          </div>

          {/* Book title */}
          <h1 className="text-[2.2rem] font-black text-[#1e3a6e] leading-none mb-5">
            КНИГА<br />УЧЕНИКА
          </h1>

          {/* Student name */}
          <h2 className="text-xl font-bold text-gray-900 mb-1.5">{student.full_name}</h2>
          <p className="text-sm text-gray-400">
            {studentClass?.name ?? '—'} класс &nbsp;|&nbsp; 2024-2025 учебный год
          </p>
        </div>

        {/* Lower section: wave + photo */}
        <div className="relative" style={{ height: 220 }}>
          {/* Blue oval wave */}
          <div
            className="absolute bg-[#4f8ef7] rounded-[50%]"
            style={{
              width: '160%',
              height: '340px',
              left: '-30%',
              bottom: '-130px',
            }}
          />
          {/* Lighter inner oval for depth */}
          <div
            className="absolute bg-[#3b82f6] rounded-[50%]"
            style={{
              width: '140%',
              height: '300px',
              left: '-20%',
              bottom: '-120px',
            }}
          />
          {/* Student photo */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: 24 }}>
            <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-blue-100 shadow-md">
              {student.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-blue-600 text-2xl font-bold">{initials}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

