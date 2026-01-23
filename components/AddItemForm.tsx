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
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquarePlus, X } from 'lucide-react'
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
  const [showComment, setShowComment] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const commentRef = useRef<HTMLInputElement>(null)
  const { activeTab } = useTabView()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Check if an item with the same name and description already exists in the current tab
  const checkDuplicateItem = (name: string, comment: string = '') => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedComment = comment.trim().toLowerCase();
    
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
    setShowComment(false)

    // Close form immediately
    onClose()

    // Trigger background categorization and add
    onAddBackground(itemName, itemComment, selectedCategory, activeTab)
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
        <h2 className="text-lg font-semibold">הוסף פריט חדש</h2>
        <div className="w-6" /> {/* Spacer for alignment */}
      </div>

      <form onSubmit={handleQuickAdd} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          <input
            ref={inputRef}
            type="text"
            id="item"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-4 text-right text-lg"
            placeholder="שם הפריט"
            required
          />

          <AnimatePresence>
            {showComment ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  ref={commentRef}
                  type="text"
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-4 text-right text-lg"
                  placeholder="הערה (אופציונלי)"
                />
              </motion.div>
            ) : (
              <motion.button
                type="button"
                onClick={() => {
                  setShowComment(true)
                  setTimeout(() => commentRef.current?.focus(), 100)
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 text-sm transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MessageSquarePlus className="h-4 w-4" />
                הוסף הערה
              </motion.button>
            )}
          </AnimatePresence>

          {activeTab !== 'pharmacy' && (
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
            >
              <SelectTrigger className="w-full flex flex-row-reverse justify-between items-center text-lg py-4 rounded-xl border-gray-300">
                <SelectValue placeholder="קטגוריה" className="text-right" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="flex flex-row-reverse">
                  חכמה 🤖
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()} className="flex flex-row-reverse">
                    {category.name} {category.emoji}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={!item.trim()}
          className="w-full bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-4 rounded-xl transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg mt-auto mb-6"
          whileTap={{ scale: 0.98 }}
        >
          הוסף פריט
        </motion.button>
      </form>
    </div>
  )
}
