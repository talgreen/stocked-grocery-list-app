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
    // Small delay to ensure modal animation completes
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Check if an item with the same name and description already exists in the current tab
  const checkDuplicateItem = (name: string, itemComment: string = '') => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedComment = itemComment.trim().toLowerCase();

    for (const category of categories) {
      // Only check categories relevant to the current tab
      if (activeTab === 'grocery' && category.name === 'בית מרקחת') {
        continue; // Skip pharmacy category when in grocery mode
      }
      if (activeTab === 'pharmacy' && category.name !== 'בית מרקחת') {
        continue; // Skip non-pharmacy categories when in pharmacy mode
      }

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

    // Check for duplicates first (quick client-side check)
    if (checkDuplicateItem(item.trim(), comment.trim())) {
      toast.warning('הפריט כבר קיים ברשימה');
      onClose();
      return;
    }

    // Close form immediately and trigger background add
    const itemName = item.trim()
    const itemComment = comment.trim()
    const selectedCategory = categoryId

    // Reset form state
    setItem('')
    setComment('')
    setCategoryId('auto')

    // Close form immediately
    onClose()

    // Trigger background categorization and add
    onAddBackground(itemName, itemComment, selectedCategory, activeTab)
  }

  return (
    <div className="relative text-right h-full flex flex-col">
      {/* Decorative Sparkles */}
      <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
        <motion.div
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Sparkles className="w-8 h-8 text-[#FFB74D]" />
        </motion.div>
      </div>
      <div className="absolute bottom-20 left-0 opacity-10 pointer-events-none">
        <motion.div
          animate={{
            rotate: [0, -10, 10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
        >
          <Sparkles className="w-12 h-12 text-[#FFB74D]" />
        </motion.div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </motion.button>

        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20
          }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="bg-gradient-to-br from-[#FFB74D] to-[#FFA726] w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200/50"
          >
            <Package className="w-6 h-6 text-white" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md"
            >
              <Plus className="w-3 h-3 text-[#FFB74D]" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="w-7" /> {/* Spacer for alignment */}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl font-bold text-gray-800">הוסף פריט חדש</h2>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === 'pharmacy' ? 'הוסף פריט לרשימת בית המרקחת' : 'הפריט יסווג אוטומטית לקטגוריה המתאימה'}
        </p>
      </motion.div>

      <form onSubmit={handleQuickAdd} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-5">
          {/* Item Name Field */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label htmlFor="item" className="block text-sm font-medium text-gray-600 mb-2 mr-1">
              שם הפריט
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                id="item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-4 py-3.5 text-right text-base transition-all duration-200"
                placeholder="מה להוסיף לרשימה?"
                required
              />
              {item.trim() && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Comment Field */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="comment" className="block text-sm font-medium text-gray-600 mb-2 mr-1">
              הערה <span className="text-gray-400 font-normal">(אופציונלי)</span>
            </label>
            <input
              type="text"
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-4 py-3.5 text-right text-base transition-all duration-200"
              placeholder="גודל, כמות, מותג..."
            />
          </motion.div>

          {/* Category Selection */}
          {activeTab !== 'pharmacy' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium text-gray-600 mb-2 mr-1">
                קטגוריה
              </label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
              >
                <SelectTrigger className="w-full flex flex-row-reverse justify-between items-center text-base py-3.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]">
                  <SelectValue placeholder="בחר קטגוריה" className="text-right" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="flex flex-row-reverse">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FFB74D]" />
                      זיהוי חכם
                    </span>
                  </SelectItem>
                  {categories
                    .filter(cat => cat.name !== 'בית מרקחת')
                    .map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()} className="flex flex-row-reverse">
                      {category.name} {category.emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryId === 'auto' && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-[#FFB74D] mt-2 mr-1 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  הבינה המלאכותית תבחר את הקטגוריה המתאימה
                </motion.p>
              )}
            </motion.div>
          )}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-auto pt-6"
        >
          <motion.button
            type="submit"
            disabled={!item.trim()}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:y-0 focus:outline-none focus:ring-4 focus:ring-[#FFB74D]/30"
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut'
              }}
            />

            <span className="relative flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              <span>הוסף לרשימה</span>
            </span>

            {/* AI Badge - only show when auto category is selected */}
            {categoryId === 'auto' && activeTab !== 'pharmacy' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-medium"
              >
                AI
              </motion.div>
            )}
          </motion.button>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-gray-400 mt-3">
            לחץ <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> להוספה
          </p>
        </motion.div>
      </form>
    </div>
  )
}
