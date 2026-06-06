import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '@/components/HomeScreen'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'
import { OpenRouter } from '@/lib/openrouter'

const renderWithProvider = (component: React.ReactElement) => {
  return render(<SettingsProvider><TabViewProvider>{component}</TabViewProvider></SettingsProvider>)
}

// Radix Select relies on a few DOM APIs jsdom doesn't implement.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false) as any
  Element.prototype.setPointerCapture = vi.fn() as any
  Element.prototype.releasePointerCapture = vi.fn() as any
})

// Finds the floating "+" add button (lucide-plus icon) rendered by HomeScreen.
const getAddFab = () =>
  screen.getAllByRole('button').find(btn =>
    btn.querySelector('svg')?.classList.contains('lucide-plus')
  )

describe('Add item flow (the most basic, must-work journey)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
      onData({ categories: [] } as any)
      return () => {}
    })
  })

  it('adds a new item via the add form and shows it in the list', async () => {
    const user = userEvent.setup()
    renderWithProvider(<HomeScreen />)

    // App finished loading (search box from CompactHeader is present).
    await waitFor(() => {
      expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
    })

    // 1. Open the add form via the FAB.
    const fab = getAddFab()
    expect(fab).toBeDefined()
    await user.click(fab!)

    // 2. The form (lazy-loaded) appears with its item-name field.
    const nameInput = await screen.findByPlaceholderText('שם הפריט')

    // 3. Type a name and submit.
    await user.type(nameInput, 'במבה')
    await user.click(screen.getByRole('button', { name: /הוסף לרשימה/ }))

    // 4. The change is persisted...
    await waitFor(() => {
      expect(updateList).toHaveBeenCalled()
    })

    // 5. ...and the new item is visible in the list.
    await waitFor(() => {
      expect(screen.getByText('במבה')).toBeInTheDocument()
    })
  })

  it('still adds the item when smart categorization fails (falls back to אחר)', async () => {
    // Simulate the categorization API being down / misconfigured.
    vi.mocked(OpenRouter.categorize).mockRejectedValueOnce(new Error('API down'))

    const user = userEvent.setup()
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
    })

    await user.click(getAddFab()!)
    const nameInput = await screen.findByPlaceholderText('שם הפריט')
    await user.type(nameInput, 'במבה')
    await user.click(screen.getByRole('button', { name: /הוסף לרשימה/ }))

    // The item must NOT be lost just because categorization failed.
    await waitFor(() => {
      expect(screen.getByText('במבה')).toBeInTheDocument()
    })
    expect(updateList).toHaveBeenCalled()
  })

  it('adds an item to a specific category via the inline category input', async () => {
    vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
      onData({
        categories: [
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
        ],
      } as any)
      return () => {}
    })

    const user = userEvent.setup()
    renderWithProvider(<HomeScreen />)

    // Expand the category so its inline "add" input is shown.
    const categoryHeader = await screen.findByText('מוצרי חלב')
    await user.click(categoryHeader)

    const inlineInput = await screen.findByPlaceholderText('הוסף פריט חדש...')
    await user.type(inlineInput, 'קוטג{Enter}')

    // The new item should appear in that exact category (no AI call involved).
    await waitFor(() => {
      expect(screen.getByText('קוטג')).toBeInTheDocument()
    })
    expect(updateList).toHaveBeenCalled()
  })

  it('adds an item to a manually selected category from the add form (no AI call)', async () => {
    vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
      onData({
        categories: [
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
        ],
      } as any)
      return () => {}
    })

    const user = userEvent.setup()
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('חפש פריטים...')).toBeInTheDocument()
    })

    // Open the add form.
    await user.click(getAddFab()!)
    const nameInput = await screen.findByPlaceholderText('שם הפריט')

    // Pick a specific category (defaults to "חכם"/auto) from the Select.
    await user.click(screen.getByRole('combobox'))
    const listbox = await screen.findByRole('listbox')
    await user.click(within(listbox).getByText(/מוצרי חלב/))

    await user.type(nameInput, 'יוגורט')
    await user.click(screen.getByRole('button', { name: /הוסף לרשימה/ }))

    // Item lands in the chosen category, and categorization is never called.
    await waitFor(() => {
      expect(screen.getByText('יוגורט')).toBeInTheDocument()
    })
    expect(OpenRouter.categorize).not.toHaveBeenCalled()
    expect(updateList).toHaveBeenCalled()
  })
})
