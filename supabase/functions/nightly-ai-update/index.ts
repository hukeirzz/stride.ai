import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
const supabase  = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const SECTIONS = ['overview','interests','performance','activity','achievements','psychology'] as const
type Section = typeof SECTIONS[number]
const NO_DATA = 'Данных пока недостаточно.'

const SECTION_RU: Record<Section, string> = {
  overview: 'Обзор', interests: 'Интересы', performance: 'Успеваемость',
  activity: 'Активность', achievements: 'Достижения', psychology: 'Психология',
}

Deno.serve(async (req) => {
  // Allow only POST from Supabase cron (or authorized caller)
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    // Bishkek = UTC+6. Yesterday 21:00 Bishkek = yesterday 15:00 UTC
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Fetch all manual observations added since yesterday 21:00
    const { data: newObs, error: obsErr } = await supabase
      .from('observations')
      .select('id, student_id, content, students!inner(full_name, school_id)')
      .eq('source', 'manual')
      .gte('created_at', since)

    if (obsErr) throw obsErr
    if (!newObs || newObs.length === 0) {
      return new Response(JSON.stringify({ message: 'No new observations' }), { status: 200 })
    }

    // Group observations by student
    const byStudent = new Map<string, { fullName: string; obsTexts: string[] }>()
    for (const o of newObs) {
      const student = o.students as { full_name: string; school_id: string }
      if (!byStudent.has(o.student_id)) {
        byStudent.set(o.student_id, { fullName: student.full_name, obsTexts: [] })
      }
      byStudent.get(o.student_id)!.obsTexts.push(o.content)
    }

    let updatedStudents = 0

    // Process each student in parallel
    await Promise.allSettled(
      Array.from(byStudent.entries()).map(async ([studentId, { fullName, obsTexts }]) => {
        // Fetch current summaries
        const { data: currentRows } = await supabase
          .from('student_ai_summaries')
          .select('section, content')
          .eq('student_id', studentId)

        const current: Partial<Record<Section, string>> = {}
        for (const row of currentRows ?? []) {
          current[row.section as Section] = row.content
        }

        const currentText = SECTIONS
          .map(s => `${SECTION_RU[s]}: ${current[s] ?? NO_DATA}`)
          .join('\n')

        const obsText = obsTexts.map((o, i) => `${i + 1}. ${o}`).join('\n\n')

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Ты опытный классный руководитель. На основе новых наблюдений обнови только те разделы профиля ученика которые затрагивают эти наблюдения. Пиши на русском, 2-3 предложения на раздел.

Ученик: ${fullName}

Текущие сводки:
${currentText}

Новые наблюдения:
${obsText}

Разделы профиля (ключи для JSON): overview, interests, performance, activity, achievements, psychology.

Ответь ТОЛЬКО валидным JSON без markdown, только с обновлёнными разделами:
{"section_key":"обновлённая сводка"}`,
          }],
        })

        const text = (response.content[0] as { type: string; text: string }).text.trim()
        const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        const updates = JSON.parse(json) as Partial<Record<Section, string>>

        const rows = Object.entries(updates)
          .filter(([k]) => SECTIONS.includes(k as Section))
          .map(([section, content]) => ({
            student_id: studentId,
            section,
            content,
            updated_at: new Date().toISOString(),
          }))

        if (rows.length > 0) {
          await supabase
            .from('student_ai_summaries')
            .upsert(rows, { onConflict: 'student_id,section' })
          updatedStudents++
        }
      })
    )

    return new Response(
      JSON.stringify({ message: `Updated ${updatedStudents} students` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
