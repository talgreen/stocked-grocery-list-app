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

  const handleAddItemWithCategory = async (item: Omit<Item, 'id' | 'purchased'>, categoryName: string) => {
    // Create a new item object
    const newItem = {
      ...item,
      id: Date.now(), // Temporary ID for local use
      purchased: false,
      comment: item.comment || '',
      photo: item.photo || '',
    };

    // Determine if we need to create a new category
    let updatedCategories = [...categories];
    let categoryId: number;

    if (categoryName) {
      const maxId = Math.max(...categories.map(cat => cat.id), 0);
      const newCategory = {
        id: maxId + 1, // Use maxId + 1 for the new category ID
        name: categoryName,
        items: [],
      };

      updatedCategories.push(newCategory); // Add the new category to the array
      categoryId = newCategory.id; // Set the category ID to the new category
    } else {
      // If no new category, use the first category
      categoryId = categories[0]?.id; // Fallback to the first category
    }

    // Add the new item to the appropriate category
    updatedCategories = updatedCategories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: [...category.items.filter(item => !item.purchased), newItem, ...category.items.filter(item => item.purchased)], // Add new item to the end of unchecked items
        };
      }
      return category; // Return unchanged category
    });

    try {
      setCategories(updatedCategories); // Update local state
      await updateList(listId, updatedCategories); // Update Firebase with the new categories
    } catch (error) {
      console.error('Error updating list:', error);
      setCategories(categories); // Revert to previous state on error
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

  if (isLoading) return <div>Loading...</div>

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
          {uncheckedItems} מתוך {totalItems} פריטים נותרו        
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

