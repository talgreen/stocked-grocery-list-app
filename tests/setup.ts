import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
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
  subscribeToList: vi.fn((listId, onData, onError) => {
    // Return mock data immediately
    onData({ categories: [] })
    return () => {} // unsubscribe function
  }),
  updateList: vi.fn(() => Promise.resolve()),
  createNewList: vi.fn((listId: string) => Promise.resolve(listId)),
  getList: vi.fn(() => Promise.resolve({ categories: [] })),
  claimList: vi.fn(() => Promise.resolve()),
  ensureUserDoc: vi.fn(() => Promise.resolve()),
}))

// Mock the auth context so components consuming useAuth get a stable signed-in
// user without needing an AuthProvider wrapper. The returned object is created
// once (stable reference) so effects depending on it don't loop. Individual
// tests can override via vi.mocked(useAuth).mockReturnValue(...).
vi.mock('@/contexts/AuthContext', () => {
  const ctx = {
    user: {
      uid: 'test-uid',
      isAnonymous: false,
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
    },
    loading: false,
    signInWithGoogle: vi.fn(() => Promise.resolve()),
    signOutUser: vi.fn(() => Promise.resolve()),
  }
  return {
    useAuth: vi.fn(() => ctx),
    AuthProvider: ({ children }: { children: unknown }) => children,
  }
})

// Mock OpenRouter API
vi.mock('@/lib/openrouter', () => ({
  OpenRouter: {
    categorize: vi.fn(() => Promise.resolve({
      category: 'מוצרי חלב',
      emoji: '🥛'
    })),
    categorizeBatch: vi.fn((items: Array<{ name: string; comment?: string }>) =>
      Promise.resolve(
        items.map(item => ({ name: item.name, category: 'מוצרי חלב' }))
      )
    ),
  }
}))
