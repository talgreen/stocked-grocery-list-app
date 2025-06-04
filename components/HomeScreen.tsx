'use client'

import { createNewList, getList, updateList } from '@/lib/db'
import { Category, initialCategories } from '@/types/categories'
import { Item } from '@/types/item'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import AddItemForm from './AddItemForm'
import CategoryList from './CategoryList'
import ProgressHeader from './ProgressHeader'
import ShareButton from './ShareButton'
import SparkleIcon from './SparkleIcon'

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [showEmptyCategories, setShowEmptyCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const listId = (params?.listId as string) || 'default'
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])

  // Filter items based on search query
  const getSearchResults = () => {
    if (!searchQuery.trim()) return []
    
    const results: Array<{
      item: Item
      category: Category
      categoryId: number
    }> = []
    
    categories.forEach(category => {
      category.items.forEach(item => {
        if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ item, category, categoryId: category.id })
        }
      })
    })
    
    return results
  }

  const searchResults = getSearchResults()
  const isSearchMode = searchQuery.trim().length > 0

  // Group search results by category
  const groupedSearchResults = searchResults.reduce((acc, { item, category, categoryId }) => {
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category,
        items: []
      }
    }
    acc[categoryId].items.push(item)
    return acc
  }, {} as Record<number, { category: Category; items: Item[] }>)

  // Helper function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return <mark key={index} className="bg-yellow-200 rounded px-1">{part}</mark>
      }
      return part
    })
  }

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

  const handleAddItem = async (categoryId: number, name: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      purchased: false,
      comment: '',
      categoryId
    };

    const updatedCategories = categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          items: [...c.items.filter(item => !item.purchased), newItem, ...c.items.filter(item => item.purchased)]
        };
      }
      return c;
    });

    setCategories(updatedCategories);
    
    if (listId) {
      try {
        await updateList(listId, updatedCategories);
      } catch (error) {
        console.error('Error updating list:', error);
        setCategories(categories); // Revert on error
      }
    }
  };

  const handleUpdateItemCategory = async (itemId: number, newCategoryId: number) => {
    try {
      // First find which category currently has the item
      let itemToMove: Item | null = null;
      let sourceCategory: number | null = null;

      for (const category of categories) {
        const foundItem = category.items.find(item => item.id === itemId);
        if (foundItem) {
          itemToMove = foundItem;
          sourceCategory = category.id;
          break;
        }
      }

      if (!itemToMove || sourceCategory === null) {
        console.error('Item not found');
        return;
      }

      // Remove from source category and add to target category
      const updatedCategories = categories.map(category => {
        if (category.id === sourceCategory) {
          return {
            ...category,
            items: category.items.filter(item => item.id !== itemId)
          };
        } else if (category.id === newCategoryId) {
          return {
            ...category,
            items: [...category.items.filter(item => !item.purchased), itemToMove, ...category.items.filter(item => item.purchased)]
          };
        }
        return category;
      });

      setCategories(updatedCategories);
      await updateList(listId, updatedCategories);
    } catch (error) {
      console.error('Error updating item category:', error);
      // Revert changes on error
    }
  };

  const uncheckedItems = categories.reduce((total, category) => 
    total + category.items.filter(item => !item.purchased).length, 0
  )
  const totalItems = categories.reduce((total, category) => 
    total + category.items.length, 0
  )

  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpandedCategories([])
    } else {
      setExpandedCategories(categories.map(c => c.id))
    }
    setIsAllExpanded(!isAllExpanded)
  }

  useEffect(() => {
    async function initializeList() {
      try {
        setIsLoading(true)
        if (listId && listId !== 'default') {
          const data = await getList(listId)
          if (data) {
            setCategories(data.categories)
          } else {
            await createNewList(listId, initialCategories)
            setCategories(initialCategories)
          }
        } else {
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
      <div className="bg-white border-b border-black/5 shadow-sm sticky top-0 pt-safe z-30">
        <header className="max-w-2xl mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#FFB74D] flex items-center gap-2">
              Stocked
              <SparkleIcon />
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ShareButton />
          </div>
        </header>
        <nav className="max-w-2xl mx-auto">
          <div className="bg-white">
            <ProgressHeader
              uncheckedItems={uncheckedItems}
              totalItems={totalItems}
              isAllExpanded={isAllExpanded}
              onToggleAll={handleToggleAll}
              showEmptyCategories={showEmptyCategories}
              onToggleEmptyCategories={() => setShowEmptyCategories(!showEmptyCategories)}
            />
            {/* Search Box */}
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="חפש פריטים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
      <main className="flex-grow flex flex-col max-w-2xl w-full mx-auto p-6 pb-24 text-right relative">
        <div className="h-4" aria-hidden="true" />
        
        {/* Search Results */}
        {isSearchMode && (
          <div className="space-y-4 mb-6">
            {searchResults.length > 0 ? (
              Object.values(groupedSearchResults).map(({ category, items }) => (
                <div key={category.id} className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{category.emoji}</span>
                      <span>{category.name}</span>
                    </div>
                  </div>
                  <div className="bg-white">
                    {items.map((item, index) => (
                      <div key={item.id} className={`px-4 py-2 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <motion.button
                            onClick={() => handleToggleItem(category.id, item.id)}
                            className={`flex-shrink-0 transition-colors duration-150 mt-0.5 ${
                              item.purchased ? 'text-[#FFB74D]' : 'text-black/20 hover:text-[#FFB74D]'
                            }`}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.15 }}
                          >
                            {item.purchased ? (
                              <div className="h-5 w-5">✓</div>
                            ) : (
                              <div className="h-5 w-5 border border-gray-300 rounded"></div>
                            )}
                          </motion.button>
                          
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className={`text-sm truncate ${
                              item.purchased ? 'line-through text-black/40' : 'text-black/80'
                            }`}>
                              {highlightText(item.name, searchQuery)}
                            </span>
                            {item.comment && (
                              <span className="text-xs text-black/40 truncate">
                                ({item.comment})
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteItem(category.id, item.id)}
                            className="flex-shrink-0 text-black/40 hover:text-red-500 transition-colors duration-200"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-black/5 shadow-sm">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">לא נמצאו תוצאות</h3>
                <p className="text-sm text-black/60">
                  נסה לחפש במילות מפתח אחרות
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category List - Only show when not in search mode */}
        {!isSearchMode && (
          <CategoryList 
            categories={showEmptyCategories ? categories : categories.filter(category => category.items.length > 0)}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            expandedCategories={expandedCategories}
            setExpandedCategories={setExpandedCategories}
            onUpdateItemCategory={handleUpdateItemCategory}
            onAddItem={handleAddItem}
            isSearchMode={isSearchMode}
          />
        )}

        <AnimatePresence>
          {isAddFormOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddFormOpen(false)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed inset-x-4 top-[10vh] bottom-[10vh] bg-white rounded-2xl z-50 overflow-hidden shadow-2xl max-w-md mx-auto"
              >
                <div className="h-full overflow-y-auto p-6">
                  <AddItemForm 
                    onAdd={handleAddItemWithCategory}
                    onClose={() => setIsAddFormOpen(false)}
                    categories={categories}
                  />
                </div>
              </motion.div>
            </>
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
    </div>
  )
}

