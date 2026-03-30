import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecipesTab from '@/components/RecipesTab'
import { Category } from '@/types/categories'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

const mockCategories: Category[] = [
  { id: 1, emoji: '🥬', name: 'ירקות', items: [] },
  { id: 2, emoji: '🥛', name: 'מוצרי חלב', items: [
    { id: 101, name: 'חלב', purchased: false, comment: '', photo: null, lastPurchaseAt: null, expectedGapDays: null, gapVariance: null, decayedCount: 0, purchaseCount: 0, snoozeUntil: null },
  ]},
  { id: 16, emoji: '📦', name: 'אחר', items: [] },
]

const defaultProps = {
  listId: 'test-list-id',
  categories: mockCategories,
  onAddIngredients: vi.fn(),
  onToggleItem: vi.fn(),
}

describe('RecipesTab', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('renders empty state when no recipes exist', () => {
    render(<RecipesTab {...defaultProps} />)

    expect(screen.getByText('אין מתכונים עדיין')).toBeInTheDocument()
    expect(screen.getByText('מתכון חדש')).toBeInTheDocument()
  })

  it('opens add recipe form when clicking new recipe button', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    expect(screen.getByPlaceholderText('שם המתכון...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('שם מרכיב...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('כמות...')).toBeInTheDocument()
  })

  it('adds ingredient to pending list', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    const nameInput = screen.getByPlaceholderText('שם מרכיב...')
    await user.type(nameInput, 'עגבניות')
    await user.click(screen.getByText('הוסף מרכיב'))

    expect(screen.getByText('עגבניות')).toBeInTheDocument()
  })

  it('adds ingredient with comment', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'עגבניות')
    await user.type(screen.getByPlaceholderText('כמות...'), '3 יחידות')
    await user.click(screen.getByText('הוסף מרכיב'))

    expect(screen.getByText('עגבניות')).toBeInTheDocument()
    expect(screen.getByText('(3 יחידות)')).toBeInTheDocument()
  })

  it('clears ingredient inputs after adding', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    const nameInput = screen.getByPlaceholderText('שם מרכיב...')
    const commentInput = screen.getByPlaceholderText('כמות...')

    await user.type(nameInput, 'עגבניות')
    await user.type(commentInput, '3')
    await user.click(screen.getByText('הוסף מרכיב'))

    expect(nameInput).toHaveValue('')
    expect(commentInput).toHaveValue('')
  })

  it('auto-focuses ingredient name input after adding ingredient', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    const nameInput = screen.getByPlaceholderText('שם מרכיב...')
    await user.type(nameInput, 'עגבניות')
    await user.click(screen.getByText('הוסף מרכיב'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('שם מרכיב...')).toHaveFocus()
    })
  })

  it('adds ingredient via Enter key', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    const nameInput = screen.getByPlaceholderText('שם מרכיב...')
    await user.type(nameInput, 'עגבניות{Enter}')

    expect(screen.getByText('עגבניות')).toBeInTheDocument()
    expect(nameInput).toHaveValue('')
  })

  it('does not add empty ingredient', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    const addButton = screen.getByText('הוסף מרכיב')
    expect(addButton).toBeDisabled()
  })

  it('removes pending ingredient', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'עגבניות')
    await user.click(screen.getByText('הוסף מרכיב'))
    expect(screen.getByText('עגבניות')).toBeInTheDocument()

    // The X button next to the ingredient
    const removeButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('.lucide-x') && btn.closest('.bg-gray-50')
    )
    await user.click(removeButtons[0])

    expect(screen.queryByText('עגבניות')).not.toBeInTheDocument()
  })

  it('saves a recipe with name and ingredients', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    await user.type(screen.getByPlaceholderText('שם המתכון...'), 'שקשוקה')
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'עגבניות')
    await user.click(screen.getByText('הוסף מרכיב'))
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'ביצים')
    await user.click(screen.getByText('הוסף מרכיב'))

    await user.click(screen.getByText('שמור מתכון'))

    // Recipe should appear in the list
    await waitFor(() => {
      expect(screen.getByText('שקשוקה')).toBeInTheDocument()
    })
    // Form should be closed (wait for AnimatePresence exit)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('שם המתכון...')).not.toBeInTheDocument()
    })
    // Should persist to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('does not save recipe without name', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    // Add ingredient but no name
    await user.type(screen.getByPlaceholderText('שם מרכיב...'), 'עגבניות')
    await user.click(screen.getByText('הוסף מרכיב'))

    const saveButton = screen.getByText('שמור מתכון')
    expect(saveButton).toBeDisabled()
  })

  it('does not save recipe without ingredients', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))

    await user.type(screen.getByPlaceholderText('שם המתכון...'), 'שקשוקה')

    const saveButton = screen.getByText('שמור מתכון')
    expect(saveButton).toBeDisabled()
  })

  it('closes add recipe form via X button', async () => {
    const user = userEvent.setup()
    render(<RecipesTab {...defaultProps} />)

    await user.click(screen.getByText('מתכון חדש'))
    expect(screen.getByPlaceholderText('שם המתכון...')).toBeInTheDocument()

    // The close button is the one with hover:bg-gray-100 rounded-full in the form header
    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.classList.contains('rounded-full') && btn.classList.contains('hover:bg-gray-100')
    )
    expect(closeButton).toBeDefined()
    await user.click(closeButton!)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('שם המתכון...')).not.toBeInTheDocument()
    })
  })

  describe('with saved recipes', () => {
    const savedRecipes = [
      {
        id: 1,
        name: 'שקשוקה',
        ingredients: [
          { id: 1, name: 'עגבניות' },
          { id: 2, name: 'ביצים' },
          { id: 3, name: 'חלב', comment: 'כוס אחת' },
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    beforeEach(() => {
      localStorageMock.setItem(
        'stocked-recipes-test-list-id',
        JSON.stringify(savedRecipes)
      )
    })

    it('loads and displays saved recipes', () => {
      render(<RecipesTab {...defaultProps} />)

      expect(screen.getByText('שקשוקה')).toBeInTheDocument()
    })

    it('expands recipe to show ingredients', async () => {
      const user = userEvent.setup()
      render(<RecipesTab {...defaultProps} />)

      await user.click(screen.getByText('שקשוקה'))

      expect(screen.getByText('עגבניות')).toBeInTheDocument()
      expect(screen.getByText('ביצים')).toBeInTheDocument()
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })

    it('shows ingredient already in list with category emoji', async () => {
      const user = userEvent.setup()
      render(<RecipesTab {...defaultProps} />)

      await user.click(screen.getByText('שקשוקה'))

      // "חלב" exists in mockCategories under מוצרי חלב
      // Should show the category emoji badge
      expect(screen.getByText('🥛')).toBeInTheDocument()
    })

    it('calls onAddIngredients for add-all with only missing items', async () => {
      const user = userEvent.setup()
      render(<RecipesTab {...defaultProps} />)

      await user.click(screen.getByText('שקשוקה'))

      // "חלב" is already in the list, so only 2 should be added
      const addAllButton = screen.getByText(/הוסף 2 חוסרים לרשימה/)
      await user.click(addAllButton)

      expect(defaultProps.onAddIngredients).toHaveBeenCalledWith([
        { name: 'עגבניות', comment: '' },
        { name: 'ביצים', comment: '' },
      ])
    })

    it('calls onAddIngredients for single ingredient', async () => {
      const user = userEvent.setup()
      render(<RecipesTab {...defaultProps} />)

      await user.click(screen.getByText('שקשוקה'))

      // Click the shopping cart icon next to a missing ingredient
      const cartButtons = screen.getAllByTitle('הוסף לרשימה')
      await user.click(cartButtons[0])

      expect(defaultProps.onAddIngredients).toHaveBeenCalledTimes(1)
    })

    it('shows recipe progress count', () => {
      render(<RecipesTab {...defaultProps} />)

      // 0 purchased out of 3 total
      expect(screen.getByText('0/3')).toBeInTheDocument()
    })

    it('deletes recipe on double confirm', async () => {
      const user = userEvent.setup()
      render(<RecipesTab {...defaultProps} />)

      await user.click(screen.getByText('שקשוקה'))

      // First click shows confirmation — find the trash button by its svg
      const deleteButton = screen.getAllByRole('button').find(btn => {
        const svg = btn.querySelector('svg')
        return svg && Array.from(svg.classList).some(c => c.includes('trash'))
      })
      expect(deleteButton).toBeDefined()
      await user.click(deleteButton!)

      expect(screen.getByText('למחוק?')).toBeInTheDocument()

      // Second click deletes
      await user.click(screen.getByText('למחוק?'))

      expect(screen.queryByText('שקשוקה')).not.toBeInTheDocument()
    })

    it('adds inline ingredient to existing recipe', async () => {
      const user = userEvent.setup()
      render(<RecipesTab {...defaultProps} />)

      await user.click(screen.getByText('שקשוקה'))

      const inlineInput = screen.getByPlaceholderText('הוסף מרכיב...')
      await user.type(inlineInput, 'פלפל{Enter}')

      expect(screen.getByText('פלפל')).toBeInTheDocument()
    })
  })
})
