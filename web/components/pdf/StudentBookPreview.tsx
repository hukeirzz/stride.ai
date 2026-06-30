'use client'

import { PDFViewer } from '@react-pdf/renderer'
import { StudentBookDocument } from '@/lib/pdf/StudentBookDocument'
import type { BookData } from '@/lib/pdf/types'

// Реальный предпросмотр сгенерированного PDF (прокрутка по страницам).
// Грузится динамически (ssr: false), чтобы react-pdf не попадал в основной бандл.
export function StudentBookPreview({ data }: { data: BookData }) {
  return (
    <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none' }}>
      <StudentBookDocument data={data} />
    </PDFViewer>
  )
}
