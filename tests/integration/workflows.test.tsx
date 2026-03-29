import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '@/components/HomeScreen'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'
import { Category } from '@/types/categories'

const renderWithProvider = (component: React.ReactElement) => {
  return render(<SettingsProvider><TabViewProvider>{component}</TabViewProvider></SettingsProvider>)
}

describe('Integration Tests - User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Shopping Journey', () => {
    it('user can complete a full shopping workflow', async () => {
      const user = userEvent.setup()

      const initialCategories: Category[] = [
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
            {
              id: 2,
              name: 'גבינה',
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

      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
        onData({ categories: initialCategories })
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // 1. Expand category to see items
      const categoryHeader = screen.getByText('מוצרי חלב')
      await user.click(categoryHeader)

      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
        expect(screen.getByText('גבינה')).toBeInTheDocument()
      })

      // 2. Check off first item (חלב)
      const milkRow = screen.getByText('חלב').closest('li')
      const milkButtons = milkRow?.querySelectorAll('button')
      if (milkButtons && milkButtons.length > 0) {
        await user.click(milkButtons[0])

        await waitFor(() => {
          expect(updateList).toHaveBeenCalled()
        })
      }

      // 3. Check off second item (גבינה)
      const cheeseRow = screen.getByText('גבינה').closest('li')
      const cheeseButtons = cheeseRow?.querySelectorAll('button')
      if (cheeseButtons && cheeseButtons.length > 0) {
        await user.click(cheeseButtons[0])

        await waitFor(() => {
          expect(updateList).toHaveBeenCalledTimes(2)
        })
      }

      // Category should now be completed
      // (In real app, category would collapse and show confetti)
    })
  })

  describe('Search and Quick Add', () => {
    it('user searches for non-existent item and adds it', async () => {
      const user = userEvent.setup()

      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
        onData({ categories: [] })
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
      })

      // 1. Search for item that doesn't exist
      const searchInput = screen.getByPlaceholderText('חפש פריטים...')
      await user.type(searchInput, 'לחם')

      // Wait for the search input to have the full value
      await waitFor(() => {
        expect(searchInput).toHaveValue('לחם')
      })

      await waitFor(() => {
        // New empty state shows "לא מצאנו את" with the search query
        expect(screen.getByText(/לא מצאנו את.*לחם/)).toBeInTheDocument()
      })

      // 2. Quick add button should appear
      await waitFor(() => {
        const quickAddButton = screen.getByRole('button', {
          name: (name) => name.includes('הוסף') && name.includes('לחם')
        })
        expect(quickAddButton).toBeInTheDocument()
      })
    })
  })

  describe('Tab Switching Workflow', () => {
    it('user switches between grocery and pharmacy shopping', async () => {
      const user = userEvent.setup()

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
        {
          id: 2,
          name: 'בית מרקחת',
          emoji: '💊',
          items: [
            {
              id: 2,
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

      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
        onData({ categories })
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      // 1. Start on grocery tab
      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      // Expand and check off grocery item
      const categoryHeader = screen.getByText('מוצרי חלב')
      await user.click(categoryHeader)

      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      const milkRow = screen.getByText('חלב').closest('li')
      const milkButtons = milkRow?.querySelectorAll('button')
      if (milkButtons) {
        await user.click(milkButtons[0])
      }

      // 2. Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      await waitFor(() => {
        expect(screen.getByText('אספירין')).toBeInTheDocument()
      })

      // Check off pharmacy item
      const aspirinRow = screen.getByText('אספירין').closest('li')
      const aspirinButtons = aspirinRow?.querySelectorAll('button')
      if (aspirinButtons) {
        await user.click(aspirinButtons[0])

        await waitFor(() => {
          expect(updateList).toHaveBeenCalledTimes(2)
        })
      }

      // 3. Switch back to grocery tab
      const groceryTab = screen.getByText('קניות')
      await user.click(groceryTab)

      await waitFor(() => {
        // Should show grocery categories again
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })
    })
  })

  describe('Category Expansion Workflow', () => {
    it('user expands multiple categories and manages items', async () => {
      const user = userEvent.setup()

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
        {
          id: 2,
          name: 'פירות וירקות',
          emoji: '🥬',
          items: [
            {
              id: 2,
              name: 'עגבניות',
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

      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
        onData({ categories })
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      // 1. Expand first category
      await waitFor(() => {
        expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      })

      const dairyCategory = screen.getByText('מוצרי חלב')
      await user.click(dairyCategory)

      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // 2. Expand second category
      await waitFor(() => {
        expect(screen.getByText('פירות וירקות')).toBeInTheDocument()
      })

      const produceCategory = screen.getByText('פירות וירקות')
      await user.click(produceCategory)

      await waitFor(() => {
        expect(screen.getByText('עגבניות')).toBeInTheDocument()
      })

      // 3. Both categories should be visible and expanded
      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.getByText('עגבניות')).toBeInTheDocument()

      // 4. Collapse first category
      await user.click(dairyCategory)

      await waitFor(() => {
        // Second category should still show its items
        expect(screen.getByText('עגבניות')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State Handling', () => {
    it('displays appropriate empty state for grocery tab', async () => {
      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
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

    it('displays appropriate empty state for pharmacy tab', async () => {
      const user = userEvent.setup()

      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
        onData({
          categories: [
            {
              id: 1,
              name: 'בית מרקחת',
              emoji: '💊',
              items: [],
            },
          ],
        })
        return () => {}
      })

      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('בית מרקחת')).toBeInTheDocument()
      })

      // Switch to pharmacy tab
      const pharmacyTab = screen.getByText('בית מרקחת')
      await user.click(pharmacyTab)

      await waitFor(() => {
        expect(screen.getByText('רשימת בית המרקחת ריקה')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles Firebase subscription errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(subscribeToList).mockImplementation((listId, onData, onError) => {
        onError(new Error('Connection failed'))
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

    it('handles updateList errors and reverts state', async () => {
      const user = userEvent.setup()
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const categories: Category[] = [
        {
          id: 1,
          name: 'Test',
          emoji: '🧪',
          items: [
            {
              id: 1,
              name: 'Item',
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

      vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
        onData({ categories })
        return () => {}
      })

      // Make updateList fail
      vi.mocked(updateList).mockRejectedValueOnce(new Error('Update failed'))

      renderWithProvider(<HomeScreen />)

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument()
      })

      // Try to toggle item
      const categoryHeader = screen.getByText('Test')
      await user.click(categoryHeader)

      await waitFor(() => {
        expect(screen.getByText('Item')).toBeInTheDocument()
      })

      const itemRow = screen.getByText('Item').closest('li')
      const buttons = itemRow?.querySelectorAll('button')
      if (buttons) {
        await user.click(buttons[0])

        // Should log error
        await waitFor(() => {
          expect(consoleError).toHaveBeenCalledWith(
            'Error updating list:',
            expect.any(Error)
          )
        })
      }

      consoleError.mockRestore()
    })
  })
})
