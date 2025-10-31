"use client"

import { useMemo, useState } from 'react'

import { type RepeatSuggestion } from '@/lib/repeat-suggester'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Clock, Undo2 } from 'lucide-react'
import SparkleIcon from './SparkleIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface RepeatSuggestionsProps {
  suggestions: RepeatSuggestion[]
  onUncheck: (categoryId: number, itemId: number) => void
  onSnooze: (categoryId: number, itemId: number, days: number) => void
}

const SNOOZE_OPTIONS = [
  { label: '3 ימים', days: 3 },
  { label: 'שבוע', days: 7 },
  { label: 'שבועיים', days: 14 },
  { label: 'חודש', days: 30 },
]

const formatInterval = (days: number) => {
  if (!Number.isFinite(days) || days <= 0) return 'כל כמה ימים'
  if (days < 1.5) return 'בערך פעם ביום'
  if (days < 14) return `בערך כל ${Math.max(1, Math.round(days))} ימים`
  if (days < 60) return `בערך כל ${Math.max(1, Math.round(days / 7))} שבועות`
  if (days < 365) return `בערך כל ${Math.max(1, Math.round(days / 30))} חודשים`
  return `בערך כל ${Math.max(1, Math.round(days / 365))} שנים`
}

const formatAgo = (days: number) => {
  if (!Number.isFinite(days) || days <= 0.75) return 'היום'
  if (days < 2) return 'לפני יום'
  if (days < 28) return `לפני ${Math.max(1, Math.round(days))} ימים`
  if (days < 84) return `לפני ${Math.max(1, Math.round(days / 7))} שבועות`
  if (days < 730) return `לפני ${Math.max(1, Math.round(days / 30))} חודשים`
  return `לפני ${Math.max(1, Math.round(days / 365))} שנים`
}

export default function RepeatSuggestions({
  suggestions,
  onUncheck,
  onSnooze,
}: RepeatSuggestionsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const collapsedLabel = useMemo(() => {
    if (suggestions.length === 0) {
      return 'אין כרגע הצעות להוספה מהירה'
    }
    if (suggestions.length === 1) {
      return 'יש הצעה אחת להוספה מהירה'
    }
    if (suggestions.length <= 4) {
      return `${suggestions.length} הצעות מוכנות להוספה`
    }
    return 'כמה פריטים קבועים מוכנים לחזרה לרשימה'
  }, [suggestions.length])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      dir="rtl"
      className="bg-white/90 border border-[#FFB74D]/40 shadow-sm rounded-2xl p-4 space-y-4"
    >
      <button
        type="button"
        onClick={() => setIsCollapsed(value => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1 text-right text-[#FF9800] transition-colors hover:bg-[#FFF0DA]"
      >
        <div className="flex items-center gap-2 text-[#FF9800]">
          <SparkleIcon />
          <h2 className="text-base font-semibold text-black/80">הוספה מהירה</h2>
        </div>
        <span className="flex items-center gap-1 text-xs text-black/60">
          {isCollapsed ? collapsedLabel : 'הצעות חכמות לפריטים שחוזרים'}
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </span>
      </button>

      {isCollapsed ? (
        <p className="px-2 text-xs text-black/60">לחיצה תפתח את רשימת ההצעות להוספה מהירה.</p>
      ) : (
        <>
          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <motion.div
                key={`${suggestion.categoryId}-${suggestion.item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-3 rounded-xl border border-[#FFB74D]/30 bg-[#FFF8EF] p-3 text-right sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm font-semibold text-black/80">
                    <span className="max-w-[220px] truncate sm:max-w-[260px]">{suggestion.item.name}</span>
                    <span className="text-xs font-normal text-black/50">
                      {suggestion.categoryEmoji} {suggestion.categoryName}
                    </span>
                  </div>
                  <p className="text-xs text-black/60">
                    {`בדרך כלל ${formatInterval(suggestion.expectedGapDays)}; נקנה ${formatAgo(suggestion.daysSinceLastPurchase)}.`}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 self-stretch sm:self-auto sm:flex-row-reverse">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onUncheck(suggestion.categoryId, suggestion.item.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#FFB74D] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#FFA43A]"
                  >
                    <Undo2 className="h-4 w-4" />
                    החזר לרשימה
                  </motion.button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-[#FFB74D]/40 bg-white px-3 py-1 text-xs font-medium text-[#FF9800] transition-colors hover:bg-[#FFE5C2]">
                        <Clock className="h-4 w-4" />
                        השהה
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {SNOOZE_OPTIONS.map(option => (
                        <DropdownMenuItem
                          key={option.days}
                          onSelect={() => onSnooze(suggestion.categoryId, suggestion.item.id, option.days)}
                        >
                          {`השהה ל-${option.label}`}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-right text-[11px] text-black/40">
            ההצעות מבוססות על הרגלי הקנייה האישיים שלך ונשמרות מקומית בלבד.
          </p>
        </>
      )}
    </motion.div>
  )
}
