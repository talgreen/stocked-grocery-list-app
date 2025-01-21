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
import { motion } from 'framer-motion'
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
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
  const [items, setItems] = useState<BulkItem[]>([{ 
    name: '', 
    comment: '', 
    categoryId: 'auto', 
    status: 'idle' 
  }])
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

  const addRow = useCallback(() => {
    if (items.length >= 100) {
      toast.error('לא ניתן להוסיף יותר מ-100 פריטים בבת אחת')
      return
    }
    
    setItems(prev => [...prev, { 
      name: '', 
      comment: '', 
      categoryId: 'auto', 
      status: 'idle' 
    }])
  }, [items.length])

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
    const validItems = items.filter(item => item.name.trim())
    if (validItems.length === 0) return

    // Update all items to loading state
    setItems(items => items.map(item => {
      const status = item.name.trim() ? 'loading' as const : 'idle' as const
      return { ...item, status }
    }))

    try {
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
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleFormSubmit}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-2 font-medium text-sm text-gray-600 text-right w-[40%]">פריט</th>
                <th className="pb-2 font-medium text-sm text-gray-600 text-right w-[30%]">הערה</th>
                <th className="pb-2 font-medium text-sm text-gray-600 text-right w-[30%]">קטגוריה</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {items.map((item, index) => (
                <tr key={index} className="group">
                  <td className="pr-2">
                    <div className="relative">
                      <input
                        ref={index === 0 ? firstInputRef : undefined}
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, index)}
                        placeholder="שם הפריט"
                        className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right
                          ${item.status === 'error' ? 'border-red-500' : ''}
                          ${item.status === 'exists' ? 'border-yellow-500' : ''}
                          ${item.status === 'success' ? 'border-green-500' : ''}`}
                        disabled={isSubmitting || item.status === 'loading'}
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {item.status === 'loading' && (
                          <Loader2 className="w-4 h-4 animate-spin text-[#FFB74D]" />
                        )}
                        {item.status === 'exists' && (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        {item.message && (
                          <span className="text-xs text-gray-500">{item.message}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2">
                    <input
                      type="text"
                      value={item.comment}
                      onChange={(e) => updateItem(index, 'comment', e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, index)}
                      placeholder="הערה"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right"
                      disabled={isSubmitting || item.status === 'loading'}
                    />
                  </td>
                  <td className="px-2">
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
                  </td>
                  <td className="pl-2">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={isSubmitting || item.status === 'loading'}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between mt-4">
          <motion.button
            type="submit"
            disabled={
              isSubmitting || 
              items.some(item => item.status === 'loading') || 
              items.every(item => !item.name.trim())
            }
            className="bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting || items.some(item => item.status === 'loading') ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מוסיף פריטים...
              </>
            ) : (
              'הוסף פריטים'
            )}
          </motion.button>

          <button
            type="button"
            onClick={addRow}
            disabled={isSubmitting || items.some(item => item.status === 'loading')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            הוסף שורה
          </button>
        </div>
      </form>
    </div>
  )
} 