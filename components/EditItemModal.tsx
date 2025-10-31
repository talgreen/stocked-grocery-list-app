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
import { toast } from 'sonner'

interface EditItemModalProps {
  item: Item
  currentCategoryId: number
  categories: Category[]
  onSave: (
    itemId: number,
    name: string,
    comment: string,
    categoryId: number,
    quantity: number | null,
    unit: string | null,
    price: number | null
  ) => void
  onClose: () => void
}

export default function EditItemModal({ item, currentCategoryId, categories, onSave, onClose }: EditItemModalProps) {
  const [name, setName] = useState(item.name)
  const [comment, setComment] = useState(item.comment || '')
  const [categoryId, setCategoryId] = useState(currentCategoryId.toString())
  const [quantity, setQuantity] = useState(item.quantity != null ? item.quantity.toString() : '')
  const [unit, setUnit] = useState(item.unit || '')
  const [price, setPrice] = useState(item.price != null ? item.price.toString() : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeTab } = useTabView()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    const normalizedQuantity = quantity.trim()
      ? parseFloat(quantity.replace(',', '.'))
      : null
    const normalizedPrice = price.trim()
      ? parseFloat(price.replace(',', '.'))
      : null

    if (normalizedQuantity !== null && Number.isNaN(normalizedQuantity)) {
      toast.error('כמות לא תקינה')
      return
    }

    if (normalizedPrice !== null && Number.isNaN(normalizedPrice)) {
      toast.error('מחיר לא תקין')
      return
    }

    onSave(
      item.id,
      name.trim(),
      comment.trim(),
      parseInt(categoryId),
      normalizedQuantity,
      unit.trim() || null,
      normalizedPrice
    )
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                כמות
              </label>
              <input
                type="text"
                id="edit-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
                placeholder="לדוגמה: 2 או 0.5"
              />
            </div>
            <div>
              <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                יחידת מידה
              </label>
              <input
                type="text"
                id="edit-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
                placeholder={'יחידה, ק"ג, ליטר'}
              />
            </div>
            <div>
              <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                מחיר משוער (₪)
              </label>
              <input
                type="text"
                id="edit-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
                placeholder="לדוגמה: 12.90"
              />
            </div>
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