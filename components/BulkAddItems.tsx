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
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface BulkItem {
  name: string
  comment: string
  categoryId: string // 'auto' or category.id
  status: 'idle' | 'loading' | 'success' | 'error'
}

interface BulkAddItemsProps {
  categories: Category[]
  onAdd: (items: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[]) => Promise<void>
  onUncheck?: (item: Item, categoryName: string, emoji: string) => void
  onClose: () => void
  isSubmitting?: boolean
}

export default function BulkAddItems({ categories, onAdd, onUncheck, onClose, isSubmitting = false }: BulkAddItemsProps) {
  const [items, setItems] = useState<BulkItem[]>([{ name: '', comment: '', categoryId: 'auto', status: 'idle' }])

  const addRow = () => {
    setItems([...items, { name: '', comment: '', categoryId: 'auto', status: 'idle' }])
  }

  const removeRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof BulkItem, value: string) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const checkIfItemExists = (name: string, comment: string): { item: Item, category: string, emoji: string } | null => {
    for (const category of categories) {
      for (const existingItem of category.items) {
        if (existingItem.name.toLowerCase() === name.trim().toLowerCase() &&
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

  const handleSubmit = async () => {
    const validItems = items.filter(item => item.name.trim())
    if (validItems.length === 0) return

    // Update all items to loading state
    setItems(items.map(item => ({
      ...item,
      status: item.name.trim() ? 'loading' : 'idle'
    })))

    try {
      // Check for existing items first
      const itemsToProcess: typeof validItems = []
      const existingItems: { index: number, item: Item, category: string, emoji: string }[] = []
      const processedItems: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[] = []

      validItems.forEach((item, index) => {
        const existingItem = checkIfItemExists(item.name, item.comment)
        if (existingItem) {
          existingItems.push({ index, ...existingItem })
        } else {
          itemsToProcess.push(item)
        }
      })

      // Handle existing items
      for (const { index, item, category, emoji } of existingItems) {
        if (item.purchased) {
          if (onUncheck) {
            await onUncheck(item, category, emoji)
          } else {
            // Fallback to adding as new item if onUncheck is not provided
            processedItems.push({
              item: { name: item.name, comment: item.comment || '' },
              categoryName: category,
              emoji
            })
          }
          // Update status to success
          setItems(prev => prev.map((i, idx) => 
            idx === index ? { ...i, status: 'success' } : i
          ))
          toast.success(`הפריט "${item.name}" סומן כלא נרכש`)
        } else {
          // Update status to idle and show info toast
          setItems(prev => prev.map((i, idx) => 
            idx === index ? { ...i, status: 'idle' } : i
          ))
          toast.info(`הפריט "${item.name}" כבר קיים ברשימה ולא נרכש`)
        }
      }

      // Process new items
      if (itemsToProcess.length > 0) {
        // Separate items into auto and manual categories
        const autoItems = itemsToProcess.filter(item => item.categoryId === 'auto')
        const manualItems = itemsToProcess.filter(item => item.categoryId !== 'auto')

        // Process items with manual categories
        const manualProcessed = manualItems.map(item => {
          const selectedCategory = categories.find(c => c.id.toString() === item.categoryId)
          if (!selectedCategory) throw new Error('Category not found')
          
          return {
            item: { name: item.name.trim(), comment: item.comment.trim() },
            categoryName: selectedCategory.name,
            emoji: selectedCategory.emoji
          }
        })

        // Process items needing auto-categorization in one batch
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

        // Add all processed items to the array
        processedItems.push(...manualProcessed, ...autoProcessed)
      }
      
      // Submit all items at once if we have any to process
      if (processedItems.length > 0) {
        await onAdd(processedItems)
        toast.success('הפריטים נוספו בהצלחה')
        onClose()
      } else if (existingItems.length === 0) {
        // If we have no items to process and no existing items were handled
        toast.error('לא נוספו פריטים חדשים')
      }
      
    } catch (error) {
      console.error('Error adding items:', error)
      toast.error('שגיאה בהוספת הפריטים')
      
      // Update failed items to error state
      setItems(items.map(item => ({
        ...item,
        status: item.name.trim() ? 'error' : 'idle'
      })))
    }
  }

  return (
    <div className="space-y-4">
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
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="שם הפריט"
                      className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2 text-right ${
                        item.status === 'error' ? 'border-red-500' : ''
                      }`}
                      disabled={isSubmitting || item.status === 'loading'}
                    />
                    {item.status === 'loading' && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFB74D]" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2">
                  <input
                    type="text"
                    value={item.comment}
                    onChange={(e) => updateItem(index, 'comment', e.target.value)}
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
                        <SelectItem key={category.id} value={category.id.toString()} className="flex flex-row-reverse text-right">
                          {category.name} {category.emoji}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="pl-2">
                  {items.length > 1 && (
                    <button
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

      <div className="flex justify-between">
        <motion.button
          type="button"
          onClick={handleSubmit}
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
    </div>
  )
} 