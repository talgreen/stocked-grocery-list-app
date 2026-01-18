"use client"

import { useMemo, useState } from 'react'

import { type NextRunSuggestion } from '@/lib/repeat-suggester'
import { motion } from 'framer-motion'
import { CalendarClock, ChevronDown, ChevronUp, Lightbulb, Timer, Undo2 } from 'lucide-react'
import SparkleIcon from './SparkleIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface NextRunPlannerProps {
  suggestions: NextRunSuggestion[]
  onPromote: (categoryId: number, itemId: number) => void
  onSnooze: (categoryId: number, itemId: number, days: number) => void
}

const SNOOZE_OPTIONS = [
  { label: 'שבוע', days: 7 },
  { label: 'שבועיים', days: 14 },
  { label: 'חודש', days: 30 },
]

const formatDueIn = (daysUntilDue: number) => {
  if (!Number.isFinite(daysUntilDue)) return 'לא ידוע'

  if (daysUntilDue <= 0) return 'מוכן לחזור כבר עכשיו'
  if (daysUntilDue <= 1) return 'בעוד יום בערך'
  if (daysUntilDue < 7) return `בעוד כ-${Math.max(1, Math.round(daysUntilDue))} ימים`
  if (daysUntilDue < 21) return `בעוד כ-${Math.max(1, Math.round(daysUntilDue / 7))} שבועות`
  return `בעוד כ-${Math.max(1, Math.round(daysUntilDue / 30))} חודשים`
}

const formatScoreLabel = (suggestion: NextRunSuggestion) => {
  if (suggestion.insightType === 'crowd') {
    return 'הבית אוהב את הפריט הזה'
  }
  if (suggestion.insightType === 'timing') {
    return 'הזמן כמעט הגיע'
  }
  return 'פריט שחוזר בקביעות'
}

export default function NextRunPlanner({
  suggestions,
  onPromote,
  onSnooze,
}: NextRunPlannerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const collapsedLabel = useMemo(() => {
    if (suggestions.length === 0) {
      return 'אין כרגע פריטים לסיבוב הבא'
    }
    if (suggestions.length === 1) {
      return 'הצעה אחת מוכנה לסיבוב הבא'
    }
    if (suggestions.length <= 4) {
      return `${suggestions.length} מועמדים לסיבוב הבא`
    }
    return 'כמה פריטים שכדאי להכין מראש'
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
      className="rounded-2xl border border-[#8C9EFF]/40 bg-[#F6F8FF] p-4 shadow-sm space-y-4"
    >
      <button
        type="button"
        onClick={() => setIsCollapsed(value => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1 text-right text-[#3F51B5] transition-colors hover:bg-[#E9EDFF]"
      >
        <div className="flex items-center gap-2 text-[#3F51B5]">
          <SparkleIcon />
          <h2 className="text-base font-semibold text-black/80">סיבוב הבא</h2>
        </div>
        <span className="flex items-center gap-1 text-xs text-black/60">
          {isCollapsed ? collapsedLabel : 'ניבוי חכם לפריטים שכנראה נצטרך שוב בקרוב'}
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </span>
      </button>

      {isCollapsed ? (
        <p className="px-2 text-xs text-black/60">לחיצה תציג את רשימת הפריטים המומלצים לסיבוב הבא.</p>
      ) : (
        <>
          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <motion.div
                key={`${suggestion.categoryId}-${suggestion.item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-3 rounded-xl border border-[#3F51B5]/10 bg-white p-3 text-right sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm font-semibold text-black/80">
                    <span className="max-w-[220px] truncate sm:max-w-[260px]">{suggestion.item.name}</span>
                    <span className="text-xs font-normal text-black/50">
                      {suggestion.categoryEmoji} {suggestion.categoryName}
                    </span>
                  </div>
                  <p className="text-xs text-[#3F51B5] font-medium flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {formatScoreLabel(suggestion)} · {formatDueIn(suggestion.daysUntilDue)}
                  </p>
                  <p className="text-[11px] text-black/60">
                    {suggestion.reason}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 self-stretch sm:self-auto sm:flex-row-reverse">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPromote(suggestion.categoryId, suggestion.item.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#3F51B5] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#32408F]"
                  >
                    <Undo2 className="h-4 w-4" />
                    הוסף לרשימה
                  </motion.button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-[#3F51B5]/30 bg-white px-3 py-1 text-xs font-medium text-[#3F51B5] transition-colors hover:bg-[#E9EDFF]">
                        <CalendarClock className="h-4 w-4" />
                        דלג לסיבוב שאחריו
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

          <p className="text-right text-[11px] text-black/45 flex items-center justify-end gap-1">
            <Lightbulb className="h-3.5 w-3.5" />
            ההמלצות מחושבות מקומית על בסיס היסטוריית הקניות המשותפת שלכם.
          </p>
        </>
      )}
    </motion.div>
  )
}
