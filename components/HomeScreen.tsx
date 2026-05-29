'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { TabView, useTabView } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'
import { OpenRouter } from '@/lib/openrouter'
import { computeRepeatSuggestions, updateItemPurchaseStats } from '@/lib/repeat-suggester'
import { Category, initialCategories } from '@/types/categories'
import { Item } from '@/types/item'
import { PurposeList } from '@/types/purpose-list'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Pencil, Plus, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import CategoryList from './CategoryList'
import CompactHeader from './CompactHeader'
import EmptySearchState from './EmptySearchState'
import RepeatSuggestions from './RepeatSuggestions'

const SettingsPanel = dynamic(() => import('./SettingsPanel'))
const RecipesTab = dynamic(() => import('./RecipesTab'))
const NameEmojiModal = dynamic(() => import('./NameEmojiModal'))

const PURPOSE_CATEGORY_PALETTE = ['📦', '👕', '👟', '🧴', '📄', '🔌', '🍴', '💊', '🎮', '📚', '🧸', '🏷️']

// Lazy load modal components to reduce initial bundle size
const AddItemForm = dynamic(() => import('./AddItemForm'), {
  loading: () => <div className="text-center py-8">טוען...</div>
})

const EditItemModal = dynamic(() => import('./EditItemModal'), {
  loading: () => <div className="text-center py-8">טוען...</div>
})

const MS_PER_DAY = 1000 * 60 * 60 * 24

// Normalize category name for comparison - strips leading emojis and whitespace
const normalizeCategory = (name: string): string =>
  name.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+/gu, '').trim()

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [purposeLists, setPurposeLists] = useState<PurposeList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const listId = (params?.listId as string) || 'default'
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingItemCategoryId, setEditingItemCategoryId] = useState<number | null>(null)
  const [pendingScrollItemId, setPendingScrollItemId] = useState<number | null>(null)
  const [pendingAddCount, setPendingAddCount] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // Purpose list modal: 'create' for a new list, or an existing list for edit/delete
  const [purposeModal, setPurposeModal] = useState<{ mode: 'create' } | { mode: 'edit'; list: PurposeList } | null>(null)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const { activeTab, setActiveTab, activePurposeListId, selectPurposeList } = useTabView()
  const { flags } = useSettings()

  // When a purpose list tab is active, all reads/writes target that list's
  // categories instead of the main grocery/pharmacy categories.
  const activePurposeList = useMemo(
    () => (activeTab === 'purpose' ? purposeLists.find(p => p.id === activePurposeListId) ?? null : null),
    [activeTab, activePurposeListId, purposeLists]
  )
  const isPurposeMode = activePurposeList !== null
  const currentCategories = isPurposeMode ? activePurposeList!.categories : categories

  // Single commit point: routes the updated categories to either the main list
  // or the active purpose list, persists the whole document, and reverts on error.
  const commitCategories = async (nextCategories: Category[]) => {
    if (isPurposeMode && activePurposeList) {
      const previous = purposeLists
      const nextPurposeLists = purposeLists.map(p =>
        p.id === activePurposeList.id ? { ...p, categories: nextCategories } : p
      )
      setPurposeLists(nextPurposeLists)
      try {
        await updateList(listId, categories, nextPurposeLists)
      } catch (error) {
        console.error('Error updating list:', error)
        setPurposeLists(previous)
      }
    } else {
      const previous = categories
      setCategories(nextCategories)
      try {
        await updateList(listId, nextCategories, purposeLists)
      } catch (error) {
        console.error('Error updating list:', error)
        setCategories(previous)
      }
    }
  }

  // Filter items based on search query
  const getSearchResults = () => {
    if (!searchQuery.trim()) return []
    
    const results: Array<{
      item: Item
      category: Category
      categoryId: number
    }> = []
    
    currentCategories.forEach(category => {
      // Filter categories based on active tab (no-op in purpose mode)
      if (activeTab === 'grocery' && category.name === 'בית מרקחת') {
        return // Skip pharmacy category when in grocery mode
      }
      if (activeTab === 'pharmacy' && category.name !== 'בית מרקחת') {
        return // Skip non-pharmacy categories when in pharmacy mode
      }

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
  const hasExactMatch = searchResults.some(
    ({ item }) => item.name.trim().toLowerCase() === searchQuery.trim().toLowerCase()
  )

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

  const repeatSuggestions = useMemo(() => {
    // Repeat suggestions are grocery/pharmacy-only (EWMA purchase prediction).
    if (isPurposeMode) return []

    const relevantCategories = categories.filter(category => {
      if (activeTab === 'grocery') return category.name !== 'בית מרקחת'
      if (activeTab === 'pharmacy') return category.name === 'בית מרקחת'
      return true
    })

    return computeRepeatSuggestions(relevantCategories)
  }, [categories, activeTab, isPurposeMode])

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
    // Check for duplicates first
    if (checkDuplicateItem(item.name, item.comment || '')) {
      toast.error('הפריט כבר קיים ברשימה', {
        style: {
          background: '#FFA726',
          color: 'white',
        }
      });
      return;
    }

    // Create a new item object
    const newItem: Item = {
      ...item,
      id: Date.now(),
      purchased: false,
      comment: item.comment || '',
      photo: item.photo || null,
      lastPurchaseAt: null,
      expectedGapDays: null,
      gapVariance: null,
      decayedCount: 0,
      purchaseCount: 0,
      snoozeUntil: null,
    };

    // Find existing category first
    let updatedCategories = [...currentCategories];
    let categoryId: number;

    const normalizedInput = normalizeCategory(categoryName);
    const existingCategory = currentCategories.find(c =>
      normalizeCategory(c.name) === normalizedInput
    );

    if (existingCategory) {
      // Use existing category
      categoryId = existingCategory.id;
    } else {
      // Create new category only if it doesn't exist
      const maxId = Math.max(...currentCategories.map(cat => cat.id), 0);
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

    setExpandedCategories((prev) => (
      prev.includes(categoryId) ? prev : [...prev, categoryId]
    ))
    setPendingScrollItemId(newItem.id)
    await commitCategories(updatedCategories);
  };

  // Handle adding item with background categorization (closes form immediately)
  const handleAddItemBackground = async (
    itemName: string,
    itemComment: string,
    categorySelection: string,
    currentActiveTab: TabView
  ) => {
    // Check for duplicates first
    if (checkDuplicateItem(itemName, itemComment)) {
      toast.error('הפריט כבר קיים ברשימה', {
        style: {
          background: '#FFA726',
          color: 'white',
        }
      });
      return;
    }

    // Increment pending count to show indicator
    setPendingAddCount(prev => prev + 1);

    try {
      let category: string;
      let emoji: string;

      if (isPurposeMode) {
        // Purpose lists use manual category selection only (no AI categorization)
        const selectedCategory = currentCategories.find(c => c.id.toString() === categorySelection);
        if (!selectedCategory) throw new Error('Category not found');
        category = selectedCategory.name;
        emoji = selectedCategory.emoji;
      } else if (currentActiveTab === 'pharmacy') {
        // For pharmacy mode, always use pharmacy category without smart categorization
        category = 'בית מרקחת';
        emoji = '💊';
      } else if (categorySelection === 'auto') {
        // Smart categorization via API
        const result = await OpenRouter.categorize(`${itemName}${itemComment ? ` - ${itemComment}` : ''}`);
        category = result.category?.trim() || 'אחר';
        // Look up emoji from existing category, fallback to default
        const matchedCategory = categories.find(c => normalizeCategory(c.name) === normalizeCategory(category));
        emoji = matchedCategory?.emoji || '📦';
      } else {
        // Use manually selected category
        const selectedCategory = categories.find(c => c.id.toString() === categorySelection);
        if (!selectedCategory) throw new Error('Category not found');
        category = selectedCategory.name;
        emoji = selectedCategory.emoji;
      }

      await handleAddItemWithCategory(
        { name: itemName, comment: itemComment },
        category,
        emoji
      );

      toast.success(`הפריט "${itemName}" נוסף לקטגוריה ${emoji} ${category}`);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('שגיאה בהוספת הפריט');
    } finally {
      // Decrement pending count
      setPendingAddCount(prev => prev - 1);
    }
  };

  const handleToggleItem = async (categoryId: number, itemId: number) => {
    // Clear search when toggling an item in search mode
    if (searchQuery.trim()) {
      setSearchQuery('')
    }

    const now = new Date()
    const updatedCategories = currentCategories.map(category => {
      if (category.id !== categoryId) return category

      const updatedItems = category.items
        .map(item => {
          if (item.id !== itemId) {
            return item
          }

          if (item.purchased) {
            return {
              ...item,
              purchased: false,
              snoozeUntil: null,
            }
          }

          // Purpose items don't track purchase stats (no repeat suggestions)
          return isPurposeMode ? { ...item, purchased: true } : updateItemPurchaseStats(item, now)
        })
        .sort((a, b) => (a.purchased === b.purchased ? 0 : a.purchased ? 1 : -1))

      return {
        ...category,
        items: updatedItems,
      }
    })

    await commitCategories(updatedCategories)
  }

  const handleSnoozeItem = async (categoryId: number, itemId: number, days: number) => {
    if (days <= 0) return

    const snoozeUntil = new Date(Date.now() + days * MS_PER_DAY).toISOString()

    const updatedCategories = currentCategories.map(category => {
      if (category.id !== categoryId) return category

      return {
        ...category,
        items: category.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                snoozeUntil,
              }
            : item
        ),
      }
    })

    await commitCategories(updatedCategories)
  }

  const handleDeleteItem = async (categoryId: number, itemId: number) => {
    const updatedCategories = currentCategories.map(category =>
      category.id === categoryId
        ? { ...category, items: category.items.filter(item => item.id !== itemId) }
        : category
    )

    await commitCategories(updatedCategories)
  }

  const handleAddItem = async (categoryId: number, name: string) => {
    const category = currentCategories.find(c => c.id === categoryId);
    if (!category) return;

    const newItem: Item = {
      id: Date.now(),
      name: name.trim(),
      purchased: false,
      comment: '',
      categoryId,
      lastPurchaseAt: null,
      expectedGapDays: null,
      gapVariance: null,
      decayedCount: 0,
      purchaseCount: 0,
      snoozeUntil: null,
    };

    const updatedCategories = currentCategories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          items: [...c.items.filter(item => !item.purchased), newItem, ...c.items.filter(item => item.purchased)]
        };
      }
      return c;
    });

    setExpandedCategories((prev) => (
      prev.includes(categoryId) ? prev : [...prev, categoryId]
    ))
    setPendingScrollItemId(newItem.id)
    await commitCategories(updatedCategories);
  };

  // Check if an item with the same name and description already exists in the current tab
  const checkDuplicateItem = (name: string, comment: string = '') => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedComment = comment.trim().toLowerCase();

    for (const category of currentCategories) {
      // Only check categories relevant to the current tab (no-op in purpose mode)
      if (activeTab === 'grocery' && category.name === 'בית מרקחת') {
        continue; // Skip pharmacy category when in grocery mode
      }
      if (activeTab === 'pharmacy' && category.name !== 'בית מרקחת') {
        continue; // Skip non-pharmacy categories when in pharmacy mode
      }

      for (const item of category.items) {
        if (item.name.trim().toLowerCase() === trimmedName && 
            (item.comment || '').trim().toLowerCase() === trimmedComment) {
          return true;
        }
      }
    }
    return false;
  };

  // Handle Quick Add from search results
  const handleQuickAddItem = async () => {
    if (!searchQuery.trim()) return;
    // AI quick-add is grocery/pharmacy-only; purpose lists add items manually.
    if (isPurposeMode) return;

    const itemName = searchQuery.trim();

    // Check for duplicates
    if (checkDuplicateItem(itemName)) {
      toast.error('הפריט כבר קיים ברשימה', {
        style: {
          background: '#FFA726',
          color: 'white',
        }
      });
      return;
    }

    // Clear search immediately to switch back to normal view
    setSearchQuery('');

    // Show adding indicator
    setPendingAddCount(prev => prev + 1);

    try {
      let category: string;
      let emoji: string;

      if (activeTab === 'pharmacy') {
        // For pharmacy mode, always use pharmacy category without smart categorization
        category = 'בית מרקחת';
        emoji = '💊';
      } else {
        // For grocery mode, use smart categorization
        const result = await OpenRouter.categorize(itemName);
        category = result.category?.trim() || 'אחר';
        // Look up emoji from existing category, fallback to default
        const matchedCategory = categories.find(c => normalizeCategory(c.name) === normalizeCategory(category));
        emoji = matchedCategory?.emoji || '📦';
      }

      await handleAddItemWithCategory(
        { name: itemName, comment: '' },
        category,
        emoji
      );

      toast.success(`הפריט "${itemName}" נוסף לקטגוריה ${emoji} ${category}`);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('שגיאה בהוספת הפריט');
    } finally {
      // Hide adding indicator
      setPendingAddCount(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (!pendingScrollItemId) return

    const timeout = window.setTimeout(() => {
      const element = document.querySelector(`[data-item-id="${pendingScrollItemId}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setPendingScrollItemId(null)
    }, 100)

    return () => window.clearTimeout(timeout)
  }, [categories, pendingScrollItemId])

  // Handle updating an existing item
  const handleUpdateItem = async (itemId: number, name: string, comment: string, newCategoryId: number, purchaseCount?: number) => {
    try {
      // Find the item and its current category
      let itemToUpdate: Item | null = null;
      let sourceCategory: number | null = null;

      for (const category of currentCategories) {
        const foundItem = category.items.find(item => item.id === itemId);
        if (foundItem) {
          itemToUpdate = foundItem;
          sourceCategory = category.id;
          break;
        }
      }

      if (!itemToUpdate || sourceCategory === null) {
        console.error('Item not found');
        return;
      }

      // Create updated item
      const updatedItem = {
        ...itemToUpdate,
        name,
        comment,
        ...(purchaseCount !== undefined ? { purchaseCount } : {}),
      };

      let updatedCategories;

      if (sourceCategory === newCategoryId) {
        // Same category - just update the item
        updatedCategories = currentCategories.map(category => {
          if (category.id === sourceCategory) {
            return {
              ...category,
              items: category.items.map(item =>
                item.id === itemId ? updatedItem : item
              )
            };
          }
          return category;
        });
      } else {
        // Different category - move the item
        updatedCategories = currentCategories.map(category => {
          if (category.id === sourceCategory) {
            // Remove from source category
            return {
              ...category,
              items: category.items.filter(item => item.id !== itemId)
            };
          } else if (category.id === newCategoryId) {
            // Add to target category
            return {
              ...category,
              items: [...category.items.filter(item => !item.purchased), updatedItem, ...category.items.filter(item => item.purchased)]
            };
          }
          return category;
        });
      }

      await commitCategories(updatedCategories);
      toast.success('הפריט עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('שגיאה בעדכון הפריט');
    }
  };

  // Handle adding multiple ingredients from a recipe
  const handleAddRecipeIngredients = async (ingredients: Array<{ name: string; comment: string }>) => {
    setPendingAddCount(prev => prev + ingredients.length)

    let categorizedItems: Array<{ name: string; comment: string; category: string }>

    try {
      // Batch categorize all ingredients in a single API call
      const batchResults = await OpenRouter.categorizeBatch(
        ingredients.map(ing => ({ name: ing.name, comment: ing.comment || undefined }))
      )

      categorizedItems = ingredients.map((ing, i) => ({
        name: ing.name,
        comment: ing.comment,
        category: batchResults[i]?.category || 'אחר',
      }))
    } catch (error) {
      console.error('Batch categorization failed, falling back to אחר:', error)

      categorizedItems = ingredients.map(ing => ({
        name: ing.name,
        comment: ing.comment,
        category: 'אחר',
      }))
    }

    // Build all items into categories in a single pass to avoid stale state
    let updatedCategories = [...categories]
    let addedCount = 0
    const expandIds: number[] = []

    for (const item of categorizedItems) {
      // Skip duplicates
      if (checkDuplicateItem(item.name, item.comment)) {
        setPendingAddCount(prev => prev - 1)
        continue
      }

      const normalizedInput = normalizeCategory(item.category)
      let existingCategory = updatedCategories.find(c => normalizeCategory(c.name) === normalizedInput)

      if (!existingCategory) {
        const maxId = Math.max(...updatedCategories.map(cat => cat.id), 0)
        existingCategory = {
          id: maxId + 1,
          emoji: '📦',
          name: item.category,
          items: [],
        }
        updatedCategories.push(existingCategory)
      }

      const newItem: Item = {
        id: Date.now() + addedCount,
        name: item.name,
        comment: item.comment || '',
        purchased: false,
        photo: null,
        lastPurchaseAt: null,
        expectedGapDays: null,
        gapVariance: null,
        decayedCount: 0,
        purchaseCount: 0,
        snoozeUntil: null,
      }

      const categoryId = existingCategory.id
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: [...cat.items.filter(i => !i.purchased), newItem, ...cat.items.filter(i => i.purchased)],
          }
        }
        return cat
      })

      expandIds.push(categoryId)
      addedCount++
      setPendingAddCount(prev => prev - 1)
    }

    if (addedCount > 0) {
      try {
        setCategories(updatedCategories)
        setExpandedCategories(prev => [...new Set([...prev, ...expandIds])])
        await updateList(listId, updatedCategories, purposeLists)
        toast.success(`נוספו ${addedCount} מצרכים לרשימה`)
      } catch (error) {
        console.error('Error updating list:', error)
        setCategories(categories)
        toast.error('שגיאה בהוספת מצרכים')
      }
    }
  }

  // Handle opening edit modal
  const handleEditItem = (item: Item, categoryId: number) => {
    setEditingItem(item);
    setEditingItemCategoryId(categoryId);
  };

  // The categories that contribute to the progress ring for the active tab.
  const visibleCategories = isPurposeMode
    ? currentCategories
    : categories.filter(category => {
        if (activeTab === 'grocery') return category.name !== 'בית מרקחת'
        if (activeTab === 'pharmacy') return category.name === 'בית מרקחת'
        return true
      })
  const uncheckedItems = visibleCategories.reduce(
    (total, category) => total + category.items.filter(item => !item.purchased).length, 0
  )
  const totalItems = visibleCategories.reduce(
    (total, category) => total + category.items.length, 0
  )

  useEffect(() => {
    setIsLoading(true)

    const unsubscribe = subscribeToList(
      listId,
      data => {
        setCategories(data.categories)
        setPurposeLists(data.purposeLists ?? [])
        setIsLoading(false)
      },
      error => {
        console.error('Error subscribing to list:', error)
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [listId])

  // If the active purpose list disappears (deleted locally or by another client),
  // fall back to the grocery tab.
  useEffect(() => {
    if (activeTab === 'purpose' && activePurposeListId && !purposeLists.some(p => p.id === activePurposeListId)) {
      setActiveTab('grocery')
    }
  }, [purposeLists, activePurposeListId, activeTab, setActiveTab])

  // Purpose list CRUD
  const handleCreatePurposeList = async (name: string, emoji: string) => {
    const newList: PurposeList = {
      id: crypto.randomUUID(),
      name,
      emoji,
      categories: [],
      createdAt: new Date().toISOString(),
    }
    const next = [...purposeLists, newList]
    setPurposeModal(null)
    setPurposeLists(next)
    selectPurposeList(newList.id)
    try {
      await updateList(listId, categories, next)
    } catch (error) {
      console.error('Error creating purpose list:', error)
      setPurposeLists(purposeLists)
    }
  }

  const handleUpdatePurposeList = async (id: string, name: string, emoji: string) => {
    const previous = purposeLists
    const next = purposeLists.map(p => (p.id === id ? { ...p, name, emoji } : p))
    setPurposeModal(null)
    setPurposeLists(next)
    try {
      await updateList(listId, categories, next)
    } catch (error) {
      console.error('Error updating purpose list:', error)
      setPurposeLists(previous)
    }
  }

  const handleDeletePurposeList = async (id: string) => {
    const previous = purposeLists
    const next = purposeLists.filter(p => p.id !== id)
    setPurposeModal(null)
    setPurposeLists(next)
    setActiveTab('grocery')
    try {
      await updateList(listId, categories, next)
    } catch (error) {
      console.error('Error deleting purpose list:', error)
      setPurposeLists(previous)
    }
  }

  // Add a new (manually named) category to the active purpose list
  const handleAddPurposeCategory = (name: string, emoji: string) => {
    const maxId = Math.max(0, ...currentCategories.map(c => c.id))
    const newCategory: Category = { id: maxId + 1, name, emoji, items: [] }
    setIsAddCategoryOpen(false)
    setExpandedCategories(prev => [...prev, newCategory.id])
    commitCategories([...currentCategories, newCategory])
  }

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
        {/* Header skeleton */}
        <div className="bg-white border-b border-black/5 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Progress ring skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
              {/* Tabs skeleton */}
              <div className="flex bg-gray-100 rounded-full p-1 gap-1">
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-full" />
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-full" />
              </div>
              {/* Share button skeleton */}
              <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
        {/* Search skeleton */}
        <div className="pt-4 px-4 max-w-2xl mx-auto">
          <div className="h-10 bg-white animate-pulse rounded-xl shadow-sm" />
        </div>
        {/* Content skeleton */}
        <main className="flex-grow max-w-2xl w-full mx-auto p-4 pt-6">
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
      <CompactHeader
        uncheckedItems={uncheckedItems}
        totalItems={totalItems}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        purposeLists={purposeLists}
        onCreatePurposeList={() => setPurposeModal({ mode: 'create' })}
      />
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-[12vh] z-50 max-w-md mx-auto"
            >
              <SettingsPanel onClose={() => setIsSettingsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col max-w-2xl w-full mx-auto p-6 pb-24 text-right relative">
        <div className="h-4" aria-hidden="true" />

        {/* Recipes Tab */}
        {activeTab === 'recipes' && flags.enableRecipes && (
          <RecipesTab
            listId={listId}
            categories={categories}
            onAddIngredients={handleAddRecipeIngredients}
            onToggleItem={handleToggleItem}
          />
        )}

        {/* Search Results */}
        {activeTab !== 'recipes' && isSearchMode && (
          <div className="space-y-4 mb-6">
            {searchResults.length > 0 && !hasExactMatch && !isPurposeMode && (
              <motion.button
                onClick={handleQuickAddItem}
                disabled={pendingAddCount > 0}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-3 px-5 rounded-2xl shadow-md shadow-orange-200/40 hover:shadow-lg hover:shadow-orange-200/50 transition-shadow duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative flex items-center justify-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>הוסף &ldquo;{searchQuery}&rdquo;</span>
                </span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-1.5 left-1.5 bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                >
                  AI
                </motion.div>
              </motion.button>
            )}
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
            ) : isPurposeMode ? (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">
                  לא מצאנו את &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-sm text-black/60">
                  נקו את החיפוש כדי להוסיף פריטים לקטגוריות הרשימה
                </p>
              </div>
            ) : (
              <EmptySearchState
                searchQuery={searchQuery}
                onQuickAdd={handleQuickAddItem}
                onOpenAddForm={() => {
                  setSearchQuery('')
                  setIsAddFormOpen(true)
                }}
                isLoading={pendingAddCount > 0}
              />
            )}
          </div>
        )}

        {activeTab !== 'recipes' && !isSearchMode && repeatSuggestions.length > 0 && (
          <div className="mb-6">
            <RepeatSuggestions
              suggestions={repeatSuggestions}
              onUncheck={handleToggleItem}
              onSnooze={handleSnoozeItem}
            />
          </div>
        )}

        {/* Purpose list header with rename/delete */}
        {isPurposeMode && !isSearchMode && activePurposeList && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl">{activePurposeList.emoji}</span>
              <h2 className="text-lg font-bold text-black/80 truncate">{activePurposeList.name}</h2>
            </div>
            <button
              onClick={() => setPurposeModal({ mode: 'edit', list: activePurposeList })}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              title="עריכת רשימה"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Category List - Only show when not in search mode and not on recipes tab */}
        {activeTab !== 'recipes' && !isSearchMode && (
          <CategoryList
            categories={isPurposeMode ? currentCategories : categories.filter(category => category.items.length > 0)}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            expandedCategories={expandedCategories}
            setExpandedCategories={setExpandedCategories}
            onEditItem={handleEditItem}
            onAddItem={handleAddItem}
            isSearchMode={isSearchMode}
          />
        )}

        {/* Add category button for purpose lists */}
        {isPurposeMode && !isSearchMode && (
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/5 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף קטגוריה</span>
          </button>
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
              
              {/* Modal - Compact and positioned at top for keyboard visibility */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed inset-x-4 top-[12vh] bg-white rounded-2xl z-50 shadow-2xl max-w-md mx-auto"
              >
                <div className="p-4">
                  <AddItemForm
                    onAddBackground={handleAddItemBackground}
                    onClose={() => setIsAddFormOpen(false)}
                    categories={currentCategories}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingItem && editingItemCategoryId && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setEditingItem(null);
                  setEditingItemCategoryId(null);
                }}
                className="fixed inset-0 bg-black/50 z-50"
              />
              
              {/* Modal - Compact and positioned at top for keyboard visibility */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed inset-x-4 top-[12vh] bg-white rounded-2xl z-50 shadow-2xl max-w-md mx-auto"
              >
                <div className="p-4">
                  <EditItemModal
                    item={editingItem}
                    currentCategoryId={editingItemCategoryId}
                    categories={currentCategories}
                    onSave={handleUpdateItem}
                    onClose={() => {
                      setEditingItem(null);
                      setEditingItemCategoryId(null);
                    }}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Create / edit purpose list modal */}
        <AnimatePresence>
          {purposeModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPurposeModal(null)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed inset-x-4 top-[12vh] z-50 max-w-md mx-auto"
              >
                <NameEmojiModal
                  title={purposeModal.mode === 'create' ? 'רשימה חדשה' : 'עריכת רשימה'}
                  submitLabel={purposeModal.mode === 'create' ? 'צור רשימה' : 'שמור'}
                  namePlaceholder="שם הרשימה (לדוגמה: טיול לאיטליה)"
                  initialName={purposeModal.mode === 'edit' ? purposeModal.list.name : ''}
                  initialEmoji={purposeModal.mode === 'edit' ? purposeModal.list.emoji : undefined}
                  onSubmit={(name, emoji) =>
                    purposeModal.mode === 'create'
                      ? handleCreatePurposeList(name, emoji)
                      : handleUpdatePurposeList(purposeModal.list.id, name, emoji)
                  }
                  onClose={() => setPurposeModal(null)}
                  onDelete={purposeModal.mode === 'edit' ? () => handleDeletePurposeList(purposeModal.list.id) : undefined}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Add category to purpose list modal */}
        <AnimatePresence>
          {isAddCategoryOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddCategoryOpen(false)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed inset-x-4 top-[12vh] z-50 max-w-md mx-auto"
              >
                <NameEmojiModal
                  title="קטגוריה חדשה"
                  submitLabel="הוסף קטגוריה"
                  namePlaceholder="שם הקטגוריה"
                  emojiPalette={PURPOSE_CATEGORY_PALETTE}
                  onSubmit={handleAddPurposeCategory}
                  onClose={() => setIsAddCategoryOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
      {/* Adding Item Indicator */}
      <AnimatePresence>
        {pendingAddCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 left-6 z-30"
          >
            <div className="bg-white border border-black/10 shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-[#FFB74D] animate-spin" />
              <span className="text-sm text-black/70">מוסיף פריט...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isAddFormOpen && activeTab !== 'recipes' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-30"
          >
            <button
              onClick={() => {
                // A blank purpose list has no categories yet — guide to create one first
                if (isPurposeMode && currentCategories.length === 0) {
                  setIsAddCategoryOpen(true)
                } else {
                  setIsAddFormOpen(prev => !prev)
                }
              }}
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
