'use client'

import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef } from 'react'
import GroceryItem from './GroceryItem'

interface Item {
  id: number
  name: string
  purchased: boolean
  comment?: string
  photo?: string
}

interface Category {
  id: number
  emoji: string
  name: string
  items: Item[]
}

interface CategoryListProps {
  categories: Category[]
  onToggleItem: (categoryId: number, itemId: number) => void
  onDeleteItem: (categoryId: number, itemId: number) => void
  onEditItem: (categoryId: number, itemId: number, newComment: string) => void
  onCategoryChange: (categoryId: number) => void
  expandedCategories: number[]
  setExpandedCategories: (categories: number[]) => void
}

export default function CategoryList({ 
  categories, 
  onToggleItem, 
  onDeleteItem, 
  onEditItem, 
  onCategoryChange,
  expandedCategories,
  setExpandedCategories 
}: CategoryListProps) {
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const previousStates = useRef<{ [key: number]: number }>({})

  // Handle category completion and collapse
  useEffect(() => {
    categories.forEach(category => {
      const uncheckedCount = category.items.filter(item => !item.purchased).length
      const previousUncheckedCount = previousStates.current[category.id] || uncheckedCount

      // If this was the last item checked
      if (previousUncheckedCount === 1 && uncheckedCount === 0) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00']
        })
        
        // Collapse only this category
        setExpandedCategories(prev => prev.filter(id => id !== category.id))
      }

      // Update the previous state
      previousStates.current[category.id] = uncheckedCount
    })
  }, [categories, setExpandedCategories])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const uncheckedCount = category.items.filter(item => !item.purchased).length
        const totalCount = category.items.length
        const allChecked = totalCount > 0 && uncheckedCount === 0
        const isExpanded = expandedCategories.includes(category.id)
        
        return (
          <motion.div
            key={category.id}
            id={`category-${category.id}`}
            ref={(el) => categoryRefs.current[category.id] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm
              ${allChecked ? 'bg-opacity-50' : ''}`}
          >
            <div className={`${allChecked ? 'bg-opacity-50' : ''}`}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-black/5 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.emoji}</span>
                  <h2 className="text-base font-semibold text-black/80">{category.name}</h2>
                  <span className="text-sm text-black/40 font-medium mr-2">
                    ({uncheckedCount}/{totalCount})
                  </span>
                  {allChecked && <Check className="h-4 w-4 text-[#FFB74D]" />}
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-black/40" />
                </motion.div>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="divide-y divide-black/5">
                    {category.items.map((item) => (
                      <GroceryItem
                        key={item.id}
                        item={item}
                        onToggle={() => onToggleItem(category.id, item.id)}
                        onDelete={() => onDeleteItem(category.id, item.id)}
                        onEdit={(field, value) => onEditItem(category.id, item.id, field, value)}
                      />
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

