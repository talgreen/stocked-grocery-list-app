'use client'

import { useTabView } from '@/contexts/TabViewContext'
import {
  PresenceParticipant,
  startPresenceSession,
  subscribeToList,
  subscribeToPresence,
  updateList
} from '@/lib/db'
import { OpenRouter } from '@/lib/openrouter'
import { listTemplates, TemplateItem } from '@/lib/templates'
import { formatCurrency, generateFriendlyName } from '@/lib/utils'
import { Category, initialCategories } from '@/types/categories'
import { Item } from '@/types/item'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, Users, X } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import AddItemForm from './AddItemForm'
import CategoryList from './CategoryList'
import EditItemModal from './EditItemModal'
import ProgressHeader from './ProgressHeader'
import ShareButton from './ShareButton'
import SparkleIcon from './SparkleIcon'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [showEmptyCategories, setShowEmptyCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const listId = (params?.listId as string) || 'default'
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateParam = searchParams.get('template')
  const labelParam = searchParams.get('label')
  const [listLabel, setListLabel] = useState('רשימה משותפת')
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [onlineParticipants, setOnlineParticipants] = useState<PresenceParticipant[]>([])
  const presenceSessionRef = useRef<{ touch: () => Promise<void>; stop: () => Promise<void> } | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const hasAppliedTemplateRef = useRef(false)
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingItemCategoryId, setEditingItemCategoryId] = useState<number | null>(null)
  const [isQuickAddLoading, setIsQuickAddLoading] = useState(false)
  const { activeTab, setActiveTab } = useTabView()

  const mergeTemplateItems = (baseCategories: Category[], templateItems: TemplateItem[]) => {
    let updatedCategories = baseCategories.map(category => ({
      ...category,
      items: category.items.map(item => ({ ...item }))
    }))

    let runningMaxId = updatedCategories.reduce((max, category) => Math.max(max, category.id), 0)

    templateItems.forEach(templateItem => {
      const matchingIndex = updatedCategories.findIndex(
        category => category.name.toLowerCase() === templateItem.category.toLowerCase()
      )

      let targetCategory: Category

      if (matchingIndex >= 0) {
        targetCategory = updatedCategories[matchingIndex]
      } else {
        runningMaxId += 1
        targetCategory = {
          id: runningMaxId,
          emoji: templateItem.emoji || '🛒',
          name: templateItem.category,
          items: []
        }
        updatedCategories = [...updatedCategories, targetCategory]
      }

      const alreadyExists = targetCategory.items.some(existingItem =>
        existingItem.name.trim().toLowerCase() === templateItem.name.trim().toLowerCase()
      )

      if (alreadyExists) {
        return
      }

      const newItem: Item = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: templateItem.name,
        purchased: false,
        comment: templateItem.comment || '',
        quantity: templateItem.quantity ?? null,
        unit: templateItem.unit ?? null,
        price: templateItem.price ?? null
      }

      const updatedTarget = {
        ...targetCategory,
        items: [
          ...targetCategory.items.filter(item => !item.purchased),
          newItem,
          ...targetCategory.items.filter(item => item.purchased)
        ]
      }

      updatedCategories = updatedCategories.map(category =>
        category.id === updatedTarget.id ? updatedTarget : category
      )
    })

    return updatedCategories
  }

  useEffect(() => {
    hasAppliedTemplateRef.current = false
  }, [listId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let storedId = localStorage.getItem('stocked.presenceId')
    if (!storedId) {
      storedId = uuidv4()
      localStorage.setItem('stocked.presenceId', storedId)
    }
    setParticipantId(storedId)

    let storedName = localStorage.getItem('stocked.displayName')
    if (!storedName) {
      storedName = generateFriendlyName()
      localStorage.setItem('stocked.displayName', storedName)
    }
    setDisplayName(storedName)
  }, [])

  useEffect(() => {
    if (labelParam) {
      setListLabel(labelParam)
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('stocked.recents')
        let recents: Array<{ id: string; name: string; lastOpened: string; itemCount: number }> = []
        try {
          recents = raw ? JSON.parse(raw) : []
        } catch (error) {
          console.error('Failed to parse recents', error)
        }
        const existingIndex = recents.findIndex(entry => entry.id === listId)
        if (existingIndex >= 0) {
          recents[existingIndex].name = labelParam
          localStorage.setItem('stocked.recents', JSON.stringify(recents))
        }
      }
    } else if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('stocked.recents')
      if (raw) {
        try {
          const recents: Array<{ id: string; name: string }> = JSON.parse(raw)
          const match = recents.find(entry => entry.id === listId)
          if (match && match.name) {
            setListLabel(match.name)
          }
        } catch (error) {
          console.error('Failed to parse recents', error)
        }
      }
    }
  }, [labelParam, listId])

  useEffect(() => {
    if (!listId) return

    setIsLoading(true)
    const unsubscribe = subscribeToList(
      listId,
      data => {
        setCategories(data.categories)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )

    return () => {
      unsubscribe()
    }
  }, [listId])

  useEffect(() => {
    if (!listId || !participantId || !displayName) return

    const unsubscribePresence = subscribeToPresence(listId, participants => {
      setOnlineParticipants(participants)
    })

    let cancelled = false

    startPresenceSession(listId, participantId, displayName)
      .then(session => {
        if (cancelled) {
          session.stop()
          return
        }
        presenceSessionRef.current = session
        heartbeatRef.current = setInterval(() => {
          session.touch().catch(error => console.error('Presence heartbeat failed', error))
        }, 20000)
      })
      .catch(error => {
        console.error('Failed to start presence session', error)
      })

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        presenceSessionRef.current?.touch().catch(() => undefined)
      }
    }

    const handleBeforeUnload = () => {
      presenceSessionRef.current?.stop()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      cancelled = true
      unsubscribePresence()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      presenceSessionRef.current?.stop()
      presenceSessionRef.current = null
    }
  }, [listId, participantId, displayName])

  useEffect(() => {
    if (!templateParam || isLoading || hasAppliedTemplateRef.current) return

    const template = listTemplates.find(entry => entry.id === templateParam)
    hasAppliedTemplateRef.current = true

    if (!template) {
      return
    }

    const hasItems = categories.some(category => category.items.length > 0)
    if (!hasItems) {
      const merged = mergeTemplateItems(categories, template.items)
      setCategories(merged)
      updateList(listId, merged)
    }

    const paramsCopy = new URLSearchParams(searchParams.toString())
    paramsCopy.delete('template')
    router.replace(`/share/${listId}${paramsCopy.toString() ? `?${paramsCopy.toString()}` : ''}`)
  }, [templateParam, categories, isLoading, listId, router, searchParams])

  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    const totalItemsCount = categories.reduce(
      (sum, category) => sum + category.items.length,
      0
    )

    const record = {
      id: listId,
      name: listLabel || 'רשימה משותפת',
      lastOpened: new Date().toISOString(),
      itemCount: totalItemsCount
    }

    const raw = localStorage.getItem('stocked.recents')
    let recents: typeof record[] = []
    if (raw) {
      try {
        recents = JSON.parse(raw)
      } catch (error) {
        console.error('Failed to parse recents', error)
      }
    }

    const existingIndex = recents.findIndex(entry => entry.id === listId)
    if (existingIndex >= 0) {
      recents[existingIndex] = { ...recents[existingIndex], ...record }
    } else {
      recents.unshift(record)
    }

    localStorage.setItem('stocked.recents', JSON.stringify(recents.slice(0, 10)))
  }, [categories, isLoading, listId, listLabel])

  // Filter items based on search query
  const getSearchResults = () => {
    if (!searchQuery.trim()) return []
    
    const results: Array<{
      item: Item
      category: Category
      categoryId: number
    }> = []
    
    categories.forEach(category => {
      // Filter categories based on active tab
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

  const activeParticipants = useMemo(() => {
    const now = Date.now()
    return onlineParticipants.filter(participant => now - participant.lastSeen.getTime() < 60000)
  }, [onlineParticipants])

  const participantNames = useMemo(
    () =>
      activeParticipants.map(participant =>
        participantId && participant.id === participantId ? 'את/ה' : participant.displayName
      ),
    [activeParticipants, participantId]
  )

  const totalBudgetRemaining = useMemo(() => {
    return categories.reduce((sum, category) => {
      const categorySum = category.items.reduce((categoryTotal, item) => {
        if (item.purchased) return categoryTotal
        const price = item.price ?? 0
        if (!price) return categoryTotal
        const quantity = item.quantity ?? 1
        return categoryTotal + price * quantity
      }, 0)

      return sum + categorySum
    }, 0)
  }, [categories])

  const formattedBudget = useMemo(() => {
    if (totalBudgetRemaining <= 0) return null
    return formatCurrency(totalBudgetRemaining)
  }, [totalBudgetRemaining])

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

  const getItemMetadata = (item: Item) => {
    const quantityLabel = item.quantity !== null && item.quantity !== undefined
      ? new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2 }).format(item.quantity)
      : null
    const unitLabel = item.unit || ''
    const priceLabel = item.price !== null && item.price !== undefined
      ? formatCurrency(item.price * (item.quantity ?? 1))
      : null

    const parts: string[] = []

    if (quantityLabel) {
      parts.push(`${quantityLabel}${unitLabel ? ` ${unitLabel}` : ''}`)
    } else if (unitLabel) {
      parts.push(unitLabel)
    }

    if (priceLabel) {
      parts.push(`≈ ${priceLabel}`)
    }

    return parts.join(' · ')
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
    const newItem = {
      ...item,
      id: Date.now(),
      purchased: false,
      comment: item.comment || '',
      photo: item.photo || null,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      price: item.price ?? null,
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
      categoryId,
      quantity: null,
      unit: null,
      price: null
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

  // Check if an item with the same name and description already exists in the current tab
  const checkDuplicateItem = (name: string, comment: string = '') => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedComment = comment.trim().toLowerCase();
    
    for (const category of categories) {
      // Only check categories relevant to the current tab
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

    // Clear search immediately to switch back to normal view without flicker
    setSearchQuery('');

    setIsQuickAddLoading(true);
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
        category = result.category;
        emoji = result.emoji;
      }

      await handleAddItemWithCategory(
        { name: itemName, comment: '', quantity: null, unit: null, price: null },
        category,
        emoji
      );
      
      toast.success(`הפריט "${itemName}" נוסף לקטגוריה ${emoji} ${category}`);
      
      // Clear search and reset to show all items
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('שגיאה בהוספת הפריט');
    } finally {
      setIsQuickAddLoading(false);
    }
  };

  // Handle updating an existing item
  const handleUpdateItem = async (
    itemId: number,
    name: string,
    comment: string,
    newCategoryId: number,
    quantity: number | null,
    unit: string | null,
    price: number | null
  ) => {
    try {
      // Find the item and its current category
      let itemToUpdate: Item | null = null;
      let sourceCategory: number | null = null;

      for (const category of categories) {
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
        quantity,
        unit,
        price
      };

      let updatedCategories;

      if (sourceCategory === newCategoryId) {
        // Same category - just update the item
        updatedCategories = categories.map(category => {
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
        updatedCategories = categories.map(category => {
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

      setCategories(updatedCategories);
      await updateList(listId, updatedCategories);
      toast.success('הפריט עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('שגיאה בעדכון הפריט');
    }
  };

  // Handle opening edit modal
  const handleEditItem = (item: Item, categoryId: number) => {
    setEditingItem(item);
    setEditingItemCategoryId(categoryId);
  };

  const uncheckedItems = categories
    .filter(category => {
      if (activeTab === 'grocery') return category.name !== 'בית מרקחת'
      if (activeTab === 'pharmacy') return category.name === 'בית מרקחת'
      return true
    })
    .reduce((total, category) => 
      total + category.items.filter(item => !item.purchased).length, 0
    )
  const totalItems = categories
    .filter(category => {
      if (activeTab === 'grocery') return category.name !== 'בית מרקחת'
      if (activeTab === 'pharmacy') return category.name === 'בית מרקחת'
      return true
    })
    .reduce((total, category) => 
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
        <header className="max-w-2xl mx-auto px-6 py-2 flex justify-between items-center gap-4">
          <div className="flex flex-col items-start gap-1 text-right">
            <h1 className="text-2xl font-bold text-[#FFB74D] flex items-center gap-2">
              Stocked
              <SparkleIcon />
            </h1>
            <span className="text-xs text-black/50 font-medium truncate max-w-[180px] sm:max-w-none">
              {listLabel}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
            {formattedBudget && (
              <span className="text-xs bg-[#FFB74D]/10 text-[#FF9800] px-3 py-1 rounded-full font-medium">
                תקציב נותר: {formattedBudget}
              </span>
            )}
            {activeParticipants.length > 0 && (
              <div className="flex items-center gap-2 bg-black/5 text-black/60 px-3 py-1 rounded-full text-xs max-w-[180px] sm:max-w-none">
                <Users className="h-3.5 w-3.5" />
                <span className="truncate" title={participantNames.join(', ')}>
                  {participantNames.join(' · ')}
                </span>
              </div>
            )}
            <ShareButton />
          </div>
        </header>
        <nav className="max-w-2xl mx-auto">
          <div className="bg-white">
            {/* Tab Navigation */}
            <div className="px-6 pt-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'grocery' | 'pharmacy')}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="pharmacy" 
                    className="data-[state=active]:bg-[#FFB74D] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600 font-medium transition-all duration-200"
                  >
                    בית מרקחת
                  </TabsTrigger>
                  <TabsTrigger 
                    value="grocery"
                    className="data-[state=active]:bg-[#FFB74D] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600 font-medium transition-all duration-200"
                  >
                    קניות
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
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
                    {items.map((item, index) => {
                      const metadata = getItemMetadata(item)

                      return (
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

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm truncate font-medium ${
                                  item.purchased ? 'line-through text-black/40' : 'text-black/80'
                                }`}
                              >
                                {highlightText(item.name, searchQuery)}
                              </p>
                              {(metadata || item.comment) && (
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                  {metadata && (
                                    <span className={item.purchased ? 'text-black/30' : 'text-black/50'}>{metadata}</span>
                                  )}
                                  {item.comment && (
                                    <span className={item.purchased ? 'text-black/30' : 'text-black/50'}>{item.comment}</span>
                                  )}
                                </div>
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
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-black/5 shadow-sm">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">לא נמצאו תוצאות</h3>
                <p className="text-sm text-black/60 mb-4">
                  נסה לחפש במילות מפתח אחרות
                </p>
                <motion.button
                  onClick={handleQuickAddItem}
                  className="bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                  whileTap={{ scale: 0.95 }}
                  disabled={isQuickAddLoading}
                >
                  {isQuickAddLoading ? 'מוסיף...' : `הוסף את ${searchQuery} לרשימה`}
                </motion.button>
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
            onEditItem={handleEditItem}
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
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed inset-x-4 top-[10vh] bottom-[10vh] bg-white rounded-2xl z-50 overflow-hidden shadow-2xl max-w-md mx-auto"
              >
                <div className="h-full overflow-y-auto p-6">
                  <EditItemModal 
                    item={editingItem}
                    currentCategoryId={editingItemCategoryId}
                    categories={categories}
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

