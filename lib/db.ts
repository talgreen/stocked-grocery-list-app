import { Category, initialCategories } from '@/types/categories'
import { FirebaseError } from 'firebase/app'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { isDemoList } from './demo'
import { db } from './firebase'



interface ListData {
  categories: Category[]
  createdAt: string
  updatedAt: string
}

export async function createNewList(listId: string, categories: Category[]) {
  // Demo/sandbox lists are ephemeral and never written to Firebase.
  if (isDemoList(listId)) return listId
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
  // Demo/sandbox lists are ephemeral and never written to Firebase.
  if (isDemoList(listId)) return
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
        lastPurchaseAt: item.lastPurchaseAt || null,
        expectedGapDays:
          typeof item.expectedGapDays === 'number' && Number.isFinite(item.expectedGapDays)
            ? item.expectedGapDays
            : null,
        gapVariance:
          typeof item.gapVariance === 'number' && Number.isFinite(item.gapVariance)
            ? item.gapVariance
            : null,
        decayedCount:
          typeof item.decayedCount === 'number' && Number.isFinite(item.decayedCount)
            ? item.decayedCount
            : 0,
        purchaseCount:
          typeof item.purchaseCount === 'number' && Number.isFinite(item.purchaseCount)
            ? item.purchaseCount
            : 0,
        snoozeUntil: item.snoozeUntil || null
      }))
    }))

    const listRef = doc(db, 'lists', listId)
    const timestamp = new Date().toISOString()

    // Merge write: creates the document if it doesn't exist yet and updates it
    // otherwise, all in a single round-trip. We intentionally avoid a preceding
    // getDoc() here — it doubled the write latency on every toggle/add. Leaving
    // `createdAt` out of the payload lets { merge: true } preserve an existing
    // value rather than clobbering it on every write; a freshly created list
    // gets its `createdAt` from createNewList().
    await setDoc(
      listRef,
      {
        categories: sanitizedCategories,
        updatedAt: timestamp
      },
      { merge: true }
    )
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

export function subscribeToList(
  listId: string,
  onData: (data: ListData) => void,
  onError?: (error: Error) => void
) {
  const listRef = doc(db, 'lists', listId)

  return onSnapshot(
    listRef,
    snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ListData
        const normalizedCategories = data.categories?.map(category => ({
          ...category,
          items:
            category.items?.map(item => ({
              ...item,
              comment: item.comment || '',
              photo: item.photo || null
            })) ?? []
        })) ?? []

        onData({
          ...data,
          categories: normalizedCategories
        })
      } else {
        onData({
          categories: initialCategories,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    },
    error => {
      console.error('Error subscribing to list:', error)
      onError?.(error as Error)
    }
  )
}
