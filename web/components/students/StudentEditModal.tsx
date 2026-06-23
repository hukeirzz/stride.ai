'use client'

import { useState, useRef } from 'react'
import { Pencil, X, Camera } from 'lucide-react'
import { updateStudent } from '@/app/(dashboard)/students/[id]/actions'

interface Props {
  student: {
    id: string
    full_name: string
    parent_name?: string | null
    parent_phone?: string | null
    photo_url?: string | null
    class_id?: string | null
  }
  classes: { id: string; name: string }[]
}

export function StudentEditModal({ student, classes }: Props) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(student.full_name)
  const [parentName, setParentName] = useState(student.parent_name ?? '')
  const [phone, setPhone] = useState(student.parent_phone ?? '')
  const [classId, setClassId] = useState(student.class_id ?? '')
  const [preview, setPreview] = useState<string | null>(student.photo_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const fileData = useRef<File | null>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    fileData.current = file
    setPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function handleClose() {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    fileData.current = null
    setOpen(false)
  }

  async function handleSave() {
    if (!fullName.trim()) { setError('Введите ФИО'); return }
    setLoading(true)
    setError('')

    let fd: FormData | undefined
    if (fileData.current) {
      fd = new FormData()
      fd.append('photo', fileData.current)
    }

    const res = await updateStudent(student.id, fullName.trim(), parentName.trim(), phone.trim(), classId, fd)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    handleClose()
  }

  const initials = fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-2.5 py-2 sm:px-3 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Редактировать</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Редактировать профиль</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview
                    ? <img src={preview} alt="" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ФИО ученика</label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  placeholder="Фамилия Имя Отчество"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Класс</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
                >
                  <option value="">— Не указан —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ФИО родителя</label>
                <input
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  placeholder="Фамилия Имя Отчество"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Номер родителя</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  placeholder="+996 700 000 000"
                  type="tel"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
