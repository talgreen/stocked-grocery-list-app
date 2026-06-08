'use client'

import { useTabView } from '@/contexts/TabViewContext'
import { Category } from '@/types/categories'
import { Item } from '@/types/item'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, PartyPopper, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface ShoppingModeProps {
  categories: Category[]
  onToggleItem: (categoryId: number, itemId: number) => void
  onExit: () => void
}

// A stable key for an item within its category (item ids alone aren't
// guaranteed unique across categories).
function itemKey(categoryId: number, itemId: number): string {
  return `${categoryId}:${itemId}`
}

// The items of a category that belong to this shopping session — i.e. were
// still unchecked when shopping mode opened. Items bought beforehand are
// excluded entirely and never surface in shopping mode.
function sessionItemsOf(category: Category, sessionKeys: Set<string>): Item[] {
  return category.items.filter(item => sessionKeys.has(itemKey(category.id, item.id)))
}

function remainingOf(category: Category, sessionKeys: Set<string>): number {
  return sessionItemsOf(category, sessionKeys).filter(item => !item.purchased).length
}

export default function ShoppingMode({ categories, onToggleItem, onExit }: ShoppingModeProps) {
  const { activeTab } = useTabView()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  // Snapshot the entry state once, when shopping mode opens (the component
  // mounts fresh each time). Everything below runs against this snapshot:
  //  - only items unchecked at entry take part (already-bought ones stay hidden)
  //  - the category list is frozen to those that had something to buy, so a
  //    category you clear *during* the session stays visible for review
  //  - the progress counter runs 0..N over exactly these items
  const sessionKeysRef = useRef<Set<string> | null>(null)
  if (sessionKeysRef.current === null) {
    const keys = new Set<string>()
    for (const category of categories) {
      for (const item of category.items) {
        if (!item.purchased) keys.add(itemKey(category.id, item.id))
      }
    }
    sessionKeysRef.current = keys
  }
  const sessionKeys = sessionKeysRef.current

  // Categories relevant to the current tab that had at least one item to buy at
  // entry. Membership is frozen for the session — a category never disappears
  // just because every item in it got checked off mid-shop.
  const sessionCategories = useMemo(() => {
    return categories.filter(category => {
      if (activeTab === 'pharmacy' && category.name !== 'בית מרקחת') return false
      if (activeTab !== 'pharmacy' && category.name === 'בית מרקחת') return false
      return category.items.some(item => sessionKeys.has(itemKey(category.id, item.id)))
    })
  }, [categories, activeTab, sessionKeys])

  // Fixed at the entry snapshot: total never changes, done counts up from 0.
  const totalItems = useMemo(
    () => sessionCategories.reduce((sum, c) => sum + sessionItemsOf(c, sessionKeys).length, 0),
    [sessionCategories, sessionKeys]
  )
  const remainingItems = useMemo(
    () => sessionCategories.reduce((sum, c) => sum + remainingOf(c, sessionKeys), 0),
    [sessionCategories, sessionKeys]
  )
  const doneItems = totalItems - remainingItems
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // With a single category there's nothing to pick between, so skip the grid and
  // drop straight into its item list.
  const isSingleCategory = sessionCategories.length === 1
  const activeCategory = isSingleCategory
    ? sessionCategories[0]
    : selectedCategoryId
      ? sessionCategories.find(c => c.id === selectedCategoryId) ?? null
      : null

  const handleBack = useCallback(() => setSelectedCategoryId(null), [])

  // Celebrate and auto-return to the grid when the LAST item of the open
  // category is checked off. Tracked here in the parent (which never
  // remounts) so the transition is detected reliably. A -1 sentinel means
  // no category is open, so opening an already-finished category never fires.
  const selectedRemaining = activeCategory ? remainingOf(activeCategory, sessionKeys) : -1
  const prevRemainingRef = useRef(-1)
  useEffect(() => {
    const prev = prevRemainingRef.current
    prevRemainingRef.current = selectedRemaining

    if (prev > 0 && selectedRemaining === 0) {
      import('canvas-confetti').then(module => {
        module.default({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00'],
        })
      })

      // Nothing to return to when there's only one category — stay put and let
      // the completion state show instead of bouncing back to an empty grid.
      if (!isSingleCategory) {
        const timer = setTimeout(() => setSelectedCategoryId(null), 400)
        return () => clearTimeout(timer)
      }
    }
  }, [selectedRemaining, isSingleCategory])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-[#FDF6ED] flex flex-col text-right pt-safe"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white border-b border-black/5 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-black/80">מצב קנייה</h1>
            <p className="text-xs text-black/50">
              {totalItems === 0
                ? '' /* nothing to shop — the body's empty state says it all */
                : doneItems >= totalItems
                  ? 'סיימת את כל הרשימה 🎉'
                  : `נקנו ${doneItems} מתוך ${totalItems}`}
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
        {/* Overall progress bar — fills 0 → 100% as session items are checked off */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FFB74D] rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-24">
          <AnimatePresence mode="wait">
            {activeCategory ? (
              <CategoryDetail
                key={`detail-${activeCategory.id}`}
                category={activeCategory}
                sessionKeys={sessionKeys}
                onToggleItem={onToggleItem}
                onBack={handleBack}
                showBack={!isSingleCategory}
              />
            ) : (
              <CategoryGrid
                key="grid"
                categories={sessionCategories}
                sessionKeys={sessionKeys}
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

function CompletionBanner() {
  return (
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
  )
}

interface CategoryGridProps {
  categories: Category[]
  sessionKeys: Set<string>
  onSelect: (categoryId: number) => void
  allDone: boolean
}

function CategoryGrid({ categories, sessionKeys, onSelect, allDone }: CategoryGridProps) {
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
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {allDone && <CompletionBanner />}

      <div className="grid grid-cols-2 gap-3">
        {categories.map(category => {
          const remaining = remainingOf(category, sessionKeys)
          const isDone = remaining === 0
          return (
            <motion.button
              key={category.id}
              layout
              onClick={() => onSelect(category.id)}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border shadow-sm p-5 min-h-[120px] transition-colors ${
                isDone
                  ? 'bg-white border-green-200/70 hover:border-green-300'
                  : 'bg-white border-black/5 hover:border-[#FFB74D]/40'
              }`}
            >
              <span className="text-4xl">{category.emoji}</span>
              <span className="text-sm font-semibold text-black/80 text-center leading-tight">
                {category.name}
              </span>
              {isDone ? (
                <>
                  <span className="text-xs font-medium text-green-600">הושלם</span>
                  <span className="absolute top-2.5 left-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                </>
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
  sessionKeys: Set<string>
  onToggleItem: (categoryId: number, itemId: number) => void
  onBack: () => void
  showBack: boolean
}

function CategoryDetail({ category, sessionKeys, onToggleItem, onBack, showBack }: CategoryDetailProps) {
  // Only session items (unchecked at entry) appear here; anything bought before
  // shopping mode opened stays out of view entirely.
  const sessionItems = sessionItemsOf(category, sessionKeys)
  const remainingItems = sessionItems.filter(item => !item.purchased)
  const completedItems = sessionItems.filter(item => item.purchased)
  // Default to revealing completed items only when nothing is left to buy
  const [showCompleted, setShowCompleted] = useState(remainingItems.length === 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {/* Back to grid — hidden when this is the only category (nothing to pick).
          Styled as a clear, full-affordance button so it reads as the obvious
          way out of a category and not an easy-to-miss text link. */}
      {showBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 rounded-full border border-[#FFB74D]/40 bg-white text-[#F57C00] text-sm font-semibold ps-3 pe-4 py-2 shadow-sm hover:bg-[#FFF3E0] active:scale-[0.98] transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה לכל הקטגוריות</span>
        </button>
      )}

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
      {remainingItems.length > 0 && (
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
      )}

      {/* Items bought during this shopping run (collapsible) so mistakes can be undone */}
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
                transition={{ duration: 0.13, ease: 'easeOut' }}
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
      transition={{ duration: 0.13, ease: 'easeOut' }}
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
