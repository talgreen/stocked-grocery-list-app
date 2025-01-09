'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initialCategories } from '../types/categories'
import { Item } from '../types/item'
import AddItemForm from './AddItemForm'
import CategoryList from './CategoryList'
import CategoryScroller from './CategoryScroller'
import Fireworks from './Fireworks'
import ShareButton from './ShareButton'
import SparkleIcon from './SparkleIcon'

export default function HomeScreen() {
  const [categories, setCategories] = useState(initialCategories)
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const [isScrollLocked, setIsScrollLocked] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const HEADER_HEIGHT = 120

  const handleCategoryChange = useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId);
    
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - HEADER_HEIGHT;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleAddItem = (newItem: Omit<Item, 'id' | 'purchased'>, categoryId: number) => {
    setCategories(prevCategories => {
      return prevCategories.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: [
              ...category.items,
              {
                id: Math.max(...category.items.map(i => i.id), 0) + 1,
                ...newItem,
                purchased: false
              }
            ]
          }
        }
        return category
      })
    })
    setIsAddFormOpen(false)
  }

  const handleAddCategory = (categoryName: string): number => {
    const newCategory = {
      id: Math.max(...categories.map(c => c.id)) + 1,
      name: categoryName,
      items: []
    }
    setCategories(prevCategories => [...prevCategories, newCategory])
    return newCategory.id
  }

  const handleToggleItem = (categoryId: number, itemId: number) => {
    setCategories(prevCategories => {
      const newCategories = prevCategories.map(category => 
        category.id === categoryId 
          ? {
              ...category, 
              items: category.items.map(item => 
                item.id === itemId ? { ...item, purchased: !item.purchased } : item
              ).sort((a, b) => {
                if (a.purchased === b.purchased) return 0
                if (a.purchased) return 1
                return -1
              })
            }
          : category
      )

      // Check if all items in the category are now purchased
      const category = newCategories.find(c => c.id === categoryId)
      if (category && category.items.length > 0 && category.items.every(item => item.purchased)) {
        setShowFireworks(true)
      }

      return newCategories
    })
  }

  const handleDeleteItem = (categoryId: number, itemId: number) => {
    setCategories(categories.map(category =>
      category.id === categoryId
        ? { ...category, items: category.items.filter(item => item.id !== itemId) }
        : category
    ))
  }

  const handleEditItem = (categoryId: number, itemId: number, newComment: string) => {
    setCategories(categories.map(category =>
      category.id === categoryId
        ? {
            ...category,
            items: category.items.map(item =>
              item.id === itemId ? { ...item, comment: newComment } : item
            )
          }
        : category
    ))
  }

  const totalItems = categories.reduce((sum, category) => sum + category.items.length, 0)
  const uncheckedItems = categories.reduce((sum, category) => sum + category.items.filter(item => !item.purchased).length, 0)

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FDF6ED]">
      <header className="bg-white/50 backdrop-blur-sm border-b border-black/5 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#FFB74D] flex items-center gap-2">
              Stocked
              <SparkleIcon />
            </h1>
          </div>
          <ShareButton categories={categories} />
        </div>
      </header>
      <nav className="bg-white/50 backdrop-blur-sm border-b border-black/5 shadow-sm z-20 sticky top-0">
        <div className="max-w-2xl mx-auto">
          <CategoryScroller 
            categories={categories}
            onCategoryChange={handleCategoryChange}
            activeCategoryId={activeCategoryId}
          />
        </div>
      </nav>
      <main className="flex-grow max-w-2xl w-full mx-auto p-6 pb-24">
        <div className="mb-6 text-sm text-muted-foreground font-medium">
          {uncheckedItems} of {totalItems} items remaining
        </div>
        <CategoryList 
          categories={categories}
          onToggleItem={handleToggleItem}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
          onCategoryChange={setActiveCategoryId}
        />
      </main>
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-0 right-0 mx-auto max-w-2xl px-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-black/5 add-item-form">
              <AddItemForm 
                onAdd={handleAddItem} 
                onAddCategory={handleAddCategory}
                onClose={() => setIsAddFormOpen(false)} 
                categories={categories}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setIsAddFormOpen(prev => !prev)}
          className="bg-[#FFB74D] hover:bg-[#FFA726] text-white p-4 rounded-full hover:shadow-md transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      {showFireworks && (
        <Fireworks onComplete={() => setShowFireworks(false)} />
      )}
    </div>
  )
}

