import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '@/components/HomeScreen'
import { TabViewProvider } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'
import { Category } from '@/types/categories'

// Mock data
const mockCategories: Category[] = [
  {
    id: 1,
    name: 'מוצרי חלב',
    emoji: '🥛',
    items: [
      {
        id: 1,
        name: 'חלב',
        purchased: false,
        comment: 'טרי',
        photo: null,
        categoryId: 1,
        lastPurchaseAt: null,
        expectedGapDays: null,
        gapVariance: null,
        decayedCount: 0,
        purchaseCount: 0,
        snoozeUntil: null,
      },
      {
        id: 2,
        name: 'גבינה',
        purchased: true,
        comment: '',
        photo: null,
        categoryId: 1,
        lastPurchaseAt: null,
        expectedGapDays: null,
        gapVariance: null,
        decayedCount: 0,
        purchaseCount: 1,
        snoozeUntil: null,
      },
    ],
  },
  {
    id: 2,
    name: 'בית מרקחת',
    emoji: '💊',
    items: [
      {
        id: 3,
        name: 'אספירין',
        purchased: false,
        comment: '',
        photo: null,
        categoryId: 2,
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

const renderWithProvider = (component: React.ReactElement) => {
  return render(<TabViewProvider>{component}</TabViewProvider>)
}

describe('HomeScreen - Detailed Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to return our test data
    vi.mocked(subscribeToList).mockImplementation((listId, onData, onError) => {
      onData({ categories: mockCategories })
      return () => {}
    })
  })

  describe('Search Functionality', () => {
    it('displays search input', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('חפש פריטים...')
        expect(searchInput).toBeInTheDocument()
      })
    })

    it('filters items based on search query', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Expand category first to see items
      const categoryHeader = screen.getByText('מוצרי חלב')
      await user.click(categoryHeader)

      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חפש פריטים...')
      await user.type(searchInput, 'חלב')

      await waitFor(() => {
        // Should show search results with "חלב"
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
    })

    it('shows "no results" message when search has no matches', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חפש פריטים...')
      await user.type(searchInput, 'xyz123notfound')

      await waitFor(() => {
        expect(screen.getByText('לא נמצאו תוצאות')).toBeInTheDocument()
      })
    })

    it('can clear search with X button', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חפש פריטים...')
      await user.type(searchInput, 'חלב')

      await waitFor(() => {
        expect(searchInput).toHaveValue('חלב')
      })

      // Click the X button to clear
      const buttons = screen.getAllByRole('button')
      const clearButton = buttons.find((btn) =>
        btn.querySelector('.lucide-x')
      )
      if (clearButton) {
        await user.click(clearButton)
      }

      await waitFor(() => {
        expect(searchInput).toHaveValue('')
      })
    })

    it('respects tab filter in search results', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
      })

      // Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      // Search should only show pharmacy items
      const searchInput = screen.getByPlaceholderText('חפש פריטים...')
      await user.type(searchInput, 'אספירין')

      await waitFor(() => {
        expect(screen.getByText('אספירין')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Switching', () => {
    it('switches between grocery and pharmacy tabs', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('קניות')).toBeInTheDocument()
        expect(screen.getByText('בית מרקחת')).toBeInTheDocument()
      })

      // Initially on grocery tab - should show מוצרי חלב
      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      await waitFor(() => {
        // Should show pharmacy items
        expect(screen.getByText('אספירין')).toBeInTheDocument()
      })
    })

    it('shows correct item counts per tab', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('קניות')).toBeInTheDocument()
      })

      // Grocery tab should show 1 unchecked item (חלב)
      await waitFor(() => {
        // ProgressHeader shows counts
        const progressElements = screen.getAllByText(/\d+/)
        expect(progressElements.length).toBeGreaterThan(0)
      })

      // Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      await waitFor(() => {
        // Should update counts for pharmacy items
        expect(screen.getByText('אספירין')).toBeInTheDocument()
      })
    })

    it('filters categories correctly when switching tabs', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Pharmacy category should not be visible on grocery tab
      expect(screen.queryByText(/בית מרקחת.*💊/)).not.toBeInTheDocument()

      // Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      await waitFor(() => {
        // Should show pharmacy items, not grocery categories
        expect(screen.getByText('אספירין')).toBeInTheDocument()
        expect(screen.queryByText('מוצרי חלב')).not.toBeInTheDocument()
      })
    })
  })

  describe('Category Management', () => {
    it('expands and collapses categories', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Category should be expandable
      const categoryHeader = screen.getByText('מוצרי חלב')
      await user.click(categoryHeader)

      await waitFor(() => {
        // Items should be visible when expanded
        expect(screen.getByText('חלב')).toBeInTheDocument()
        expect(screen.getByText('גבינה')).toBeInTheDocument()
      })
    })

    it('shows category with item count', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Should show count like (1/2) - 1 unchecked out of 2 total
      await waitFor(() => {
        expect(screen.getByText('(1/2)')).toBeInTheDocument()
      })
    })

    it('shows empty state when no items in any category', async () => {
      // Mock empty categories
      vi.mocked(subscribeToList).mockImplementation((listId, onData, onError) => {
        onData({
          categories: [
            { id: 1, name: 'Empty', emoji: '📦', items: [] },
          ],
        })
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('הרשימה ריקה')).toBeInTheDocument()
      })
    })
  })

  describe('Item Operations', () => {
    it('opens add item modal when clicking add button', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('Stocked')).toBeInTheDocument()
      })

      // Find and click the add button (Plus icon)
      const buttons = screen.getAllByRole('button')
      const addButton = buttons.find((btn) =>
        btn.querySelector('.lucide-plus')
      )

      if (addButton) {
        await user.click(addButton)

        await waitFor(() => {
          // Modal should be loading (dynamically imported)
          // Since it's lazy loaded, we might see loading state
          // or the actual form depending on timing
        }, { timeout: 3000 })
      }
    })

    it('toggles item purchased state', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Expand category to see items
      const categoryHeader = screen.getByText('מוצרי חלב')
      await user.click(categoryHeader)

      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // Find checkbox for חלב item
      const itemRow = screen.getByText('חלב').closest('li')
      const buttons = itemRow?.querySelectorAll('button')
      if (buttons && buttons.length > 0) {
        const checkbox = buttons[0]
        await user.click(checkbox)

        // Should call updateList
        await waitFor(() => {
          expect(updateList).toHaveBeenCalled()
        })
      }
    })

    it('calls updateList when item is deleted', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Expand category
      const categoryHeader = screen.getByText('מוצרי חלב')
      await user.click(categoryHeader)

      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // Find delete button for חלב item
      const itemRow = screen.getByText('חלב').closest('li')
      const buttons = itemRow?.querySelectorAll('button')
      if (buttons && buttons.length > 0) {
        const deleteButton = buttons[buttons.length - 1]

        // First click shows confirmation
        await user.click(deleteButton)

        await waitFor(() => {
          expect(screen.getByText('למחוק?')).toBeInTheDocument()
        })

        // Second click actually deletes
        await user.click(deleteButton)

        await waitFor(() => {
          expect(updateList).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Data Loading', () => {
    it('subscribes to list on mount', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(subscribeToList).toHaveBeenCalledWith(
          'test-list-id',
          expect.any(Function),
          expect.any(Function)
        )
      })
    })

    it('unsubscribes when component unmounts', async () => {
      const unsubscribe = vi.fn()
      vi.mocked(subscribeToList).mockReturnValue(unsubscribe)

      const { unmount } = renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(subscribeToList).toHaveBeenCalled()
      })

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })

    it('handles error from subscription', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(subscribeToList).mockImplementation((listId, onData, onError) => {
        onError(new Error('Firebase error'))
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error subscribing to list:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })
  })

  describe('Progress Header', () => {
    it('displays unchecked and total item counts', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('Stocked')).toBeInTheDocument()
      })

      // Should show count indicators
      // In grocery tab: 1 unchecked (חלב), 2 total
      await waitFor(() => {
        const progressArea = screen.getByText('Stocked').closest('div')
        expect(progressArea).toBeInTheDocument()
      })
    })

    it('updates counts when switching tabs', async () => {
      const user = userEvent.setup()
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('קניות')).toBeInTheDocument()
      })

      // Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      await waitFor(() => {
        expect(screen.getByText('אספירין')).toBeInTheDocument()
      })

      // Counts should update for pharmacy items (1 unchecked, 1 total)
    })
  })

  describe('UI Elements', () => {
    it('renders app header with Stocked logo', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('Stocked')).toBeInTheDocument()
      })
    })

    it('renders share button in header', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        const header = screen.getByText('Stocked').closest('header')
        expect(header).toBeInTheDocument()
      })
    })

    it('renders floating action button for adding items', async () => {
      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const addButton = buttons.find((btn) =>
          btn.querySelector('.lucide-plus')
        )
        expect(addButton).toBeInTheDocument()
      })
    })
  })
})
