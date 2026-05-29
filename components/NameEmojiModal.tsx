'use client'

import { motion } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

// The full emoji picker (search + all emojis). Loaded on demand, client-only.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-sm text-black/40">טוען אימוג&apos;ים...</div>,
})

interface NameEmojiModalProps {
  title: string
  submitLabel: string
  namePlaceholder?: string
  initialName?: string
  initialEmoji?: string
  onSubmit: (name: string, emoji: string) => void
  onClose: () => void
  // When provided, renders a delete button (edit mode).
  onDelete?: () => void
}

export default function NameEmojiModal({
  title,
  submitLabel,
  namePlaceholder = 'שם',
  initialName = '',
  initialEmoji = '🎉',
  onSubmit,
  onClose,
  onDelete,
}: NameEmojiModalProps) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [showPicker, setShowPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed, emoji || initialEmoji)
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

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Name + emoji trigger */}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowPicker(v => !v)}
            aria-label="בחירת אימוג'י"
            className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gray-50 border flex items-center justify-center text-xl transition-colors ${
              showPicker ? 'border-[#FFB74D] ring-2 ring-[#FFB74D]/40' : 'border-gray-200 hover:bg-gray-100'
            }`}
          >
            {emoji}
          </button>
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

        {/* Full emoji picker (toggled) */}
        {showPicker && (
          <div className="flex justify-center" dir="ltr">
            <EmojiPicker
              onEmojiClick={(data: { emoji: string }) => {
                setEmoji(data.emoji)
                setShowPicker(false)
                inputRef.current?.focus()
              }}
              width="100%"
              height={320}
              previewConfig={{ showPreview: false }}
              searchPlaceHolder="חיפוש"
              lazyLoadEmojis
            />
          </div>
        )}

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
