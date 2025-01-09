'use client'

import CategoryList from '@/components/CategoryList'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Category {
  id: number
  name: string
  items: {
    id: number
    name: string
    purchased: boolean
    comment?: string
  }[]
}

export default function SharedList() {
  const [categories, setCategories] = useState<Category[]>([])
  const searchParams = useSearchParams()

  useEffect(() => {
    const data = searchParams.get('data')
    if (data) {
      try {
        const decodedData = decodeURIComponent(atob(data))
        const parsedCategories = JSON.parse(decodedData)
        setCategories(parsedCategories)
      } catch (error) {
        console.error('Error parsing shared data:', error)
      }
    }
  }, [searchParams])

  const handleToggleItem = (categoryId: number, itemId: number) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? {
            ...category, 
            items: category.items.map(item => 
              item.id === itemId ? { ...item, purchased: !item.purchased } : item
            ).sort((a, b) => (a.purchased === b.purchased) ? 0 : a.purchased ? 1 : -1)
          }
        : category
    ))
  }

  const handleDeleteItem = (categoryId: number, itemId: number) => {
    setCategories(categories.map(category =>
      category.id === categoryId
        ? { ...category, items: category.items.filter(item => item.id !== itemId) }
        : category
    ))
  }

  const handleEditComment = (categoryId: number, itemId: number, newComment: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-4">
      <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">רשימת קניות משותפת</h1>
        <CategoryList 
          categories={categories} 
          onToggleItem={handleToggleItem}
          onDeleteItem={handleDeleteItem}
          onEditComment={handleEditComment}
        />
      </div>
    </div>
  )
}

