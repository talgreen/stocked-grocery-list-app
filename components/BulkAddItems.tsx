import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { OpenRouter } from '@/lib/openrouter'
import { Category } from '@/types/categories'
import { Item } from '@/types/item'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

interface BulkItem {
  name: string
  comment: string
  categoryId: string // 'auto' or category.id
  status: 'idle' | 'loading' | 'success' | 'error' | 'exists'
  message?: string
}

interface BulkAddItemsProps {
  categories: Category[]
  onAdd: (items: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[], itemsToUncheck: { item: Item, categoryName: string, emoji: string }[]) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

export default function BulkAddItems({ categories, onAdd, onClose, isSubmitting = false }: BulkAddItemsProps) {
  const [items, setItems] = useState<BulkItem[]>([{ name: '', comment: '', categoryId: 'auto', status: 'idle' }])
  const [expandedIndex, setExpandedIndex] = useState(0)
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  // Handle key press for individual rows
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // If it's the last row and has content, submit the form
      if (index === items.length - 1 && items[index].name.trim()) {
        handleSubmit()
      } else {
        // Otherwise add a new row and focus it
        addRow()
        // Focus the name field of the new row after it's added
        setTimeout(() => {
          const inputs = document.querySelectorAll('input[placeholder="שם הפריט"]')
          const lastInput = inputs[inputs.length - 1] as HTMLInputElement
          lastInput?.focus()
        }, 0)
      }
    }
  }

  // Memoized map of existing items for O(1) lookup
  const existingItemsMap = useMemo(() => {
    const map = new Map<string, { item: Item, category: Category }>()
    
    categories.forEach(category => {
      category.items.forEach(item => {
        const key = `${item.name.toLowerCase().trim()}|${(item.comment || '').toLowerCase().trim()}`
        map.set(key, { item, category })
      })
    })
    
    return map
  }, [categories])

  const addRow = () => {
    const currentItem = items[items.length - 1]
    if (!currentItem.name.trim()) return // Prevent adding if current item is empty

    setItems(prev => [...prev, { name: '', comment: '', categoryId: 'auto', status: 'idle' }])
    setExpandedIndex(items.length) // Expand the new item
  }

  const handleItemClick = (index: number) => {
    setExpandedIndex(index)
  }

  const removeRow = useCallback((index: number) => {
    setItems(items => items.filter((_, i) => i !== index))
  }, [])

  const updateItem = useCallback((index: number, field: keyof BulkItem, value: string) => {
    setItems(items => items.map((item, i) => {
      if (i !== index) return item
      
      // Reset status when item is modified
      const newItem: BulkItem = { 
        ...item, 
        [field]: value,
        status: 'idle' as const,
        message: undefined
      }
      
      // Check for existing items immediately on name/comment change
      if (field === 'name' || field === 'comment') {
        const key = `${newItem.name.toLowerCase().trim()}|${(newItem.comment || '').toLowerCase().trim()}`
        const existing = existingItemsMap.get(key)
        
        if (existing && newItem.name.trim()) {
          return {
            ...newItem,
            status: 'exists' as const,
            message: existing.item.purchased ? 
              'פריט קיים וסומן כנרכש - יסומן כלא נרכש' : 
              'פריט קיים ולא נרכש - לא יתווסף שוב'
          }
        }
      }
      
      return newItem
    }))
  }, [existingItemsMap])

  const handleSubmit = async () => {
    try {
      setIsSubmittingLocal(true)
      const validItems = items.filter(item => item.name.trim())
      if (validItems.length === 0) {
        toast.error('אנא הוסף לפחות פריט אחד')
        return
      }

      // Update all items to loading state
      setItems(items => items.map(item => {
        const status = item.name.trim() ? 'loading' as const : 'idle' as const
        return { ...item, status }
      }))

      const processedItems: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[] = []
      const itemsToProcess: BulkItem[] = []
      const itemsToUncheck: { item: Item, categoryName: string, emoji: string }[] = []
      
      // First pass: collect all items that need processing
      const itemUpdates: { index: number; status: 'success' | 'exists'; message: string }[] = [];

      for (const [index, item] of validItems.entries()) {
        const key = `${item.name.toLowerCase().trim()}|${(item.comment || '').toLowerCase().trim()}`
        const existing = existingItemsMap.get(key)
        
        if (existing) {
          if (existing.item.purchased) {
            // If item exists and is purchased, add to uncheck list
            itemsToUncheck.push({
              item: existing.item,
              categoryName: existing.category.name,
              emoji: existing.category.emoji
            })
            itemUpdates.push({
              index,
              status: 'success',
              message: 'סומן כלא נרכש'
            })
          } else {
            // If item exists and is not purchased, just mark as existing
            itemUpdates.push({
              index,
              status: 'exists',
              message: 'פריט קיים ולא נרכש'
            })
          }
        } else {
          // Only add to process if item doesn't exist at all
          itemsToProcess.push(item)
        }
      }

      // Update all items statuses at once
      if (itemUpdates.length > 0) {
        setItems(prev => prev.map((item, idx) => {
          const update = itemUpdates.find(u => u.index === idx)
          if (!update) return item
          return {
            ...item,
            status: update.status,
            message: update.message
          }
        }))
      }

      // Process new items
      if (itemsToProcess.length > 0) {
        // Split into auto and manual categorization
        const autoItems = itemsToProcess.filter(item => item.categoryId === 'auto')
        const manualItems = itemsToProcess.filter(item => item.categoryId !== 'auto')

        // Process manual items
        const manualProcessed = manualItems.map(item => {
          const category = categories.find(c => c.id.toString() === item.categoryId)
          if (!category) throw new Error('קטגוריה לא נמצאה')
          
          return {
            item: { name: item.name.trim(), comment: item.comment.trim() },
            categoryName: category.name,
            emoji: category.emoji
          }
        })

        // Process auto items in batch
        let autoProcessed: typeof manualProcessed = []
        if (autoItems.length > 0) {
          const batchResults = await OpenRouter.categorizeBatch(
            autoItems.map(item => ({
              name: item.name.trim(),
              comment: item.comment.trim()
            }))
          )

          autoProcessed = autoItems.map((item, index) => ({
            item: { name: item.name.trim(), comment: item.comment.trim() },
            categoryName: batchResults[index].category,
            emoji: batchResults[index].emoji
          }))
        }

        processedItems.push(...manualProcessed, ...autoProcessed)
      }

      // Add all items in a single operation
      if (processedItems.length > 0 || itemsToUncheck.length > 0) {
        await onAdd(processedItems, itemsToUncheck)
        toast.success('הפריטים עודכנו בהצלחה')
        // Reset states to initial values
        setItems([{ name: '', comment: '', categoryId: 'auto', status: 'idle' }])
        setExpandedIndex(0)
        onClose()
      } else if (!validItems.some(item => item.status === 'exists')) {
        toast.error('לא נוספו פריטים חדשים')
      }

    } catch (error) {
      console.error('Error processing items:', error)
      toast.error('שגיאה בהוספת הפריטים')
      
      setItems(items => items.map(item => {
        if (!item.name.trim() || item.status !== 'loading') return item
        return {
          ...item,
          status: 'error' as const,
          message: 'שגיאה בהוספת הפריט'
        }
      }))
    } finally {
      setIsSubmittingLocal(false)
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <form onSubmit={handleFormSubmit} className={`relative ${isSubmitting || isSubmittingLocal ? 'pointer-events-none' : ''}`}>
        {(isSubmitting || isSubmittingLocal) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg"
          >
            <motion.div className="flex flex-col items-center gap-3">
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
                <ShoppingCart className="w-10 h-10 text-[#FFB74D]" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-gray-600"
              >
                מקטלג את הפריטים...
              </motion.span>
            </motion.div>
          </motion.div>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div 
              key={index}
              layout
              initial={false}
              className={`bg-white rounded-lg border shadow-sm relative transition-colors overflow-hidden
                ${item.status === 'error' ? 'border-red-200 bg-red-50/50' : ''}
                ${item.status === 'exists' ? 'border-yellow-200 bg-yellow-50/50' : ''}
                ${item.status === 'success' ? 'border-green-200 bg-green-50/50' : ''}
                ${item.status === 'loading' ? 'border-[#FFB74D] bg-orange-50/50' : ''}
                ${!item.status ? 'border-gray-200' : ''}
                ${expandedIndex === index ? 'ring-2 ring-[#FFB74D] ring-opacity-50' : ''}
              `}
              onClick={() => expandedIndex !== index && handleItemClick(index)}
            >
              {/* Collapsed View */}
              <AnimatePresence initial={false}>
                {expandedIndex !== index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <div className="font-medium">
                        {item.name || 'פריט חדש'}
                      </div>
                      {item.comment && (
                        <div className="text-sm text-gray-500">
                          • {item.comment}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {item.categoryId === 'auto' ? (
                        <span className="text-sm text-gray-500">חכמה 🤖</span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {categories.find(c => c.id.toString() === item.categoryId)?.name} {categories.find(c => c.id.toString() === item.categoryId)?.emoji}
                        </span>
                      )}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeRow(index)
                          }}
                          disabled={isSubmitting || item.status === 'loading'}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded View */}
              <AnimatePresence initial={false}>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 space-y-3"
                  >
                    {/* Status Indicator */}
                    {item.status === 'exists' && (
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        {item.message && (
                          <span className="text-xs text-gray-500">{item.message}</span>
                        )}
                      </div>
                    )}

                    {/* Card Actions */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={isSubmitting || item.status === 'loading'}
                        className="absolute top-3 left-3 p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Item Name */}
                    <div>
                      <label htmlFor={`item-${index}`} className="block text-sm font-medium text-gray-700 mb-1 mr-1">
                        שם הפריט
                      </label>
                      <input
                        ref={index === 0 ? firstInputRef : undefined}
                        id={`item-${index}`}
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, index)}
                        placeholder="הוסף פריט חדש"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right"
                        disabled={isSubmitting || item.status === 'loading'}
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label htmlFor={`comment-${index}`} className="block text-sm font-medium text-gray-700 mb-1 mr-1">
                        הערה (אופציונלי)
                      </label>
                      <input
                        id={`comment-${index}`}
                        type="text"
                        value={item.comment}
                        onChange={(e) => updateItem(index, 'comment', e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, index)}
                        placeholder="הוסף הערה"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right"
                        disabled={isSubmitting || item.status === 'loading'}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mr-1">
                        קטגוריה
                      </label>
                      <Select
                        value={item.categoryId}
                        onValueChange={(value) => updateItem(index, 'categoryId', value)}
                        disabled={isSubmitting || item.status === 'loading'}
                      >
                        <SelectTrigger className="w-full flex flex-row-reverse justify-between items-center">
                          <SelectValue placeholder="בחר קטגוריה" className="text-right" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto" className="flex flex-row-reverse text-right">
                            חכמה 🤖
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()} 
                              className="flex flex-row-reverse text-right"
                            >
                              {category.name} {category.emoji}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <motion.button
            type="submit"
            disabled={
              isSubmitting || 
              isSubmittingLocal ||
              items.every(item => !item.name.trim())
            }
            className="bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting || isSubmittingLocal ? (
              'מוסיף פריטים...'
            ) : (
              'הוסף פריטים'
            )}
          </motion.button>

          <button
            type="button"
            onClick={addRow}
            disabled={
              isSubmitting || 
              isSubmittingLocal ||
              !items[items.length - 1].name.trim()
            }
            className={`text-sm flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200
              ${!items[items.length - 1].name.trim() || isSubmitting || isSubmittingLocal
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
            }
          >
            <Plus className="w-4 h-4" />
            הוסף שורה
          </button>
        </div>
      </form>
    </div>
  )
} 