import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

interface ListData {
  categories: Category[]
  createdAt: string
  updatedAt: string
}

export async function createNewList(listId: string, categories: Category[]) {
  const listRef = doc(db, 'lists', listId)
  
  await setDoc(listRef, {
    categories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  return listId
}

export async function getList(listId: string): Promise<ListData | null> {
  const listRef = doc(db, 'lists', listId)
  const listSnap = await getDoc(listRef)

  if (!listSnap.exists()) {
    return null
  }

  return listSnap.data() as ListData
}

export async function updateList(listId: string, categories: Category[]) {
  const listRef = doc(db, 'lists', listId);
  
  try {
    const result = await setDoc(listRef, {
      categories,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    throw error;
  }
} 