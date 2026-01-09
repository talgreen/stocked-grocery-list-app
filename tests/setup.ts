import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({
    listId: 'test-list-id'
  }),
}))

// Mock Firebase to prevent network calls in tests
vi.mock('@/lib/db', () => ({
  subscribeToList: vi.fn((listId, onData) => {
    // Return mock data immediately with required fields
    onData({
      categories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return () => {} // unsubscribe function
  }),
  updateList: vi.fn(() => Promise.resolve()),
}))

// Mock OpenRouter API
vi.mock('@/lib/openrouter', () => ({
  OpenRouter: {
    categorize: vi.fn(() => Promise.resolve({
      category: 'מוצרי חלב',
      emoji: '🥛'
    }))
  }
}))
