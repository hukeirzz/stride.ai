'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SmilePlus } from 'lucide-react'
import type { ReactionEmoji } from '@/types'

// The 7 reactions, in picker order. Keep emoji + short Russian label.
const REACTIONS: { id: ReactionEmoji; emoji: string; label: string }[] = [
  { id: 'thumbs_up',   emoji: '👍', label: 'Нравится' },
  { id: 'thumbs_down', emoji: '👎', label: 'Не нравится' },
  { id: 'laugh',       emoji: '😂', label: 'Смех' },
  { id: 'surprised',   emoji: '😮', label: 'Удивление' },
  { id: 'sad',         emoji: '😢', label: 'Грусть' },
  { id: 'angry',       emoji: '😡', label: 'Злость' },
  { id: 'clap',        emoji: '👏', label: 'Аплодисменты' },
]
const EMOJI: Record<ReactionEmoji, string> = Object.fromEntries(
  REACTIONS.map((r) => [r.id, r.emoji])
) as Record<ReactionEmoji, string>
const LABEL: Record<ReactionEmoji, string> = Object.fromEntries(
  REACTIONS.map((r) => [r.id, r.label])
) as Record<ReactionEmoji, string>

export interface ReactionItem {
  emoji: ReactionEmoji
  user_id: string
  user?: { full_name: string } | null
}

export function ReactionBar({
  observationId,
  currentUserId,
  initial,
}: {
  observationId: string
  currentUserId: string
  initial: ReactionItem[]
}) {
  const [reactions, setReactions] = useState<ReactionItem[]>(initial)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pending, setPending] = useState<ReactionEmoji | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close the picker on outside click / Escape
  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  // Group reactions by emoji, preserving first-seen order.
  const groups: { emoji: ReactionEmoji; items: ReactionItem[]; mine: boolean }[] = []
  for (const r of reactions) {
    let g = groups.find((x) => x.emoji === r.emoji)
    if (!g) {
      g = { emoji: r.emoji, items: [], mine: false }
      groups.push(g)
    }
    g.items.push(r)
    if (r.user_id === currentUserId) g.mine = true
  }

  async function toggle(emoji: ReactionEmoji) {
    if (pending) return
    // Each user has at most one reaction per observation.
    const myCurrent = reactions.find((r) => r.user_id === currentUserId)?.emoji ?? null
    const removing = myCurrent === emoji // clicking your own reaction removes it
    setPickerOpen(false)
    setPending(emoji)

    // Optimistic update: drop my existing reaction, then add the new one (unless removing)
    const snapshot = reactions
    const withoutMine = reactions.filter((r) => r.user_id !== currentUserId)
    setReactions(
      removing
        ? withoutMine
        : [...withoutMine, { emoji, user_id: currentUserId, user: { full_name: 'Вы' } }]
    )

    const supabase = createClient()
    const { error } = removing
      ? await supabase
          .from('observation_reactions')
          .delete()
          .eq('observation_id', observationId)
          .eq('user_id', currentUserId)
      : await supabase
          .from('observation_reactions')
          .upsert(
            { observation_id: observationId, user_id: currentUserId, emoji },
            { onConflict: 'observation_id,user_id' }
          )

    if (error) setReactions(snapshot) // revert on failure
    setPending(null)
  }

  function tooltip(g: { items: ReactionItem[]; mine: boolean }) {
    const names = g.items
      .filter((i) => i.user_id !== currentUserId)
      .map((i) => i.user?.full_name)
      .filter(Boolean) as string[]
    const parts = g.mine ? ['Вы', ...names] : names
    return parts.join(', ')
  }

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center gap-1 mt-1.5">
      {groups.map((g) => (
        <button
          key={g.emoji}
          type="button"
          onClick={() => toggle(g.emoji)}
          title={`${LABEL[g.emoji]} · ${tooltip(g)}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs leading-none transition-colors',
            g.mine
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
          )}
        >
          <span className="text-sm leading-none">{EMOJI[g.emoji]}</span>
          <span className="tabular-nums font-medium">{g.items.length}</span>
        </button>
      ))}

      {/* Add-reaction button */}
      <button
        type="button"
        onClick={() => setPickerOpen((o) => !o)}
        title="Добавить реакцию"
        aria-label="Добавить реакцию"
        className={cn(
          'inline-flex items-center justify-center rounded-full border w-6 h-6 transition-colors',
          pickerOpen
            ? 'border-blue-200 bg-blue-50 text-blue-600'
            : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600'
        )}
      >
        <SmilePlus className="w-3.5 h-3.5" />
      </button>

      {/* Picker popover */}
      {pickerOpen && (
        <div className="absolute bottom-full left-0 z-20 mb-1.5 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-lg">
          {REACTIONS.map((r) => {
            const mine = reactions.some((x) => x.emoji === r.id && x.user_id === currentUserId)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                title={r.label}
                aria-label={r.label}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-gray-100',
                  mine && 'bg-blue-50 ring-1 ring-blue-200'
                )}
              >
                {r.emoji}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
