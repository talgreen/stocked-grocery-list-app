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
import { X } from 'lucide-react'
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
    inputRef.current?.focus()
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    onSave(item.id, name.trim(), comment.trim(), parseInt(categoryId))
    onClose()
  }

  return (
    <div className="relative text-right h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold">ערוך פריט</h2>
        <div className="w-6" /> {/* Spacer for alignment */}
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
              שם הפריט
            </label>
            <input
              ref={inputRef}
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
              placeholder="שם הפריט"
              required
            />
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
              הערה (אופציונלי)
            </label>
            <input
              type="text"
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
              placeholder="הוסף הערה"
            />
          </div>

          {activeTab !== 'pharmacy' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                קטגוריה
              </label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
              >
                <SelectTrigger className="w-full flex flex-row-reverse justify-between items-center text-lg py-3">
                  <SelectValue placeholder="בחר קטגוריה" className="text-right" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()} className="flex flex-row-reverse">
                      {category.name} {category.emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-auto mb-6">
          <motion.button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-4 rounded-xl transition-colors duration-200 text-lg"
            whileTap={{ scale: 0.98 }}
          >
            בטל
          </motion.button>
          <motion.button
            type="submit"
            disabled={!name.trim() || !categoryId}
            className="flex-1 bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-4 rounded-xl transition-colors duration-200 disabled:opacity-50 text-lg"
            whileTap={{ scale: 0.98 }}
          >
            שמור
          </motion.button>
        </div>
      </form>
    </div>
  )
} 