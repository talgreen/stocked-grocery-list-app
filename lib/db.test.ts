import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { updateList } from './db'
import type { Category } from '../types/categories'

// In-memory mock store to simulate Firestore documents
const store: Record<string, any> = {}

// Mock Firestore functions
const doc = vi.fn((_db: unknown, _collection: string, id: string) => ({ id }))
const getDoc = vi.fn(async (ref: any) => ({
  exists: () => !!store[ref.id],
  data: () => store[ref.id]
}))
const setDoc = vi.fn(async (ref: any, data: any, options?: any) => {
  if (options?.merge) {
    store[ref.id] = { ...store[ref.id], ...data }
  } else {
    store[ref.id] = data
  }
})

vi.mock('firebase/firestore', () => ({ doc, getDoc, setDoc }))
vi.mock('./firebase', () => ({ db: {} }))
vi.mock('firebase/app', () => ({
  FirebaseError: class extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

describe('updateList', () => {
  const listId = 'list-1'
  const createdAt = '2024-01-01T00:00:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-10T00:00:00.000Z'))
    store[listId] = { categories: [], createdAt, updatedAt: '2024-01-02T00:00:00.000Z' }
    doc.mockClear()
    getDoc.mockClear()
    setDoc.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('preserves the createdAt field when updating existing lists', async () => {
    const now = new Date().toISOString()
    const categories: Category[] = [
      {
        id: 1,
        emoji: '🥬',
        name: 'Veg',
        items: [
          { id: 1, name: 'Carrot', purchased: false }
        ]
      }
    ]

    await updateList(listId, categories)

    expect(store[listId].createdAt).toBe(createdAt)
    expect(store[listId].updatedAt).toBe(now)
  })

  it('stores sanitized category and item data correctly', async () => {
    const now = new Date().toISOString()
    const dirtyCategories: any = [
      {
        id: 1,
        emoji: '🥬',
        name: 'Veg',
        extraField: 'remove',
        items: [
          { id: 1, name: 'Carrot', purchased: false, extra: 'x' },
          { id: 2, name: 'Potato', purchased: true, comment: 'fresh', photo: 'url', unwanted: 'y' }
        ]
      }
    ]

    await updateList(listId, dirtyCategories)

    const expected: Category[] = [
      {
        id: 1,
        emoji: '🥬',
        name: 'Veg',
        items: [
          { id: 1, name: 'Carrot', purchased: false, comment: '', photo: null },
          { id: 2, name: 'Potato', purchased: true, comment: 'fresh', photo: 'url' }
        ]
      }
    ]

    expect(store[listId]).toEqual({ categories: expected, createdAt, updatedAt: now })
  })
})

