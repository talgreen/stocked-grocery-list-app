'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTabView } from '@/contexts/TabViewContext'
import { Category } from '@/types/categories'
import type { Item } from '@/types/item'
import { motion } from 'framer-motion'
import { Pencil, Save, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface EditItemModalProps {
  item: Item
  currentCategoryId: number
  categories: Category[]
  onSave: (itemId: number, name: string, comment: string, categoryId: number) => void
  onClose: () => void
}

export default function EditItemModal({ item, currentCategoryId, categories, onSave, onClose }: EditItemModalProps) {
  const [name, setName] = useState(item.name)
  const [comment, setComment] = useState(item.comment || '')
  const [categoryId, setCategoryId] = useState(currentCategoryId.toString())
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeTab } = useTabView()

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    onSave(item.id, name.trim(), comment.trim(), parseInt(categoryId))
    onClose()
  }

  return (
    <div className="relative text-right flex flex-col">
      {/* Decorative Sparkle */}
      <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-5 h-5 text-[#FFB74D]" />
        </motion.div>
      </div>

      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </motion.button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-[#FFB74D] to-[#FFA726] w-9 h-9 rounded-lg flex items-center justify-center shadow-md shadow-orange-200/50">
            <Pencil className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        <div className="w-7" />
      </div>

      {/* Title */}
      <h2 className="text-base font-bold text-gray-800 text-center mb-3">ערוך פריט</h2>

      <form onSubmit={handleSave} className="flex flex-col gap-2">
        {/* Item Name + Category Row */}
        <div className="flex gap-2">
          {/* Item Name */}
          <div className="relative flex-[2]">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-right text-sm transition-all"
              placeholder="שם הפריט"
              required
            />
            {name.trim() && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute left-2 top-1/2 -translate-y-1/2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </motion.div>
            )}
          </div>

          {/* Category */}
          {activeTab !== 'pharmacy' && (
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="flex-1 flex-row-reverse justify-between items-center text-sm py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]">
                <SelectValue>
                  <span className="text-sm">
                    {categories.find(c => c.id.toString() === categoryId)?.emoji}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => activeTab === 'pharmacy' ? cat.name === 'בית מרקחת' : cat.name !== 'בית מרקחת')
                  .map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.emoji} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Comment - Always visible */}
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-right text-sm transition-all"
          placeholder="הערה (אופציונלי)"
        />

        {/* Action Buttons - Compact */}
        <div className="flex gap-2 pt-2">
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 px-4 rounded-xl transition-all"
          >
            בטל
          </motion.button>
          <motion.button
            type="submit"
            disabled={!name.trim() || !categoryId}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-orange-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/30"
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            />
            <span className="relative flex items-center justify-center gap-1.5 text-sm">
              <Save className="w-4 h-4" />
              <span>שמור</span>
            </span>
          </motion.button>
        </div>
      </form>
    </div>
  )
}
