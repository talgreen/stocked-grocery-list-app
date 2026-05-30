import { describe, it, expect, vi, beforeEach } from 'vitest'

// The global setup mocks '@/lib/db'; here we want the real implementation and
// instead mock the Firestore layer beneath it.
vi.unmock('@/lib/db')

vi.mock('@/lib/firebase', () => ({ db: {} }))

/* eslint-disable @typescript-eslint/no-explicit-any */
const setDoc = vi.fn((..._args: any[]) => Promise.resolve())
const updateDoc = vi.fn((..._args: any[]) => Promise.resolve())
const getDoc = vi.fn((..._args: any[]): any => undefined)
const arrayUnion = vi.fn((...values: any[]) => ({ __arrayUnion: values }))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: any, collection: string, id: string) => ({ collection, id })),
  getDoc: (...args: any[]) => getDoc(...args),
  onSnapshot: vi.fn(),
  setDoc: (...args: any[]) => setDoc(...args),
  updateDoc: (...args: any[]) => updateDoc(...args),
  arrayUnion: (...args: any[]) => arrayUnion(...args),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { createNewList, claimList, ensureUserDoc } from '@/lib/db'

const categoriesWithItems = [
  { id: 1, name: 'Dairy', emoji: '🥛', items: [{ id: 1, name: 'Milk', purchased: false }] },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createNewList', () => {
  it('stamps ownerId and members when a uid is provided', async () => {
    await createNewList('list-1', categoriesWithItems, 'user-1')

    expect(setDoc).toHaveBeenCalledTimes(1)
    const payload = setDoc.mock.calls[0][1] as Record<string, unknown>
    expect(payload.ownerId).toBe('user-1')
    expect(payload.members).toEqual(['user-1'])
  })

  it('omits ownership fields when no uid is provided', async () => {
    await createNewList('list-1', categoriesWithItems)

    const payload = setDoc.mock.calls[0][1] as Record<string, unknown>
    expect(payload).not.toHaveProperty('ownerId')
    expect(payload).not.toHaveProperty('members')
  })

  it('does not write empty lists', async () => {
    await createNewList('list-1', [{ id: 1, name: 'Dairy', emoji: '🥛', items: [] }], 'user-1')
    expect(setDoc).not.toHaveBeenCalled()
  })
})

describe('claimList', () => {
  it('claims ownership of an ownerless list', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ categories: [] }) })

    await claimList('list-1', 'user-1')

    expect(setDoc).toHaveBeenCalledTimes(1)
    const payload = setDoc.mock.calls[0][1] as Record<string, unknown>
    expect(payload.ownerId).toBe('user-1')
    expect(arrayUnion).toHaveBeenCalledWith('user-1')
  })

  it('joins an owned list as a new member', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ categories: [], ownerId: 'owner', members: ['owner'] }),
    })

    await claimList('list-1', 'user-2')

    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(arrayUnion).toHaveBeenCalledWith('user-2')
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('is a no-op when the user is already a member', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ categories: [], ownerId: 'owner', members: ['owner', 'user-3'] }),
    })

    await claimList('list-1', 'user-3')

    expect(setDoc).not.toHaveBeenCalled()
    expect(updateDoc).not.toHaveBeenCalled()
  })

  it('does nothing when the list does not exist yet', async () => {
    getDoc.mockResolvedValue({ exists: () => false })

    await claimList('list-1', 'user-1')

    expect(setDoc).not.toHaveBeenCalled()
    expect(updateDoc).not.toHaveBeenCalled()
  })
})

describe('ensureUserDoc', () => {
  it('merges the profile into users/{uid}', async () => {
    await ensureUserDoc({ uid: 'user-1', displayName: 'Tal', email: 't@e.com', photoURL: null })

    expect(setDoc).toHaveBeenCalledTimes(1)
    const [, payload, options] = setDoc.mock.calls[0]
    expect(payload).toMatchObject({ displayName: 'Tal', email: 't@e.com', photoURL: null })
    expect(options).toEqual({ merge: true })
  })

  it('skips when there is no uid', async () => {
    await ensureUserDoc({ uid: '', displayName: null, email: null, photoURL: null })
    expect(setDoc).not.toHaveBeenCalled()
  })
})
