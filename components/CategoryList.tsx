'use client'

import { Category } from '@/types/categories'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Square } from 'lucide-react'
import { useEffect, useRef } from 'react'
import GroceryItem from './GroceryItem'

interface CategoryListProps {
  categories: Category[]
  onToggleItem: (categoryId: number, itemId: number) => void
  onDeleteItem: (categoryId: number, itemId: number) => void
  onEditItem: (categoryId: number, itemId: number, newComment: string) => void
  expandedCategories: number[]
  setExpandedCategories: React.Dispatch<React.SetStateAction<number[]>>
  onUpdateItemCategory: (itemId: number, newCategoryId: number) => void
  onAddItem?: (categoryId: number, name: string) => void
}

// Helper function to check if a category is completed
function isCategoryCompleted(category: Category): boolean {
  return category.items.length > 0 && category.items.every(item => item.purchased)
}

// Helper function to check if a category is empty
function isCategoryEmpty(category: Category): boolean {
  return category.items.length === 0
}

// Sort categories: active on top, completed in middle, empty at bottom
function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const aEmpty = isCategoryEmpty(a)
    const bEmpty = isCategoryEmpty(b)
    const aCompleted = isCategoryCompleted(a)
    const bCompleted = isCategoryCompleted(b)

    // If both are empty or both are non-empty, maintain original order
    if (aEmpty && bEmpty) return 0
    if (aEmpty) return 1 // Empty goes to bottom
    if (bEmpty) return -1 // Non-empty goes to top

    // Among non-empty categories, sort completed to bottom
    if (aCompleted === bCompleted) return 0
    return aCompleted ? 1 : -1
  })
}

export default function CategoryList({ 
  categories, 
  onToggleItem, 
  onDeleteItem, 
  onEditItem,
  onUpdateItemCategory,
  expandedCategories,
  setExpandedCategories,
  onAddItem
}: CategoryListProps) {
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const previousStates = useRef<{ [key: number]: number }>({})

  // Sort categories with completed ones at the bottom
  const sortedCategories = sortCategories(categories)

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
        setExpandedCategories((prev: number[]) => prev.filter((id: number) => id !== category.id))
      }

      // Update the previous state
      previousStates.current[category.id] = uncheckedCount
    })
  }, [categories, setExpandedCategories])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev: number[]) => 
      prev.includes(categoryId) 
        ? prev.filter((id: number) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="space-y-4">
      {sortedCategories.some(category => category.items.length > 0) ? (
        sortedCategories.map((category) => {
          const uncheckedCount = category.items.filter(item => !item.purchased).length
          const totalCount = category.items.length
          const allChecked = totalCount > 0 && uncheckedCount === 0
          const isExpanded = expandedCategories.includes(category.id)
          
          return (
            <motion.div
              key={category.id}
              id={`category-${category.id}`}
              ref={(el: HTMLDivElement | null) => {
                categoryRefs.current[category.id] = el
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: allChecked ? 0.7 : 1, 
                y: 0,
                scale: allChecked ? 0.98 : 1,
              }}
              layout
              transition={{ 
                duration: 0.3,
                ease: 'easeOut',
                layout: {
                  duration: 0.3,
                  ease: 'easeInOut'
                }
              }}
              style={{ 
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
              className={`bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm will-change-transform
                ${allChecked ? 'opacity-70' : ''}`}
            >
              <div className={`${allChecked ? 'bg-opacity-50' : ''}`}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full p-4 flex justify-between items-center hover:bg-black/5 transition-colors duration-200
                    ${allChecked ? 'text-gray-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.emoji}</span>
                    <h2 className={`text-base font-semibold ${allChecked ? 'text-gray-500' : 'text-black/80'}`}>
                      {category.name}
                    </h2>
                    <span className={`text-sm font-medium mr-2 ${allChecked ? 'text-gray-400' : 'text-black/40'}`}>
                      ({uncheckedCount}/{totalCount})
                    </span>
                    {allChecked && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={`h-4 w-4 ${allChecked ? 'text-gray-400' : 'text-black/40'}`} />
                  </motion.div>
                </button>
              </div>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ 
                      duration: 0.15,
                      ease: 'easeOut'
                    }}
                    style={{ 
                      willChange: 'transform',
                      transform: 'translateZ(0)'
                    }}
                    className="overflow-hidden"
                  >
                    <ul className="divide-y divide-black/5 list-none">
                      {category.items.map((item) => (
                        <GroceryItem
                          key={item.id}
                          item={item}
                          categories={categories.filter(c => c.id !== category.id)}
                          onToggle={() => onToggleItem(category.id, item.id)}
                          onDelete={() => onDeleteItem(category.id, item.id)}
                          onEdit={(newComment: string) => onEditItem(category.id, item.id, newComment)}
                          onUpdateCategory={(newCategoryId: number) => onUpdateItemCategory(item.id, newCategoryId)}
                        />
                      ))}
                      <motion.li 
                        initial={false}
                        className="list-none px-4 py-2 relative touch-pan-x bg-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 text-black/20 mt-0.5">
                            <Square className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            placeholder="הוסף פריט חדש..."
                            className="flex-1 bg-transparent border-none outline-none text-right text-sm text-black/80 placeholder:text-black/40 focus:ring-0 p-0 min-w-0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                onAddItem?.(category.id, e.currentTarget.value.trim())
                                e.currentTarget.value = ''
                              }
                            }}
                          />
                        </div>
                      </motion.li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm p-8 text-center"
        >
          <div className="text-4xl mb-4">🛍️</div>
          <h3 className="text-lg font-semibold text-black/80 mb-2">הרשימה ריקה</h3>
          <p className="text-sm text-black/60">
            לחצו על הכפתור למטה כדי להוסיף פריטים לרשימה
          </p>
        </motion.div>
      )}
    </div>
  )
}

