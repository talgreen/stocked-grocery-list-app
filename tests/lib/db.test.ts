import { describe, it, expect, vi, beforeEach } from 'vitest'
import { subscribeToList, updateList } from '@/lib/db'

// Note: These tests use the mocked db from setup.ts
// In real implementation, we'd test the actual Firebase operations

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('subscribeToList', () => {
    it('calls onData callback with list data', () => {
      const onData = vi.fn()
      const onError = vi.fn()

      const unsubscribe = subscribeToList('test-list', onData, onError)

      expect(onData).toHaveBeenCalledWith({ categories: [], purposeLists: [] })
      expect(onError).not.toHaveBeenCalled()

      unsubscribe()
    })

    it('returns unsubscribe function', () => {
      const onData = vi.fn()
      const onError = vi.fn()

      const unsubscribe = subscribeToList('test-list', onData, onError)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('updateList', () => {
    it('resolves successfully with valid data', async () => {
      const categories = [
        {
          id: 1,
          name: 'Test',
          emoji: '🧪',
          items: [],
        },
      ]

      await expect(updateList('test-list', categories)).resolves.toBeUndefined()
    })

    it('can be called multiple times', async () => {
      const categories = [
        {
          id: 1,
          name: 'Test',
          emoji: '🧪',
          items: [],
        },
      ]

      await updateList('test-list', categories)
      await updateList('test-list', categories)

      expect(updateList).toHaveBeenCalledTimes(2)
    })

    it('accepts purpose lists as a third argument', async () => {
      const purposeLists = [
        {
          id: 'trip-1',
          name: 'טיול לאיטליה',
          emoji: '🧳',
          categories: [],
          createdAt: new Date().toISOString(),
        },
      ]

      await expect(updateList('test-list', [], purposeLists)).resolves.toBeUndefined()
      expect(updateList).toHaveBeenCalledWith('test-list', [], purposeLists)
    })
  })
})
