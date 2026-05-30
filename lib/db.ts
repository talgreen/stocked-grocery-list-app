import { Category, initialCategories } from '@/types/categories'
import { FirebaseError } from 'firebase/app'
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from './firebase'

// A lightweight profile shape for persisting the signed-in (non-anonymous) user.
export interface UserProfile {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

interface ListData {
  categories: Category[]
  createdAt: string
  updatedAt: string
  // Ownership fields are optional for backward compatibility: lists created before
  // auth existed have neither, and are treated as "ownerless" (claimable).
  ownerId?: string | null
  members?: string[]
  name?: string
}

export async function createNewList(listId: string, categories: Category[], uid?: string) {
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
      updatedAt: new Date().toISOString(),
      ...(uid ? { ownerId: uid, members: [uid] } : {})
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

export async function updateList(listId: string, categories: Category[], uid?: string) {
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
    const listSnap = await getDoc(listRef)
    const isNewList = !listSnap.exists()

    const timestamp = new Date().toISOString()

    if (isNewList) {
      // Create new list with all required fields, stamping ownership when known.
      await setDoc(listRef, {
        categories: sanitizedCategories,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(uid ? { ownerId: uid, members: [uid] } : {})
      })
    } else {
      // Update only the mutable fields. Using updateDoc (rather than setDoc) is
      // essential so we don't clobber ownerId/members on every item change.
      await updateDoc(listRef, {
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

/**
 * Associate the current user with a list when they open it.
 * - If the list doesn't exist yet, there's nothing to claim (it'll be created with
 *   ownership on the first write via createNewList/updateList).
 * - If it exists but is ownerless (legacy/new), the opener claims ownership.
 * - If it's already owned by someone else, the opener simply joins as a member.
 * arrayUnion keeps this idempotent, so repeated opens are no-ops.
 */
export async function claimList(listId: string, uid: string) {
  if (!uid) return
  try {
    const listRef = doc(db, 'lists', listId)
    const listSnap = await getDoc(listRef)
    if (!listSnap.exists()) return

    const data = listSnap.data() as ListData
    const isOwnerless = !data.ownerId

    if (isOwnerless) {
      await setDoc(
        listRef,
        { ownerId: uid, members: arrayUnion(uid) },
        { merge: true }
      )
    } else if (!data.members?.includes(uid)) {
      await updateDoc(listRef, { members: arrayUnion(uid) })
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('Firebase error (claimList):', error.code, error.message)
    }
    // Claiming is best-effort; never block list usage on it.
  }
}

/**
 * Persist a signed-in (non-anonymous) user's profile to users/{uid}.
 * No-op for anonymous users, who have no meaningful profile.
 */
export async function ensureUserDoc(profile: UserProfile) {
  if (!profile.uid) return
  try {
    const userRef = doc(db, 'users', profile.uid)
    await setDoc(
      userRef,
      {
        displayName: profile.displayName ?? null,
        email: profile.email ?? null,
        photoURL: profile.photoURL ?? null,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    )
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('Firebase error (ensureUserDoc):', error.code, error.message)
    }
  }
}
