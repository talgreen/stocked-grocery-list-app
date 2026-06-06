import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Category } from '@/types/categories'

// Mock the Firestore SDK + our firebase init so we can drive updateList's
// create-vs-update branching and inspect what gets written.
const mocks = vi.hoisted(() => ({
  doc: vi.fn(() => ({ __ref: true })),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  onSnapshot: mocks.onSnapshot,
}))
vi.mock('firebase/app', () => ({ FirebaseError: class FirebaseError extends Error {} }))
vi.mock('@/lib/firebase', () => ({ db: {} }))

const categories: Category[] = [
  {
    id: 1,
    name: 'מוצרי חלב',
    emoji: '🥛',
    items: [
      {
        id: 1,
        name: 'חלב',
        purchased: false,
        comment: '',
        photo: null,
        categoryId: 1,
        lastPurchaseAt: null,
        expectedGapDays: null,
        gapVariance: null,
        decayedCount: 0,
        purchaseCount: 0,
        snoozeUntil: null,
      },
    ],
  },
]

// Import the REAL implementation (setup.ts mocks '@/lib/db' globally).
let updateList: typeof import('@/lib/db').updateList

beforeEach(async () => {
  vi.clearAllMocks()
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  updateList = actual.updateList
})

describe('updateList persistence shape', () => {
  it('includes createdAt when CREATING a new list (required by security rules)', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false })

    await updateList('brand-new-list', categories)

    expect(mocks.setDoc).toHaveBeenCalledTimes(1)
    const [, data] = mocks.setDoc.mock.calls[0]
    // Regression guard: dropping createdAt on create caused permission-denied,
    // which made added items briefly appear and then vanish.
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
    expect(data).toHaveProperty('categories')
  })

  it('omits createdAt when UPDATING an existing list', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true })

    await updateList('existing-list', categories)

    expect(mocks.setDoc).toHaveBeenCalledTimes(1)
    const [, data] = mocks.setDoc.mock.calls[0]
    expect(data).not.toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
    expect(data).toHaveProperty('categories')
  })
})
