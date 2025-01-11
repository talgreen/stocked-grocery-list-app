'use client'

import { OpenRouter } from '@/lib/openrouter'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface AddItemFormProps {
  onAdd: (item: { name: string, comment?: string }, categoryId: number) => void
  onAddCategory: (categoryName: string) => Promise<number>
  onClose: () => void
  categories: Category[]
}

export default function AddItemForm({ onAdd, onAddCategory, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const checkIfItemExists = () => {
    return categories.some(category => 
      category.items.some(existingItem => 
        existingItem.name.toLowerCase() === item.trim().toLowerCase()
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.trim()) return

    // Check for duplicates first
    if (checkIfItemExists()) {
      toast.error('פריט זה כבר קיים ברשימה')
      return
    }

    setIsLoading(true)
    try {
      const { category, emoji } = await OpenRouter.categorize(item)
      
      // Find existing category
      let categoryId: number
      const existingCategory = categories.find(c => 
        c.name.toLowerCase().includes(category.toLowerCase()) || 
        category.toLowerCase().includes(c.name.split(' ')[1].toLowerCase())
      )
      
      const newItem = {
        id: Date.now(),
        name: item.trim(),
        purchased: false,
        ...(comment && { comment })
      }

      if (existingCategory) {
        // Use existing category's emoji and ID
        const existingEmoji = existingCategory.name.split(' ')[0]
        categoryId = existingCategory.id
        
        // Add item
        onAdd(newItem, categoryId)
        
        // Show success message with existing category's emoji
        toast.success(`הפריט "${item}" נוסף לקטגוריית ${existingEmoji} ${category}`)
      } else {
        // Create new category first
        categoryId = await onAddCategory(`${emoji} ${category}`)
        
        // Wait for category to be created
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Then add the item
        onAdd(newItem, categoryId)
        
        // Show success message with new emoji
        toast.success(`הפריט "${item}" נוסף לקטגוריה חדשה ${emoji} ${category}`)
      }
      
      // Reset and close
      setItem('')
      setComment('')
      onClose()
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('שגיאה בהוספת הפריט')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">מוצר חדש</h2>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      
      <input
        type="text"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
        placeholder="שם המוצר"
        required
        disabled={isLoading}
      />

      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
        placeholder="הערה (אופציונלי)"
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50"
      >
        {isLoading ? 'מוסיף...' : 'הוסף מוצר'}
      </button>
    </form>
  )
}

