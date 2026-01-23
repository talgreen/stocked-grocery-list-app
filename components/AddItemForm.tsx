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
import { motion } from 'framer-motion'
import { Package, Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface AddItemFormProps {
  onAddBackground: (
    itemName: string,
    itemComment: string,
    categorySelection: string,
    activeTab: 'grocery' | 'pharmacy'
  ) => void
  onClose: () => void
  categories: Category[]
}

export default function AddItemForm({ onAddBackground, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
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
    const trimmedName = name.trim().toLowerCase();
    const trimmedComment = itemComment.trim().toLowerCase();

    for (const category of categories) {
      if (activeTab === 'grocery' && category.name === 'בית מרקחת') continue;
      if (activeTab === 'pharmacy' && category.name !== 'בית מרקחת') continue;

      for (const categoryItem of category.items) {
        if (categoryItem.name.trim().toLowerCase() === trimmedName &&
            (categoryItem.comment || '').trim().toLowerCase() === trimmedComment) {
          return true;
        }
      }
    }
    return false;
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim()) return

    if (checkDuplicateItem(item.trim(), comment.trim())) {
      toast.warning('הפריט כבר קיים ברשימה');
      onClose();
      return;
    }

    const itemName = item.trim()
    const itemComment = comment.trim()
    const selectedCategory = categoryId

    setItem('')
    setComment('')
    setCategoryId('auto')
    onClose()
    onAddBackground(itemName, itemComment, selectedCategory, activeTab)
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
        {/* Item Name + Category Row */}
        <div className="flex gap-2">
          {/* Item Name */}
          <div className="relative flex-[2]">
            <input
              ref={inputRef}
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-right text-sm transition-all"
              placeholder="שם הפריט"
              required
            />
            {item.trim() && (
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
                  {categoryId === 'auto' ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#FFB74D]" />
                      <span className="text-xs">חכם</span>
                    </span>
                  ) : (
                    <span className="text-sm">
                      {categories.find(c => c.id.toString() === categoryId)?.emoji}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFB74D]" />
                    זיהוי חכם
                  </span>
                </SelectItem>
                {categories
                  .filter(cat => cat.name !== 'בית מרקחת')
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

        {/* Submit Button - Compact */}
        <motion.button
          type="submit"
          disabled={!item.trim()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-orange-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/30"
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
