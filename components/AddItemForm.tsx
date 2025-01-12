'use client'

import { OpenRouter } from '@/lib/openrouter'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface AddItemFormProps {
  onAdd: (item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string) => void
  categories: Category[]
  onClose: () => void
}

export default function AddItemForm({ onAdd, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

    if (checkIfItemExists()) {
      toast.error('פריט זה כבר קיים ברשימה')
      return
    }

    setIsLoading(true)
    try {
      const { category, emoji } = await OpenRouter.categorize(`${item}${comment ? ` - ${comment}` : ''}`)
      
      // Find existing category by name only
      const existingCategory = categories.find(c => 
        c.name.toLowerCase().includes(category.toLowerCase()) || 
        category.toLowerCase().includes(c.name.toLowerCase())
      )
      
      const newItem = {
        name: item.trim(),
        ...(comment && { comment })
      }

      // Use single function but keep different messages
      if (existingCategory) {
        onAdd(newItem, category, existingCategory.emoji)
        toast.success(`הפריט "${item}" נוסף לקטגוריית ${existingCategory.emoji} ${existingCategory.name}`)
      } else {
        onAdd(newItem, category, emoji)
        toast.success(`הפריט "${item}" נוסף לקטגוריה חדשה ${emoji} ${category}`)
      }
      
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
        <h2 className="text-lg font-semibold">פריט חדש</h2>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      
      <div>
        <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
          שם הפריט
        </label>
        <input
          ref={inputRef}
          type="text"
          id="item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2"
          placeholder="הוסף פריט חדש"
          required
          disabled={isLoading}
          style={{ fontSize: '16px' }}
        />
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
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FFB74D] focus:border-[#FFB74D] px-3 py-2"
          placeholder="הוסף הערה"
          disabled={isLoading}
          style={{ fontSize: '16px' }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors duration-200 disabled:opacity-50"
      >
        {isLoading ? 'מוסיף...' : 'הוסף פריט'}
      </button>
    </form>
  );
}
