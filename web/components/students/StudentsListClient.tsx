'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, GraduationCap, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteStudent, deleteClass, graduateClass } from '@/app/(dashboard)/students/actions'

interface Student {
  id: string
  full_name: string
  risk_level: string
  status: string
  class_id: string
  photo_url?: string | null
  obs_count: number
  alert_count: number
}

interface ClassGroup {
  id: string
  name: string
  grade: number
  students: Student[]
}

const CLASS_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-green-500', 'bg-red-500',
]

const BASE_DEPARTURE_REASONS = ['Переезд семьи', 'Другая школа', 'Недовольство', 'Финансы', 'Другое']

function getDepartureReasons(grade: number) {
  return grade === 9 ? ['Колледж', ...BASE_DEPARTURE_REASONS] : BASE_DEPARTURE_REASONS
}

interface DeleteModal {
  studentId: string
  name: string
  grade: number
}

export function StudentsListClient({ classList, canDelete = false, noRecentObsIds = [] }: { classList: ClassGroup[]; canDelete?: boolean; noRecentObsIds?: string[] }) {
  const router = useRouter()
  const atRiskSet = new Set(noRecentObsIds)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState<ClassGroup[]>(classList)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [deleteModal, setDeleteModal] = useState<DeleteModal | null>(null)
  const [selectedReason, setSelectedReason] = useState('')
  const [otherText, setOtherText] = useState('')
  const [showMinus, setShowMinus] = useState(false)

  const totalCount = classes.reduce((sum, cls) => sum + cls.students.length, 0)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openDeleteModal(studentId: string, name: string, grade: number) {
    setDeleteModal({ studentId, name, grade })
    setSelectedReason('')
    setOtherText('')
  }

  function closeDeleteModal() {
    setDeleteModal(null)
    setSelectedReason('')
    setOtherText('')
  }

  async function confirmDelete() {
    if (!deleteModal) return
    const reason = selectedReason === 'Другое' ? (otherText.trim() || 'Другое') : selectedReason
    if (!reason) return

    setLoadingId(deleteModal.studentId)
    setError(null)
    const res = await deleteStudent(deleteModal.studentId, reason)
    if (res.error) {
      setError(res.error)
    } else {
      setClasses((prev) => prev.map((cls) => ({
        ...cls,
        students: cls.students.filter((s) => s.id !== deleteModal.studentId),
      })))
      setShowMinus(true)
      setTimeout(() => setShowMinus(false), 2500)
    }
    setLoadingId(null)
    closeDeleteModal()
  }

  async function handleGraduateClass(classId: string, name: string) {
    if (!confirm(`Выпустить класс «${name}»?\nВсе ученики будут отмечены как выпускники, класс будет удалён.`)) return
    setLoadingId(classId)
    setError(null)
    const res = await graduateClass(classId)
    if (res.error) { setError(res.error) } else {
      setClasses((prev) => prev.filter((cls) => cls.id !== classId))
    }
    setLoadingId(null)
  }

  async function handleDeleteClass(classId: string, name: string) {
    if (!confirm(`Удалить класс «${name}»? Это действие нельзя отменить.`)) return
    setLoadingId(classId)
    setError(null)
    const res = await deleteClass(classId)
    if (res.error) { setError(res.error) } else {
      setClasses((prev) => prev.filter((cls) => cls.id !== classId))
    }
    setLoadingId(null)
  }

  const filtered = classes.map((cls) => ({
    ...cls,
    students: cls.students.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase())),
  })).filter((cls) => search === '' || cls.students.length > 0)

  const canConfirm = selectedReason !== '' && (selectedReason !== 'Другое' || otherText.trim() !== '')

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-gray-900">{totalCount}</span>
              <span className="text-sm text-gray-400">учеников</span>
            </div>
            <div className="h-4 mt-0.5">
              {showMinus && (
                <span className="text-xs font-semibold text-red-500">−1 ученик удалён</span>
              )}
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени ученика..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{error}</div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Ученики не найдены</div>
        )}

        {filtered.map((cls, idx) => {
          const isOpen = expanded.has(cls.id)
          const colorClass = CLASS_COLORS[idx % CLASS_COLORS.length]

          const riskCount   = cls.students.filter((s) => atRiskSet.has(s.id)).length
          const totalObs    = cls.students.reduce((sum, s) => sum + s.obs_count, 0)
          const totalAlerts = cls.students.reduce((sum, s) => sum + s.alert_count, 0)

          return (
            <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              {/* ── Mobile card layout ── */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50" onClick={() => toggle(cls.id)}>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0', colorClass)}>
                    {cls.name}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{cls.name} класс</span>
                    <span className="text-xs text-gray-400 ml-2">{cls.students.length} уч.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {riskCount > 0 && (
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{riskCount} риск</span>
                    )}
                    {totalAlerts > 0 && (
                      <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{totalAlerts} тр.</span>
                    )}
                    {canDelete && (
                      <div className="flex gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                        {(cls.grade === 11 || cls.grade === 12) && (
                          <button onClick={() => handleGraduateClass(cls.id, cls.name)} disabled={loadingId === cls.id} className="p-1.5 text-gray-400 active:text-yellow-500 rounded-lg">
                            <GraduationCap className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteClass(cls.id, cls.name)} disabled={loadingId === cls.id} className="p-1.5 text-gray-400 active:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </div>

                {isOpen && cls.students.map((student) => {
                  const initials = student.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                  const isAtRisk = atRiskSet.has(student.id)
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 cursor-pointer active:bg-gray-50"
                      onClick={() => router.push(`/students/${student.id}`)}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-full flex-shrink-0 overflow-hidden',
                        !student.photo_url && (isAtRisk ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'),
                        !student.photo_url && 'flex items-center justify-center text-xs font-semibold'
                      )}>
                        {student.photo_url ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{student.full_name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isAtRisk ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                              <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />Риск
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                              <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />Норма
                            </span>
                          )}
                          {student.obs_count > 0 && <span className="text-[10px] text-gray-400">{student.obs_count} набл.</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {student.alert_count > 0 && <span className="text-xs font-semibold text-red-500">⚠ {student.alert_count}</span>}
                        {canDelete && (
                          <button
                            onClick={() => openDeleteModal(student.id, student.full_name, cls.grade)}
                            disabled={loadingId === student.id}
                            className="p-1.5 text-gray-300 active:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {isOpen && cls.students.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-6 border-t border-gray-50">Нет учеников</div>
                )}
              </div>

              {/* ── Desktop table layout ── */}
              <div className="hidden sm:block">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <tbody>
                    <tr className="group/cls cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => toggle(cls.id)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0', colorClass)}>
                            {cls.name}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{cls.name} класс</span>
                            <span className="text-xs text-gray-400 ml-2">{cls.students.length} уч.</span>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-medium text-gray-400 mb-1">В зоне риска</div>
                        {riskCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />{riskCount}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-[10px] font-medium text-gray-400 mb-1">Наблюдения</div>
                        <span className={cn('text-sm font-semibold', totalObs === 0 ? 'text-gray-200' : 'text-gray-700')}>{totalObs}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-[10px] font-medium text-gray-400 mb-1">Тревожные</div>
                        {totalAlerts > 0 ? <span className="text-sm font-semibold text-red-500">{totalAlerts}</span> : <span className="text-xs text-gray-200">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {canDelete && (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover/cls:opacity-100">
                            {(cls.grade === 11 || cls.grade === 12) && (
                              <button onClick={() => handleGraduateClass(cls.id, cls.name)} disabled={loadingId === cls.id} title="Выпустить класс" className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-all">
                                <GraduationCap className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteClass(cls.id, cls.name)} disabled={loadingId === cls.id} title="Удалить класс" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isOpen && cls.students.length > 0 && (
                      <tr className="bg-gray-50/70 border-t border-gray-100">
                        <th className="text-left text-[11px] font-medium text-gray-400 px-5 py-2">Ученик</th>
                        <th className="text-left text-[11px] font-medium text-gray-400 px-6 py-2">Статус</th>
                        <th className="text-center text-[11px] font-medium text-gray-400 px-6 py-2">Наблюдения</th>
                        <th className="text-right text-[11px] font-medium text-gray-400 px-6 py-2">Тревожные</th>
                        <th className="px-5 py-2"></th>
                      </tr>
                    )}

                    {isOpen && cls.students.map((student) => {
                      const initials = student.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                      const isAtRisk = atRiskSet.has(student.id)
                      return (
                        <tr key={student.id} className="border-t border-gray-50 hover:bg-gray-50/50 group/row cursor-pointer" onClick={() => router.push(`/students/${student.id}`)}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-8 h-8 rounded-full flex-shrink-0 overflow-hidden', !student.photo_url && (isAtRisk ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'), !student.photo_url && 'flex items-center justify-center text-xs font-semibold')}>
                                {student.photo_url ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" /> : initials}
                              </div>
                              <span className="text-sm font-medium text-gray-900 group-hover/row:text-blue-600 transition-colors truncate">{student.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            {isAtRisk ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />В зоне риска
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Норма
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={cn('text-xs font-medium', student.obs_count === 0 ? 'text-gray-300' : 'text-gray-600')}>{student.obs_count}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {student.alert_count > 0 ? <span className="text-xs font-medium text-red-500">{student.alert_count}</span> : <span className="text-xs text-gray-200">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {canDelete && (
                              <button onClick={() => openDeleteModal(student.id, student.full_name, cls.grade)} disabled={loadingId === student.id} title="Удалить ученика" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/row:opacity-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}

                    {isOpen && cls.students.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-sm text-gray-400 py-6 border-t border-gray-50">Нет учеников</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )
        })}
      </div>

      {/* ── Departure reason modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-semibold text-gray-900 mb-1">Причина ухода</h2>
            <p className="text-sm text-gray-500 mb-5">
              Укажите причину ухода ученика <span className="font-medium text-gray-700">{deleteModal.name}</span>
            </p>

            <div className="space-y-2.5 mb-5">
              {getDepartureReasons(deleteModal.grade).map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                    selectedReason === reason
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name="departure_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{reason}</span>
                </label>
              ))}

              {selectedReason === 'Другое' && (
                <textarea
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Опишите причину..."
                  rows={3}
                  className="w-full mt-1 px-4 py-3 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                  autoFocus
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={!canConfirm || loadingId === deleteModal.studentId}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {loadingId === deleteModal.studentId ? 'Удаление...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
