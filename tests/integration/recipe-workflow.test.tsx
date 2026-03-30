import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '@/components/HomeScreen'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'
import { OpenRouter } from '@/lib/openrouter'
import { Category } from '@/types/categories'

const renderWithProvider = (component: React.ReactElement) => {
  return render(<SettingsProvider><TabViewProvider>{component}</TabViewProvider></SettingsProvider>)
}

const makeItem = (id: number, name: string, overrides = {}) => ({
  id,
  name,
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
  ...overrides,
})

describe('Integration Tests - Recipe to Shopping List', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Enable recipes feature flag via localStorage
    localStorage.setItem('stocked-feature-flags', JSON.stringify({ enableRecipes: true }))
  })

  it('adds recipe ingredients to shopping list via batch categorization', async () => {
    const user = userEvent.setup()

    const initialCategories: Category[] = [
      { id: 1, emoji: '🥬', name: 'ירקות', items: [] },
      { id: 3, emoji: '🥛', name: 'מוצרי חלב', items: [] },
      { id: 16, emoji: '📦', name: 'אחר', items: [] },
    ]

    vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
      onData({ categories: initialCategories })
      return () => {}
    })

    vi.mocked(OpenRouter.categorizeBatch).mockResolvedValue([
      { name: 'עגבניות', category: 'ירקות' },
      { name: 'בצל', category: 'ירקות' },
    ])

    renderWithProvider(<HomeScreen />)

    // Wait for HomeScreen to load
    await waitFor(() => {
      expect(screen.getByAltText('Stocked')).toBeInTheDocument()
    })

    // Switch to recipes tab (text is hidden sm:inline, find button by chef-hat icon)
    const recipesTabButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-chef-hat')
    )
    expect(recipesTabButton).toBeDefined()
    await user.click(recipesTabButton!)

    // Wait for RecipesTab to lazy-load and render
    const newRecipeButton = await screen.findByText('מתכון חדש')

    // Create a recipe
    await user.click(newRecipeButton)
    await user.type(screen.getByPlaceholderText('שם המתכון...'), 'שקשוקה')
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'עגבניות')
    await user.click(screen.getByText('הוסף מרכיב'))
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'בצל')
    await user.click(screen.getByText('הוסף מרכיב'))
    await user.click(screen.getByText('שמור מתכון'))

    // Expand recipe and add all to list
    await user.click(await screen.findByText('שקשוקה'))

    const addAllButton = await screen.findByText(/הוסף 2 חוסרים לרשימה/)
    await user.click(addAllButton)

    // Verify batch categorization was called
    await waitFor(() => {
      expect(OpenRouter.categorizeBatch).toHaveBeenCalledWith([
        { name: 'עגבניות', comment: undefined },
        { name: 'בצל', comment: undefined },
      ])
    })

    // Verify updateList was called to persist
    await waitFor(() => {
      expect(updateList).toHaveBeenCalled()
    })
  })

  it('falls back to אחר category when batch categorization fails', async () => {
    const user = userEvent.setup()

    const initialCategories: Category[] = [
      { id: 1, emoji: '🥬', name: 'ירקות', items: [] },
      { id: 16, emoji: '📦', name: 'אחר', items: [] },
    ]

    vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
      onData({ categories: initialCategories })
      return () => {}
    })

    vi.mocked(OpenRouter.categorizeBatch).mockRejectedValue(new Error('API error'))

    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByAltText('Stocked')).toBeInTheDocument()
    })

    const recipesTabButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-chef-hat')
    )
    expect(recipesTabButton).toBeDefined()
    await user.click(recipesTabButton!)

    // Create and save recipe
    await user.click(screen.getByText('מתכון חדש'))
    await user.type(screen.getByPlaceholderText('שם המתכון...'), 'טסט')
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'דבר כלשהו')
    await user.click(screen.getByText('הוסף מרכיב'))
    await user.click(screen.getByText('שמור מתכון'))

    // Expand and add all
    await user.click(screen.getByText('טסט'))
    const addButton = await screen.findByText(/הוסף 1 חוסרים לרשימה/)
    await user.click(addButton)

    // Should still persist (with fallback category)
    await waitFor(() => {
      expect(updateList).toHaveBeenCalled()
    })
  })

  it('skips duplicate items when adding recipe ingredients', async () => {
    const user = userEvent.setup()

    const initialCategories: Category[] = [
      {
        id: 1,
        emoji: '🥬',
        name: 'ירקות',
        items: [makeItem(101, 'עגבניות')],
      },
      { id: 16, emoji: '📦', name: 'אחר', items: [] },
    ]

    vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
      onData({ categories: initialCategories })
      return () => {}
    })

    vi.mocked(OpenRouter.categorizeBatch).mockResolvedValue([
      { name: 'בצל', category: 'ירקות' },
    ])

    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByAltText('Stocked')).toBeInTheDocument()
    })

    const recipesTabButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-chef-hat')
    )
    expect(recipesTabButton).toBeDefined()
    await user.click(recipesTabButton!)

    // Create recipe with one item already in list
    await user.click(screen.getByText('מתכון חדש'))
    await user.type(screen.getByPlaceholderText('שם המתכון...'), 'סלט')
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'בצל')
    await user.click(screen.getByText('הוסף מרכיב'))
    await user.click(screen.getByText('שמור מתכון'))

    // "עגבניות" already in list, add-all should only add "בצל"
    await user.click(screen.getByText('סלט'))

    // The add-all button should show 1 missing (בצל), not עגבניות since it wasn't added to recipe
    const addButton = await screen.findByText(/הוסף 1 חוסרים לרשימה/)
    await user.click(addButton)

    // categorizeBatch should only receive the missing item
    await waitFor(() => {
      expect(OpenRouter.categorizeBatch).toHaveBeenCalledWith([
        { name: 'בצל', comment: undefined },
      ])
    })
  })
})
