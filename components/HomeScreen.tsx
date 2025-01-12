'use client'

import { createNewList, getList, updateList } from '@/lib/db'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initialCategories } from '../types/categories'
import { Item } from '../types/item'
import AddItemForm from './AddItemForm'
import CategoryList from './CategoryList'
import CategoryScroller from './CategoryScroller'
import Fireworks from './Fireworks'
import ProgressHeader from './ProgressHeader'
import ShareButton from './ShareButton'
import SparkleIcon from './SparkleIcon'

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const [isScrollLocked, setIsScrollLocked] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()
  const params = useParams()
  const listId = params.listId as string
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  const HEADER_HEIGHT = 140

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

  const handleAddItemWithCategory = async (item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string) => {
    // Create a new item object
    const newItem = {
      ...item,
      id: Date.now(),
      purchased: false,
      comment: item.comment || '',
      photo: item.photo || null,
    };

    // Find existing category first
    let updatedCategories = [...categories];
    let categoryId: number;

    const existingCategory = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (existingCategory) {
      // Use existing category
      categoryId = existingCategory.id;
    } else {
      // Create new category only if it doesn't exist
      const maxId = Math.max(...categories.map(cat => cat.id), 0);
      const newCategory = {
        id: maxId + 1,
        emoji: emoji,
        name: categoryName,
        items: [],
      };

      updatedCategories.push(newCategory);
      categoryId = newCategory.id;
    }

    // Add the new item to the appropriate category
    updatedCategories = updatedCategories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: [...category.items.filter(item => !item.purchased), newItem, ...category.items.filter(item => item.purchased)],
        };
      }
      return category;
    });

    try {
      setCategories(updatedCategories);
      await updateList(listId, updatedCategories);
    } catch (error) {
      console.error('Error updating list:', error);
      setCategories(categories);
    }
  };

  const handleToggleItem = async (categoryId: number, itemId: number) => {
    const updatedCategories = categories.map(category =>
      category.id === categoryId
        ? {
            ...category,
            items: category.items.map(item =>
              item.id === itemId
                ? { ...item, purchased: !item.purchased }
                : item
            ).sort((a, b) => (a.purchased === b.purchased) ? 0 : a.purchased ? 1 : -1)
          }
        : category
    )

    setCategories(updatedCategories)
    
    if (listId) {
      try {
        await updateList(listId, updatedCategories)
      } catch (error) {
        console.error('Error updating list:', error)
        setCategories(categories)
      }
    }
  }

  const handleDeleteItem = async (categoryId: number, itemId: number) => {
    const updatedCategories = categories.map(category =>
      category.id === categoryId
        ? { ...category, items: category.items.filter(item => item.id !== itemId) }
        : category
    )

    setCategories(updatedCategories)
    
    if (listId) {
      try {
        await updateList(listId, updatedCategories)
      } catch (error) {
        console.error('Error updating list:', error)
        setCategories(categories)
      }
    }
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

  const handleToggleAll = () => {
    setIsAllExpanded(!isAllExpanded)
    setExpandedCategories(isAllExpanded ? [] : categories.map(cat => cat.id))
  }

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    async function initializeList() {
      setIsLoading(true)
      try {
        const data = await getList(listId)
        if (data?.categories) {
          setCategories(data.categories)
          if (data.categories.length > 0) {
            setActiveCategoryId(data.categories[0].id)
          }
        } else {
          await createNewList(listId, initialCategories)
          setCategories(initialCategories)
        }
      } catch (error) {
        console.error('Error initializing list:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeList()
  }, [listId])

  useEffect(() => {
    if (isAddFormOpen) {
      // Small delay to ensure the modal is rendered
      setTimeout(() => {
        modalRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }, [isAddFormOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF6ED]">
        <header className="bg-white/50 backdrop-blur-sm border-b border-black/5 shadow-sm">
          <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
            </div>
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
          </div>
        </header>
        <nav className="bg-white/50 backdrop-blur-sm border-b border-black/5 shadow-sm">
          <div className="max-w-2xl mx-auto px-6 py-3">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 animate-pulse rounded-full" />
              ))}
            </div>
          </div>
        </nav>
        <main className="flex-grow max-w-2xl w-full mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-6 w-6 bg-gray-200 animate-pulse rounded-full" />
                  <div className="h-6 w-32 bg-gray-200 animate-pulse rounded-lg" />
                </div>
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-gray-200 animate-pulse rounded" />
                      <div className="h-5 w-48 bg-gray-200 animate-pulse rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

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
          <ProgressHeader
            uncheckedItems={uncheckedItems}
            totalItems={totalItems}
            isAllExpanded={isAllExpanded}
            onToggleAll={handleToggleAll}
          />
        </div>
      </nav>
      <main className="flex-grow max-w-2xl w-full mx-auto p-6 pb-24">
        <CategoryList 
          categories={categories}
          onToggleItem={handleToggleItem}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
          onCategoryChange={setActiveCategoryId}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
        />
      </main>
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-0 right-0 mx-auto max-w-2xl px-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-black/5 add-item-form">
              <AddItemForm 
                onAdd={handleAddItemWithCategory}
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

