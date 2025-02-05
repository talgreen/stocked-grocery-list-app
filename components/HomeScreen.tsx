'use client'

import { createNewList, getList, updateList } from '@/lib/db'
import { Category, initialCategories } from '@/types/categories'
import { Item } from '@/types/item'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import AddItemForm from './AddItemForm'
import CategoryList from './CategoryList'
import CategoryScroller from './CategoryScroller'
import Fireworks from './Fireworks'
import HorizontalLayout from './HorizontalLayout'
import ProgressHeader from './ProgressHeader'
import ShareButton from './ShareButton'
import SparkleIcon from './SparkleIcon'

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showEmptyCategories, setShowEmptyCategories] = useState(false)
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical')
  const modalRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const listId = (params?.listId as string) || 'default'
  const scrollTimeout = useRef<NodeJS.Timeout>()
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1)
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])

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

  const handleUpdateItemCategory = async (itemId: number, newCategoryId: number) => {
    try {
      // First find which category currently has the item
      let itemToMove: Item | null = null;
      let sourceCategory: number | null = null;

      // First pass: find the item and its source
      categories.forEach(category => {
        const foundItem = category.items.find(item => item.id === itemId);
        if (foundItem) {
          itemToMove = foundItem;
          sourceCategory = category.id;
        }
      });

      if (!itemToMove || sourceCategory === null) {
        console.error('Item not found');
        return;
      }

      // Second pass: create the new categories array
      const updatedCategories = categories.map(category => {
        // If this is the target category, add the item
        if (category.id === newCategoryId) {
          const currentItems = category.items;
          // Split items into purchased and unpurchased
          const purchasedItems = currentItems.filter(item => item.purchased);
          const unpurchasedItems = currentItems.filter(item => !item.purchased);
          
          // Add the new item to unpurchased items
          return {
            ...category,
            items: [
              ...unpurchasedItems,
              { ...itemToMove, categoryId: newCategoryId } as Item,
              ...purchasedItems
            ]
          };
        }
        
        // If this is the source category, remove the item
        if (category.id === sourceCategory) {
          return {
            ...category,
            items: category.items.filter(item => item.id !== itemId)
          };
        }

        // Leave other categories unchanged
        return category;
      });

      setCategories(updatedCategories);
      await updateList(listId, updatedCategories);
    } catch (error) {
      console.error('Error updating item category:', error);
    }
  };

  const handleUncheckItems = async (itemsToUncheck: { item: Item, categoryName: string, emoji: string }[]) => {
    // Create a map for quick lookup of which items to uncheck
    const itemsMap = new Map(itemsToUncheck.map(({ item }) => [item.id, true]))

    // Update all items' purchased status in a single categories update
    const updatedCategories = categories.map(category => {
      const hasItemsToUpdate = category.items.some(item => itemsMap.has(item.id))
      if (!hasItemsToUpdate) return category

      return {
        ...category,
        items: category.items.map(item => {
          if (!itemsMap.has(item.id)) return item
          return { ...item, purchased: false }
        }).sort((a, b) => (a.purchased === b.purchased) ? 0 : a.purchased ? 1 : -1)
      }
    })

    try {
      setCategories(updatedCategories)
      await updateList(listId, updatedCategories)
    } catch (error) {
      console.error('Error updating list:', error)
      setCategories(categories)
      throw error // Re-throw to allow caller to handle the error
    }
  }

  const handleAddBulkItems = async (
    items: { item: Omit<Item, 'id' | 'purchased'>, categoryName: string, emoji: string }[],
    itemsToUncheck: { item: Item, categoryName: string, emoji: string }[]
  ) => {
    // Start with current state
    let updatedCategories = [...categories];

    // First, handle unchecking items if any
    if (itemsToUncheck.length > 0) {
      const itemsMap = new Map(itemsToUncheck.map(({ item }) => [item.id, true]))
      
      updatedCategories = updatedCategories.map(category => {
        const hasItemsToUpdate = category.items.some(item => itemsMap.has(item.id))
        if (!hasItemsToUpdate) return category

        return {
          ...category,
          items: category.items.map(item => {
            if (!itemsMap.has(item.id)) return item
            return { ...item, purchased: false }
          }).sort((a, b) => (a.purchased === b.purchased) ? 0 : a.purchased ? 1 : -1)
        }
      })
    }

    // Then, add new items if any
    if (items.length > 0) {
      // Process each item
      for (const { item, categoryName, emoji } of items) {
        // Create new item with all required fields
        const newItem = {
          id: Date.now() + Math.random(),
          name: item.name,
          purchased: false,
          comment: item.comment || '',
          // Only include photo if it exists
          ...(item.photo ? { photo: item.photo } : {})
        };

        // Find or create category
        let existingCategory = updatedCategories.find(c => 
          c.name.toLowerCase() === categoryName.toLowerCase()
        );

        if (!existingCategory) {
          // Create new category
          const maxId = Math.max(...updatedCategories.map(cat => cat.id), 0);
          existingCategory = {
            id: maxId + 1,
            emoji,
            name: categoryName,
            items: []
          };
          updatedCategories.push(existingCategory);
        }

        // Add item to category
        const categoryIndex = updatedCategories.findIndex(c => c.id === existingCategory!.id);
        if (categoryIndex !== -1) {
          const category = updatedCategories[categoryIndex];
          updatedCategories[categoryIndex] = {
            ...category,
            items: [
              ...category.items.filter(i => !i.purchased),
              newItem,
              ...category.items.filter(i => i.purchased)
            ]
          };
        }
      }
    }

    try {
      // Update state first
      setCategories(updatedCategories);
      // Then persist to Firebase
      await updateList(listId, updatedCategories);
    } catch (error) {
      console.error('Error updating list:', error);
      // Rollback on error
      setCategories(categories);
      throw error;
    }
  };

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
      <header className="bg-white border-b border-black/5 shadow-sm sticky top-[env(safe-area-inset-top)] z-30">
        <div className="max-w-2xl mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#FFB74D] flex items-center gap-2">
              Stocked
              <SparkleIcon />
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors duration-200"
            >
              {viewMode === 'vertical' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="18" rx="1" />
                  <rect x="14" y="3" width="7" height="18" rx="1" />
                </svg>
              )}
            </button>
            <ShareButton />
          </div>
        </div>
      </header>
      <nav className="bg-white border-b border-black/5 shadow-sm z-20 sticky top-[calc(env(safe-area-inset-top)+3.5rem)]">
        <div className="max-w-2xl mx-auto">
          {viewMode === 'vertical' && (
            <>
              <div className="bg-white">
                <CategoryScroller 
                  categories={showEmptyCategories ? categories : categories.filter(category => category.items.length > 0)}
                  onCategoryChange={handleCategoryChange}
                  activeCategoryId={activeCategoryId}
                />
                <ProgressHeader
                  uncheckedItems={uncheckedItems}
                  totalItems={totalItems}
                  isAllExpanded={isAllExpanded}
                  onToggleAll={handleToggleAll}
                  showEmptyCategories={showEmptyCategories}
                  onToggleEmptyCategories={() => setShowEmptyCategories(!showEmptyCategories)}
                />
              </div>
            </>
          )}
        </div>
      </nav>
      <main className="flex-grow flex flex-col max-w-2xl w-full mx-auto p-6 pb-24 text-right relative">
        {viewMode === 'vertical' ? (
          <CategoryList 
            categories={showEmptyCategories ? categories : categories.filter(category => category.items.length > 0)}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onCategoryChange={setActiveCategoryId}
            expandedCategories={expandedCategories}
            setExpandedCategories={setExpandedCategories}
            onUpdateItemCategory={handleUpdateItemCategory}
          />
        ) : (
          <HorizontalLayout
            categories={showEmptyCategories ? categories : categories.filter(category => category.items.length > 0)}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onUpdateItemCategory={handleUpdateItemCategory}
            activeCategoryId={activeCategoryId}
            onCategoryChange={handleCategoryChange}
          />
        )}
        <AnimatePresence>
          {isAddFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-t-2xl shadow-lg border border-black/5 fixed left-0 right-0 bottom-0 max-w-2xl mx-auto overflow-hidden"
              style={{ maxHeight: "85vh" }}
            >
              <div className="overflow-y-auto p-6">
                <AddItemForm 
                  onAdd={handleAddItemWithCategory}
                  onUncheck={handleUncheckItems}
                  onBulkAdd={handleAddBulkItems}
                  onClose={() => setIsAddFormOpen(false)}
                  categories={categories}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {!isAddFormOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-30"
          >
            <button
              onClick={() => setIsAddFormOpen(prev => !prev)}
              className="bg-[#FFB74D] hover:bg-[#FFA726] text-white p-4 rounded-full hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {showFireworks && <Fireworks />}
    </div>
  )
}

