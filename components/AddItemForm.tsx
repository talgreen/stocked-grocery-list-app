'use client'

import { useTabView } from '@/contexts/TabViewContext'
import { Category } from '@/types/categories'
import { motion } from 'framer-motion'
import { Package, Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import ItemFormFields from './ItemFormFields'

interface AddItemFormProps {
  onAddBackground: (
    itemName: string,
    itemComment: string,
    categorySelection: string,
    activeTab: 'grocery' | 'pharmacy',
    quantity?: number | null
  ) => void
  onClose: () => void
  categories: Category[]
}

export default function AddItemForm({ onAddBackground, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState('')
  const [categoryId, setCategoryId] = useState('auto')
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeTab } = useTabView()

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const checkDuplicateItem = (name: string, itemComment: string = '') => {
    const trimmedName = name.trim().toLowerCase()
    const trimmedComment = itemComment.trim().toLowerCase()

    for (const category of categories) {
      if (activeTab === 'grocery' && category.name === 'בית מרקחת') continue
      if (activeTab === 'pharmacy' && category.name !== 'בית מרקחת') continue

      for (const categoryItem of category.items) {
        if (categoryItem.name.trim().toLowerCase() === trimmedName &&
            (categoryItem.comment || '').trim().toLowerCase() === trimmedComment) {
          return true
        }
      }
    }
    return false
  }

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim()) return

    if (checkDuplicateItem(item.trim(), comment.trim())) {
      toast.warning('הפריט כבר קיים ברשימה')
      onClose()
      return
    }

    const itemName = item.trim()
    const itemComment = comment.trim()
    const selectedCategory = categoryId
    const parsedQuantity = quantity ? parseInt(quantity) : null

    setItem('')
    setComment('')
    setQuantity('')
    setCategoryId('auto')
    onClose()
    onAddBackground(itemName, itemComment, selectedCategory, activeTab, parsedQuantity)
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
            <Package className="w-4 h-4 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow">
              <Plus className="w-2 h-2 text-[#FFB74D]" />
            </div>
          </div>
        </motion.div>

        <div className="w-7" />
      </div>

      {/* Title */}
      <h2 className="text-base font-bold text-gray-800 text-center mb-3">הוסף פריט חדש</h2>

      <form onSubmit={handleQuickAdd} className="flex flex-col gap-2">
        <ItemFormFields
          ref={inputRef}
          itemName={item}
          onItemNameChange={setItem}
          comment={comment}
          onCommentChange={setComment}
          quantity={quantity}
          onQuantityChange={setQuantity}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={filteredCategories}
          showCategorySelector={activeTab !== 'pharmacy'}
          showSmartOption={true}
        />

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!item.trim()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-orange-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/30 mt-1"
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />

          <span className="relative flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>הוסף לרשימה</span>
          </span>

          {categoryId === 'auto' && activeTab !== 'pharmacy' && (
            <span className="absolute top-1 left-1 bg-white/20 rounded-full px-1.5 py-0.5 text-[9px] font-medium">
              AI
            </span>
          )}
        </motion.button>
      </form>
    </div>
  )
}
