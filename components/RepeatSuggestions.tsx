"use client"

import { type RepeatSuggestion } from '@/lib/repeat-suggester'
import { motion } from 'framer-motion'
import { Clock, Undo2 } from 'lucide-react'
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
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]

const formatInterval = (days: number) => {
  if (!Number.isFinite(days) || days <= 0) return '~a few days'
  if (days < 1.5) return '~1 day'
  if (days < 14) return `~${Math.max(1, Math.round(days))} days`
  if (days < 60) return `~${Math.max(1, Math.round(days / 7))} weeks`
  if (days < 365) return `~${Math.max(1, Math.round(days / 30))} months`
  return `~${Math.max(1, Math.round(days / 365))} years`
}

const formatAgo = (days: number) => {
  if (!Number.isFinite(days) || days <= 0.75) return 'today'
  if (days < 2) return '1 day ago'
  if (days < 28) return `${Math.max(1, Math.round(days))} days ago`
  if (days < 84) return `${Math.max(1, Math.round(days / 7))} weeks ago`
  if (days < 730) return `${Math.max(1, Math.round(days / 30))} months ago`
  return `${Math.max(1, Math.round(days / 365))} years ago`
}

const formatScore = (score: number) => `${Math.round(score * 100)}% match`

export default function RepeatSuggestions({
  suggestions,
  onUncheck,
  onSnooze,
}: RepeatSuggestionsProps) {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white/90 border border-[#FFB74D]/40 shadow-sm rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-[#FF9800]">
          <SparkleIcon />
          <h2 className="text-base font-semibold text-black/80">Quick Uncheck</h2>
        </div>
        <span className="text-xs text-black/50">Smart repeat suggestions</span>
      </div>

      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <motion.div
            key={`${suggestion.categoryId}-${suggestion.item.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-3 rounded-xl border border-[#FFB74D]/30 bg-[#FFF8EF] p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-right sm:text-right justify-end sm:justify-start">
                <span className="text-sm font-semibold text-black/80 truncate max-w-[200px] sm:max-w-[240px]">
                  {suggestion.item.name}
                </span>
                <span className="text-xs text-black/50 truncate">
                  {suggestion.categoryEmoji} {suggestion.categoryName}
                </span>
                <span className="text-xs font-medium text-[#FF9800]">
                  {formatScore(suggestion.score)}
                </span>
              </div>
              <p className="text-xs text-black/60">
                {`Usually every ${formatInterval(suggestion.expectedGapDays)}; last bought ${formatAgo(suggestion.daysSinceLastPurchase)}.`}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded-lg border border-[#FFB74D]/40 bg-white px-3 py-1 text-xs font-medium text-[#FF9800] hover:bg-[#FFE5C2] transition-colors">
                    <Clock className="h-4 w-4" />
                    Snooze
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SNOOZE_OPTIONS.map(option => (
                    <DropdownMenuItem
                      key={option.days}
                      onSelect={() => onSnooze(suggestion.categoryId, suggestion.item.id, option.days)}
                    >
                      Snooze {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onUncheck(suggestion.categoryId, suggestion.item.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#FFB74D] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#FFA43A] transition-colors"
              >
                <Undo2 className="h-4 w-4" />
                Uncheck
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
