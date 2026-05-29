'use client'

import { motion } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface NameEmojiModalProps {
  title: string
  submitLabel: string
  namePlaceholder?: string
  initialName?: string
  initialEmoji?: string
  emojiPalette?: string[]
  onSubmit: (name: string, emoji: string) => void
  onClose: () => void
  // When provided, renders a delete button (edit mode).
  onDelete?: () => void
}

const DEFAULT_PALETTE = ['🎉', '🧳', '🏖️', '🎂', '🎄', '🏕️', '🎁', '🛠️', '🏠', '🐶', '👶', '📦']

export default function NameEmojiModal({
  title,
  submitLabel,
  namePlaceholder = 'שם',
  initialName = '',
  initialEmoji,
  emojiPalette = DEFAULT_PALETTE,
  onSubmit,
  onClose,
  onDelete,
}: NameEmojiModalProps) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji || emojiPalette[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed, emoji.trim() || emojiPalette[0])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden text-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5">
        <h2 className="text-base font-bold text-black/80">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-black/40" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Name + selected emoji */}
        <div className="flex gap-2 items-center">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-xl">
            {emoji}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]"
            required
          />
        </div>

        {/* Emoji palette */}
        <div className="flex flex-wrap gap-2">
          {emojiPalette.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEmoji(option)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                emoji === option ? 'bg-[#FFB74D]/20 ring-2 ring-[#FFB74D]' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {option}
            </button>
          ))}
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            aria-label="אימוג'י מותאם"
            className="w-12 h-9 rounded-lg bg-gray-50 border border-gray-200 text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/50"
            maxLength={4}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-orange-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitLabel}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex-shrink-0 p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              title="מחיקה"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
