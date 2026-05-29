import { Category, initialCategories } from '@/types/categories'
import { PurposeList } from '@/types/purpose-list'
import { FirebaseError } from 'firebase/app'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from './firebase'



interface ListData {
  categories: Category[]
  purposeLists?: PurposeList[]
  createdAt: string
  updatedAt: string
}

// Ensure categories/items have the exact required structure before persisting.
// Strips unknown fields and normalizes optional/numeric fields to safe defaults.
function sanitizeCategories(categories: Category[]): Category[] {
  return categories.map(category => ({
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
}

function sanitizePurposeLists(purposeLists: PurposeList[]): PurposeList[] {
  return purposeLists.map(list => ({
    id: list.id,
    name: list.name,
    emoji: list.emoji,
    createdAt: list.createdAt,
    categories: sanitizeCategories(list.categories ?? [])
  }))
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
      purposeLists: [],
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

export async function updateList(listId: string, categories: Category[], purposeLists: PurposeList[] = []) {
  try {
    // Persist when grocery/pharmacy has items, OR when there is at least one
    // (named) purpose list. This lets a freshly-created, still-empty purpose
    // list survive a refresh while still avoiding empty grocery-only documents.
    const groceryHasItems = categories.some(category => category.items.length > 0)
    const hasNamedPurposeList = purposeLists.some(list => list.name.trim().length > 0)
    if (!groceryHasItems && !hasNamedPurposeList) return

    // Ensure categories/purpose lists have the exact required structure.
    // NOTE: setDoc rewrites the whole document, so purposeLists MUST be written
    // in every branch or it would be deleted on the next grocery write.
    const sanitizedCategories = sanitizeCategories(categories)
    const sanitizedPurposeLists = sanitizePurposeLists(purposeLists)

    const listRef = doc(db, 'lists', listId)
    const listSnap = await getDoc(listRef)
    const isNewList = !listSnap.exists()

    const timestamp = new Date().toISOString()

    if (isNewList) {
      // Create new list with all required fields
      await setDoc(listRef, {
        categories: sanitizedCategories,
        purposeLists: sanitizedPurposeLists,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    } else {
      // Update existing list with only allowed fields
      await setDoc(listRef, {
        categories: sanitizedCategories,
        purposeLists: sanitizedPurposeLists,
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
        const normalizeCategories = (categories: Category[] | undefined) =>
          categories?.map(category => ({
            ...category,
            items:
              category.items?.map(item => ({
                ...item,
                comment: item.comment || '',
                photo: item.photo || null
              })) ?? []
          })) ?? []

        const normalizedPurposeLists = (data.purposeLists ?? []).map(list => ({
          ...list,
          categories: normalizeCategories(list.categories)
        }))

        onData({
          ...data,
          categories: normalizeCategories(data.categories),
          purposeLists: normalizedPurposeLists
        })
      } else {
        onData({
          categories: initialCategories,
          purposeLists: [],
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
