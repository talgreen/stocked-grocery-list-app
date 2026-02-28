"use client"

import { useMemo, useState } from 'react'

import { type RepeatSuggestion } from '@/lib/repeat-suggester'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Clock, Plus } from 'lucide-react'
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
  if (days < 1.5) return 'פעם ביום'
  if (days < 14) return `כל ${Math.max(1, Math.round(days))} ימים`
  if (days < 60) return `כל ${Math.max(1, Math.round(days / 7))} שבועות`
  if (days < 365) return `כל ${Math.max(1, Math.round(days / 30))} חודשים`
  return `כל ${Math.max(1, Math.round(days / 365))} שנים`
}

const formatAgo = (days: number) => {
  if (!Number.isFinite(days) || days <= 0.75) return 'היום'
  if (days < 2) return 'אתמול'
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
  // Default to collapsed (closed) state
  const [isCollapsed, setIsCollapsed] = useState(true)

  const previewItems = useMemo(() => {
    return suggestions.slice(0, 3).map(s => s.item.name)
  }, [suggestions])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      dir="rtl"
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
    >
      {/* Collapsed Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsCollapsed(value => !value)}
        className="flex w-full items-center gap-3 p-3 text-right transition-colors hover:bg-neutral-50"
      >
        {/* Icon with count badge */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-500">
            <path
              d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            {suggestions.length}
          </span>
        </div>

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-800">קניות חוזרות</span>
          </div>
          {isCollapsed && previewItems.length > 0 && (
            <p className="truncate text-xs text-neutral-500">
              {previewItems.join('، ')}
              {suggestions.length > 3 && ` ועוד ${suggestions.length - 3}...`}
            </p>
          )}
        </div>

        {/* Expand/collapse chevron */}
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="border-t border-neutral-100 p-3">
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={`${suggestion.categoryId}-${suggestion.item.id}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    className="group flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
                  >
                    {/* Category emoji */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                      {suggestion.categoryEmoji}
                    </div>

                    {/* Item info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {suggestion.item.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatInterval(suggestion.expectedGapDays)} · {formatAgo(suggestion.daysSinceLastPurchase)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white hover:text-neutral-600"
                            aria-label="השהה פריט"
                          >
                            <Clock className="h-4 w-4" />
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

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUncheck(suggestion.categoryId, suggestion.item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm transition-colors hover:bg-amber-600"
                        aria-label="הוסף לרשימה"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <p className="mt-3 text-center text-[11px] text-neutral-400">
                מבוסס על היסטוריית הקניות שלך
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
