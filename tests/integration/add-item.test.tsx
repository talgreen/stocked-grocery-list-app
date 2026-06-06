import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '@/components/HomeScreen'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'
import { OpenRouter } from '@/lib/openrouter'

const renderWithProvider = (component: React.ReactElement) => {
  return render(<SettingsProvider><TabViewProvider>{component}</TabViewProvider></SettingsProvider>)
}

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
})
