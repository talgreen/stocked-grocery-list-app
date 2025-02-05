'use client'

import { Category } from '@/types/categories'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import GroceryItem from './GroceryItem'

interface HorizontalLayoutProps {
  categories: Category[]
  onToggleItem: (categoryId: number, itemId: number) => void
  onDeleteItem: (categoryId: number, itemId: number) => void
  onEditItem: (categoryId: number, itemId: number, newComment: string) => void
  onUpdateItemCategory: (itemId: number, newCategoryId: number) => void
  activeCategoryId: number
  onCategoryChange: (categoryId: number) => void
}

export default function HorizontalLayout({
  categories,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onUpdateItemCategory,
  activeCategoryId,
  onCategoryChange
}: HorizontalLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const previousStates = useRef<{ [key: number]: number }>({})

  // Handle category completion
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
      }

      // Update the previous state
      previousStates.current[category.id] = uncheckedCount
    })
  }, [categories])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0))
    setScrollLeft(scrollRef.current?.scrollLeft || 0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const uncheckedItems = activeCategory?.items.filter(item => !item.purchased) || []
  const checkedItems = activeCategory?.items.filter(item => item.purchased) || []

  return (
    <div className="space-y-0">
      {/* Horizontal Category Scroller */}
      <div className="sticky top-[3.75rem] bg-white z-10">
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative flex overflow-x-auto pt-0 pb-3 hide-scrollbar smooth-scroll no-select cursor-grab active:cursor-grabbing border-b border-black/[0.06]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-2 px-4">
            {categories.map((category) => {
              const uncheckedCount = category.items.filter(item => !item.purchased).length
              const totalCount = category.items.length
              const isActive = category.id === activeCategoryId

              return (
                <motion.button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200
                    ${isActive 
                      ? 'bg-[#FFB74D]/10 border-[#FFB74D] text-[#FFB74D]' 
                      : 'bg-white border-black/5 hover:border-[#FFB74D] hover:text-[#FFB74D]'
                    }
                    ${uncheckedCount === 0 && totalCount > 0 ? 'opacity-80' : ''}
                  `}
                >
                  <span className="text-xl">{category.emoji}</span>
                  <div className="flex flex-col items-start">
                    <div className="font-medium whitespace-nowrap text-sm">{category.name}</div>
                    <div className={`text-xs ${isActive ? 'text-[#FFB74D]/80' : 'text-black/40'}`}>
                      {uncheckedCount}/{totalCount}
                    </div>
                  </div>
                  {uncheckedCount === 0 && totalCount > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow-sm border border-black/5"
                    >
                      <Check className="h-3 w-3 text-green-500" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid Layout for Items */}
      {activeCategory && (
        <div className="space-y-6 px-4 py-3 bg-orange-50/50">
          {/* Unchecked Items */}
          {uncheckedItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-black/60">לקנות</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none [&>*]:list-none">
                {uncheckedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.15,
                      ease: 'easeOut'
                    }}
                    style={{ 
                      willChange: 'transform',
                      transform: 'translateZ(0)'
                    }}
                    className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden before:content-none"
                  >
                    <GroceryItem
                      item={item}
                      categories={categories.filter(c => c.id !== activeCategoryId)}
                      onToggle={() => onToggleItem(activeCategoryId, item.id)}
                      onDelete={() => onDeleteItem(activeCategoryId, item.id)}
                      onEdit={(newComment: string) => onEditItem(activeCategoryId, item.id, newComment)}
                      onUpdateCategory={(newCategoryId: number) => onUpdateItemCategory(item.id, newCategoryId)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Checked Items */}
          {checkedItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-black/60 px-1">נרכש</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none [&>*]:list-none">
                {checkedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.15,
                      ease: 'easeOut'
                    }}
                    style={{ 
                      willChange: 'transform',
                      transform: 'translateZ(0)'
                    }}
                    className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden opacity-50 before:content-none"
                  >
                    <GroceryItem
                      item={item}
                      categories={categories.filter(c => c.id !== activeCategoryId)}
                      onToggle={() => onToggleItem(activeCategoryId, item.id)}
                      onDelete={() => onDeleteItem(activeCategoryId, item.id)}
                      onEdit={(newComment: string) => onEditItem(activeCategoryId, item.id, newComment)}
                      onUpdateCategory={(newCategoryId: number) => onUpdateItemCategory(item.id, newCategoryId)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeCategory.items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm p-8 text-center"
            >
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-lg font-semibold text-black/80 mb-2">הקטגוריה ריקה</h3>
              <p className="text-sm text-black/60">
                לחצו על הכפתור למטה כדי להוסיף פריטים לרשימה
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
} 