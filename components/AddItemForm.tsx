'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTabView } from '@/contexts/TabViewContext'
import { OpenRouter } from '@/lib/openrouter'
import { Category } from '@/types/categories'
import type { Item } from '@/types/item'
import { motion } from 'framer-motion'
import { ShoppingCart, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface AddItemFormProps {
  onAdd: (item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string) => void
  onClose: () => void
  categories: Category[]
}

// Shopping Cart Loader Animation
const CartLoader = () => (
  <motion.div 
    className="relative"
    animate={{ 
      x: [0, 10, 0],
      rotate: [0, 5, -5, 0]
    }}
    transition={{ 
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <motion.div
      className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
      animate={{ 
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{ 
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <ShoppingCart className="w-5 h-5" />
  </motion.div>
)

export default function AddItemForm({ onAdd, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [categoryId, setCategoryId] = useState('auto')
  const inputRef = useRef<HTMLInputElement>(null)
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

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim()) return

    // Check for duplicates first
    if (checkDuplicateItem(item.trim(), comment.trim())) {
      toast.warning('הפריט כבר קיים ברשימה');
      onClose();
      return;
    }

    setIsLoading(true)
    try {
      let category: string
      let emoji: string

      const normalizedQuantity = quantity.trim()
        ? parseFloat(quantity.replace(',', '.'))
        : null
      const normalizedPrice = price.trim()
        ? parseFloat(price.replace(',', '.'))
        : null

      if (normalizedQuantity !== null && Number.isNaN(normalizedQuantity)) {
        toast.error('כמות לא תקינה')
        setIsLoading(false)
        return
      }

      if (normalizedPrice !== null && Number.isNaN(normalizedPrice)) {
        toast.error('מחיר לא תקין')
        setIsLoading(false)
        return
      }

      if (activeTab === 'pharmacy') {
        // For pharmacy mode, always use pharmacy category without smart categorization
        category = 'בית מרקחת'
        emoji = '💊'
      } else if (categoryId === 'auto') {
        const result = await OpenRouter.categorize(`${item}${comment ? ` - ${comment}` : ''}`)
        category = result.category
        emoji = result.emoji
      } else {
        const selectedCategory = categories.find(c => c.id.toString() === categoryId)
        if (!selectedCategory) throw new Error('Category not found')
        category = selectedCategory.name
        emoji = selectedCategory.emoji
      }

      onAdd(
        {
          name: item.trim(),
          comment: comment.trim(),
          quantity: normalizedQuantity,
          unit: unit.trim() || null,
          price: normalizedPrice
        },
        category,
        emoji
      )
      toast.success(`הפריט "${item}" נוסף לקטגוריה ${emoji} ${category}`)

      setItem('')
      setComment('')
      setQuantity('')
      setUnit('')
      setPrice('')
      setCategoryId('auto')
      onClose()
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('שגיאה בהוספת הפריט')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative ${isLoading ? 'pointer-events-none' : ''} text-right h-full flex flex-col`}>
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

      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"
        >
          <motion.div className="flex flex-col items-center gap-3">
            <CartLoader />
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-gray-600"
            >
              מקטלג את הפריט...
            </motion.span>
          </motion.div>
        </motion.div>
      )}

      <form onSubmit={handleQuickAdd} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
              שם הפריט
            </label>
            <input
              ref={inputRef}
              type="text"
              id="item"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
              placeholder="הוסף פריט חדש"
              required
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                כמות
              </label>
              <input
                type="text"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
                placeholder="לדוגמה: 2 או 0.5"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                יחידת מידה
              </label>
              <input
                type="text"
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
                placeholder={'יחידה, ק"ג, ליטר'}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2 mr-1">
                מחיר משוער (₪)
              </label>
              <input
                type="text"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-4 py-3 text-right text-lg"
                placeholder="לדוגמה: 12.90"
                disabled={isLoading}
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
                disabled={isLoading}
              >
                <SelectTrigger className="w-full flex flex-row-reverse justify-between items-center text-lg py-3">
                  <SelectValue placeholder="בחר קטגוריה" className="text-right" />
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
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isLoading || !item.trim()}
          className="w-full bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-4 rounded-xl transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg mt-auto mb-6"
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <CartLoader />
              מוסיף...
            </>
          ) : (
            'הוסף פריט'
          )}
        </motion.button>
      </form>
    </div>
  )
}
