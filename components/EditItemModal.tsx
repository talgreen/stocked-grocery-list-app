'use client'

import { useTabView } from '@/contexts/TabViewContext'
import { Category } from '@/types/categories'
import type { Item } from '@/types/item'
import { motion } from 'framer-motion'
import { Pencil, Save, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ItemFormFields from './ItemFormFields'

interface EditItemModalProps {
  item: Item
  currentCategoryId: number
  categories: Category[]
  onSave: (itemId: number, name: string, comment: string, categoryId: number, quantity?: number | null) => void
  onClose: () => void
}

export default function EditItemModal({ item, currentCategoryId, categories, onSave, onClose }: EditItemModalProps) {
  const [name, setName] = useState(item.name)
  const [comment, setComment] = useState(item.comment || '')
  const [quantity, setQuantity] = useState(item.quantity ? item.quantity.toString() : '')
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

    const parsedQuantity = quantity ? parseInt(quantity) : null
    onSave(item.id, name.trim(), comment.trim(), parseInt(categoryId), parsedQuantity)
    onClose()
  }

  const filteredCategories = categories.filter(cat =>
    activeTab === 'pharmacy' ? cat.name === 'בית מרקחת' : cat.name !== 'בית מרקחת'
  )

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
        <ItemFormFields
          ref={inputRef}
          itemName={name}
          onItemNameChange={setName}
          comment={comment}
          onCommentChange={setComment}
          quantity={quantity}
          onQuantityChange={setQuantity}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={filteredCategories}
          showCategorySelector={activeTab !== 'pharmacy'}
          showSmartOption={false}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
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
