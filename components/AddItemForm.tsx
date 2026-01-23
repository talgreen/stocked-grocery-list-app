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
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Package, Plus, Sparkles, X } from 'lucide-react'
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
  const [showComment, setShowComment] = useState(false)
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
    <div className="relative text-right h-full flex flex-col">
      {/* Decorative Sparkles */}
      <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-6 h-6 text-[#FFB74D]" />
        </motion.div>
      </div>

      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
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
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-gradient-to-br from-[#FFB74D] to-[#FFA726] w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50"
          >
            <Package className="w-5 h-5 text-white" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow"
            >
              <Plus className="w-2.5 h-2.5 text-[#FFB74D]" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="w-7" />
      </div>

      {/* Compact Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h2 className="text-lg font-bold text-gray-800">הוסף פריט חדש</h2>
      </motion.div>

      <form onSubmit={handleQuickAdd} className="flex-1 flex flex-col">
        <div className="space-y-3">
          {/* Item Name + Category Row */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
          >
            {/* Item Name - Takes more space */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-3 text-right text-base transition-all duration-200"
                placeholder="שם הפריט"
                required
              />
              {item.trim() && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </motion.div>
              )}
            </div>

            {/* Category - Compact */}
            {activeTab !== 'pharmacy' && (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-[100px] flex-shrink-0 flex-row-reverse justify-between items-center text-sm py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]">
                  <SelectValue placeholder="קטגוריה">
                    {categoryId === 'auto' ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#FFB74D]" />
                        <span className="text-xs">חכם</span>
                      </span>
                    ) : (
                      <span className="text-xs">
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
          </motion.div>

          {/* Optional Comment Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <AnimatePresence mode="wait">
              {!showComment ? (
                <motion.button
                  key="toggle"
                  type="button"
                  onClick={() => setShowComment(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mr-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  <span>הוסף הערה</span>
                </motion.button>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-right text-sm transition-all duration-200"
                    placeholder="הערה (גודל, כמות, מותג...)"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Compact Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-auto pt-4"
        >
          <motion.button
            type="submit"
            disabled={!item.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-orange-200/50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#FFB74D]/30"
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
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-1.5 left-1.5 bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              >
                AI
              </motion.div>
            )}
          </motion.button>

          <p className="text-center text-[10px] text-gray-400 mt-2">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[9px]">Enter</kbd> להוספה
          </p>
        </motion.div>
      </form>
    </div>
  )
}
