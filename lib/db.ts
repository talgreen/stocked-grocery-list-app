import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function createNewList(listId: string, categories: Category[]) {
  const listRef = doc(db, 'lists', listId)
  
  await setDoc(listRef, {
    categories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  return listId
}

export async function getList(listId: string) {
  const listRef = doc(db, 'lists', listId)
  const listSnap = await getDoc(listRef)

  if (!listSnap.exists()) {
    return null
  }

  return listSnap.data()
}

export async function updateList(listId: string, categories: Category[]) {
  const listRef = doc(db, 'lists', listId)
  
  await setDoc(listRef, {
    categories,
    updatedAt: new Date().toISOString()
  }, { merge: true })
} 