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

    if (!listSnap.exists()) {
      return null
    }

    return listSnap.data() as ListData
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
    const listRef = doc(db, 'lists', listId)
    
    await setDoc(listRef, {
      categories,
      updatedAt: new Date().toISOString()
    }, { merge: true })
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