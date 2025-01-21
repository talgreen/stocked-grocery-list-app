'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OpenRouter } from '@/lib/openrouter'
import { Category } from '@/types/categories'
import type { Item } from '@/types/item'
import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import BulkAddItems from './BulkAddItems'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface AddItemFormProps {
  onAdd: (item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string) => void
  onUncheck?: (itemsToUncheck: { item: Item, categoryName: string, emoji: string }[]) => Promise<void>
  onBulkAdd: (items: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[], itemsToUncheck: { item: Item, categoryName: string, emoji: string }[]) => Promise<void>
  categories: Category[]
  onClose: () => void
}

interface ExistingItemResult {
  item: Item
  category: string
  emoji: string
}

export default function AddItemForm({ onAdd, onUncheck, onBulkAdd, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [categoryId, setCategoryId] = useState('auto')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const checkIfItemExists = (): ExistingItemResult | null => {
    for (const category of categories) {
      for (const existingItem of category.items) {
        if (existingItem.name.toLowerCase() === item.trim().toLowerCase() &&
            (existingItem.comment || '').toLowerCase() === comment.trim().toLowerCase()) {
          return {
            item: existingItem,
            category: category.name,
            emoji: category.emoji
          }
        }
      }
    }
    return null
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim()) return

    const existingItem = checkIfItemExists()
    if (existingItem) {
      // If item exists and is purchased, uncheck it
      if (existingItem.item.purchased) {
        if (onUncheck) {
          try {
            await onUncheck([{
              item: existingItem.item,
              categoryName: existingItem.category,
              emoji: existingItem.emoji
            }])
            toast.success('הפריט סומן כלא נרכש')
          } catch (error) {
            toast.error('שגיאה בעדכון הפריט')
            return
          }
        } else {
          // Fallback to onAdd if onUncheck is not provided
          onAdd(
            { name: item.trim(), comment: comment.trim() },
            existingItem.category,
            existingItem.emoji
          )
          toast.success('הפריט סומן כלא נרכש')
        }
      } else {
        toast.info('הפריט כבר קיים ברשימה ולא נרכש')
      }
      setItem('')
      setComment('')
      onClose()
      return
    }

    setIsLoading(true)
    try {
      let category: string
      let emoji: string

      if (categoryId === 'auto') {
        const result = await OpenRouter.categorize(`${item}${comment ? ` - ${comment}` : ''}`)
        category = result.category
        emoji = result.emoji
      } else {
        const selectedCategory = categories.find(c => c.id.toString() === categoryId)
        if (!selectedCategory) throw new Error('Category not found')
        category = selectedCategory.name
        emoji = selectedCategory.emoji
      }
      
      const newItem = {
        name: item.trim(),
        comment: comment.trim()
      }

      onAdd(newItem, category, emoji)
      toast.success(`הפריט "${item}" נוסף לקטגוריה ${emoji} ${category}`)
      
      setItem('')
      setComment('')
      setCategoryId('auto')
      onClose()
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('שגיאה בהוספת הפריט')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkAdd = async (items: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[], itemsToUncheck: { item: Item, categoryName: string, emoji: string }[]) => {
    setIsLoading(true)
    try {
      await onBulkAdd(items, itemsToUncheck)
      toast.success('הפריטים עודכנו בהצלחה')
      onClose()
    } catch (error) {
      console.error('Error in bulk add:', error)
      toast.error('שגיאה בהוספת הפריטים')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative ${isLoading ? 'pointer-events-none' : ''} text-right`}>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg"
        >
          <motion.div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: 360
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#FFB74D]/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-10 h-10 text-[#FFB74D]" />
            </motion.div>
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

      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 order-last">
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold order-first">הוספת פריטים</h2>
      </div>

      <Tabs defaultValue="quick" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
          <TabsTrigger value="quick" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">הוספה מהירה</TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">הוספה מרובה</TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="flex flex-row-reverse gap-4">
              <div className="flex-1">
                <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                  שם הפריט
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="item"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right"
                  placeholder="הוסף פריט חדש"
                  required
                  disabled={isLoading}
                  style={{ fontSize: '16px' }}
                />
              </div>

              
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                הערה (אופציונלי)
              </label>
              <input
                type="text"
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right"
                placeholder="הוסף הערה"
                disabled={isLoading}
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קטגוריה
              </label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full flex flex-row-reverse justify-between items-center">
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

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'מוסיף...' : 'הוסף פריט'}
            </motion.button>
          </form>
        </TabsContent>

        <TabsContent value="bulk">
          <BulkAddItems 
            categories={categories}
            onAdd={onBulkAdd}
            onClose={onClose}
            isSubmitting={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
