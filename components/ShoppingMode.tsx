'use client'

import { useTabView } from '@/contexts/TabViewContext'
import { Category } from '@/types/categories'
import { Item } from '@/types/item'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, PartyPopper, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface ShoppingModeProps {
  categories: Category[]
  onToggleItem: (categoryId: number, itemId: number) => void
  onExit: () => void
}

function remainingCount(category: Category): number {
  return category.items.filter(item => !item.purchased).length
}

// Active categories first, fully-completed ones dimmed at the bottom
function sortForShopping(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const aDone = remainingCount(a) === 0
    const bDone = remainingCount(b) === 0
    if (aDone === bDone) return 0
    return aDone ? 1 : -1
  })
}

export default function ShoppingMode({ categories, onToggleItem, onExit }: ShoppingModeProps) {
  const { activeTab } = useTabView()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  // Only the categories relevant to the current tab that actually have items
  const relevantCategories = useMemo(() => {
    return categories.filter(category => {
      if (category.items.length === 0) return false
      if (activeTab === 'pharmacy') return category.name === 'בית מרקחת'
      return category.name !== 'בית מרקחת'
    })
  }, [categories, activeTab])

  const sortedCategories = useMemo(() => sortForShopping(relevantCategories), [relevantCategories])

  const totalItems = useMemo(
    () => relevantCategories.reduce((sum, c) => sum + c.items.length, 0),
    [relevantCategories]
  )
  const remainingItems = useMemo(
    () => relevantCategories.reduce((sum, c) => sum + remainingCount(c), 0),
    [relevantCategories]
  )
  const doneItems = totalItems - remainingItems
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const selectedCategory = selectedCategoryId
    ? relevantCategories.find(c => c.id === selectedCategoryId) ?? null
    : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#FDF6ED] flex flex-col text-right pt-safe"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white border-b border-black/5 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-black/80">מצב קנייה</h1>
            <p className="text-xs text-black/50">
              {remainingItems > 0
                ? `נשארו ${remainingItems} פריטים לקנייה`
                : 'סיימת את כל הרשימה 🎉'}
            </p>
          </div>
          <button
            onClick={onExit}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm text-black/60 hover:text-black/80 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>סיום</span>
          </button>
        </div>
        {/* Overall progress bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FFB74D] rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-24">
          <AnimatePresence mode="wait">
            {selectedCategory ? (
              <CategoryDetail
                key={`detail-${selectedCategory.id}`}
                category={selectedCategory}
                onToggleItem={onToggleItem}
                onBack={() => setSelectedCategoryId(null)}
              />
            ) : (
              <CategoryGrid
                key="grid"
                categories={sortedCategories}
                onSelect={setSelectedCategoryId}
                allDone={totalItems > 0 && remainingItems === 0}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

interface CategoryGridProps {
  categories: Category[]
  onSelect: (categoryId: number) => void
  allDone: boolean
}

function CategoryGrid({ categories, onSelect, allDone }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-black/5 shadow-sm p-10 text-center mt-6"
      >
        <div className="text-4xl mb-4">🛒</div>
        <h3 className="text-lg font-semibold text-black/80 mb-2">אין פריטים לקנייה</h3>
        <p className="text-sm text-black/60">הוסיפו פריטים לרשימה כדי להתחיל לקנות</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white rounded-2xl p-5 mb-4 flex items-center gap-3 shadow-md shadow-orange-200/50"
        >
          <PartyPopper className="w-7 h-7 flex-shrink-0" />
          <div>
            <p className="font-bold">כל הכבוד, סיימת!</p>
            <p className="text-sm text-white/90">כל הפריטים סומנו כנקנו</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {categories.map(category => {
          const remaining = remainingCount(category)
          const isDone = remaining === 0
          return (
            <motion.button
              key={category.id}
              layout
              onClick={() => onSelect(category.id)}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border shadow-sm p-5 min-h-[120px] transition-colors ${
                isDone
                  ? 'bg-gray-50 border-black/5 opacity-60'
                  : 'bg-white border-black/5 hover:border-[#FFB74D]/40'
              }`}
            >
              <span className="text-4xl">{category.emoji}</span>
              <span className="text-sm font-semibold text-black/80 text-center leading-tight">
                {category.name}
              </span>
              {isDone ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="w-3.5 h-3.5" />
                  הושלם
                </span>
              ) : (
                <span className="absolute top-2.5 left-2.5 min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-full bg-[#FFB74D] text-white text-xs font-bold">
                  {remaining}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

interface CategoryDetailProps {
  category: Category
  onToggleItem: (categoryId: number, itemId: number) => void
  onBack: () => void
}

function CategoryDetail({ category, onToggleItem, onBack }: CategoryDetailProps) {
  const remainingItems = category.items.filter(item => !item.purchased)
  const completedItems = category.items.filter(item => item.purchased)
  // Default to revealing completed items only when nothing is left to buy
  const [showCompleted, setShowCompleted] = useState(remainingItems.length === 0)

  // Celebrate when the category gets cleared while viewing it
  const justFinished = remainingItems.length === 0
  useEffect(() => {
    if (!justFinished) return
    let cancelled = false
    import('canvas-confetti').then(module => {
      if (cancelled) return
      module.default({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00'],
      })
    })
    return () => {
      cancelled = true
    }
  }, [justFinished])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Back + title */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-black/60 hover:text-black/80 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        <span>כל הקטגוריות</span>
      </button>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{category.emoji}</span>
        <div>
          <h2 className="text-lg font-bold text-black/80">{category.name}</h2>
          <p className="text-xs text-black/50">
            {remainingItems.length > 0
              ? `${remainingItems.length} פריטים לקנייה`
              : 'הקטגוריה הושלמה'}
          </p>
        </div>
      </div>

      {/* Remaining items */}
      {remainingItems.length > 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <ul className="divide-y divide-black/5 list-none">
            <AnimatePresence initial={false}>
              {remainingItems.map(item => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={() => onToggleItem(category.id, item.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center"
        >
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-base font-semibold text-black/80 mb-1">סיימת את {category.name}</h3>
          <p className="text-sm text-black/60 mb-4">כל הפריטים סומנו כנקנו</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 bg-[#FFB74D] hover:bg-[#FFA726] text-white text-sm font-medium rounded-full px-4 py-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לקטגוריות
          </button>
        </motion.div>
      )}

      {/* Completed items (collapsible) so mistakes can be undone */}
      {completedItems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowCompleted(prev => !prev)}
            className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black/70 transition-colors"
          >
            <Check className="w-4 h-4 text-green-500" />
            <span>{completedItems.length} פריטים שכבר נקנו</span>
            <span className="text-xs text-black/40">{showCompleted ? '(הסתר)' : '(הצג)'}</span>
          </button>

          <AnimatePresence initial={false}>
            {showCompleted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden mt-2">
                  <ul className="divide-y divide-black/5 list-none">
                    {completedItems.map(item => (
                      <ShoppingRow
                        key={item.id}
                        item={item}
                        onToggle={() => onToggleItem(category.id, item.id)}
                      />
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

interface ShoppingRowProps {
  item: Item
  onToggle: () => void
}

function ShoppingRow({ item, onToggle }: ShoppingRowProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="list-none"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-right active:bg-black/5 transition-colors"
      >
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
            item.purchased
              ? 'bg-[#FFB74D] border-[#FFB74D] text-white'
              : 'border-gray-300 text-transparent'
          }`}
        >
          <Check className="w-5 h-5" strokeWidth={3} />
        </span>
        <span className="flex-1 min-w-0 flex items-baseline gap-2">
          <span
            className={`text-base truncate ${
              item.purchased ? 'line-through text-black/40' : 'text-black/80 font-medium'
            }`}
          >
            {item.name}
          </span>
          {item.comment && (
            <span className="text-sm text-black/40 truncate">({item.comment})</span>
          )}
        </span>
      </button>
    </motion.li>
  )
}
