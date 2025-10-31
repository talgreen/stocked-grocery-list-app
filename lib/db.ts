import { Category, initialCategories } from '@/types/categories'
import { FirebaseError } from 'firebase/app'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from './firebase'



interface ListData {
  categories: Category[]
  createdAt: string
  updatedAt: string
}

export async function createNewList(listId: string, categories: Category[]) {
  try {
    // Only create if there are items in any category
    const hasItems = categories.some(category => category.items.length > 0)
    if (!hasItems) {
      return listId
    }

    const listRef = doc(db, 'lists', listId)
    await setDoc(listRef, {
      categories,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    return listId
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('Firebase error:', error.code, error.message)
      if (error.code === 'permission-denied') {
        toast.error('אין הרשאה ליצור רשימה חדשה')
      }
    }
    throw error
  }
}

export async function getList(listId: string): Promise<ListData | null> {
  try {
    const listRef = doc(db, 'lists', listId)
    const listSnap = await getDoc(listRef)

    if (listSnap.exists()) {
      return listSnap.data() as ListData
    }

    // Return initial categories for new lists
    return {
      categories: initialCategories,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('Firebase error:', error.code, error.message)
      if (error.code === 'permission-denied') {
        toast.error('אין הרשאה לקרוא את הרשימה')
      }
    }
    throw error
  }
}

export async function updateList(listId: string, categories: Category[]) {
  try {
    // Check if the list has any items
    const hasItems = categories.some(category => category.items.length > 0)
    if (!hasItems) return

    // Ensure categories have the exact required structure
    const sanitizedCategories = categories.map(category => ({
      id: category.id,
      emoji: category.emoji,
      name: category.name,
      items: category.items.map(item => ({
        id: item.id,
        name: item.name,
        purchased: item.purchased,
        comment: item.comment || '',
        photo: item.photo || null,
        popularityScore: item.popularityScore ?? 0,
        popularityUpdatedAt: item.popularityUpdatedAt ?? null,
        totalPurchases: item.totalPurchases ?? 0,
        lastPurchasedAt: item.lastPurchasedAt ?? null,
        interactionHistory: item.interactionHistory?.map(interaction => ({
          type: interaction.type,
          at: interaction.at,
        })) ?? []
      }))
    }))

    const listRef = doc(db, 'lists', listId)
    const listSnap = await getDoc(listRef)
    const isNewList = !listSnap.exists()

    const timestamp = new Date().toISOString()

    if (isNewList) {
      // Create new list with all required fields
      await setDoc(listRef, {
        categories: sanitizedCategories,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    } else {
      // Update existing list with only allowed fields
      await setDoc(listRef, {
        categories: sanitizedCategories,
        updatedAt: timestamp
      })
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('Firebase error:', error.code, error.message)
      if (error.code === 'permission-denied') {
        toast.error('אין הרשאה לעדכן את הרשימה')
      }
    }
    throw error
  }
} 