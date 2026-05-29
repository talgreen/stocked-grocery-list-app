import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '@/components/HomeScreen'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'
import { subscribeToList, updateList } from '@/lib/db'

const renderWithProvider = (component: React.ReactElement) =>
  render(<SettingsProvider><TabViewProvider>{component}</TabViewProvider></SettingsProvider>)

// Faithful Firestore simulation: the subscription re-emits server state after
// every write, exactly like onSnapshot does in the real app.
function wireFirestoreSim() {
  let server: any = { categories: [], purposeLists: [] }
  let emit: ((data: any) => void) | null = null

  vi.mocked(subscribeToList).mockImplementation((listId, onData) => {
    emit = onData
    onData(JSON.parse(JSON.stringify(server)))
    return () => {}
  })

  vi.mocked(updateList).mockImplementation(async (listId, categories, purposeLists) => {
    server = { categories, purposeLists: purposeLists ?? [] }
    // mimic onSnapshot firing after the write commits
    emit?.(JSON.parse(JSON.stringify(server)))
  })

  return { getServer: () => server }
}

describe('Purpose lists (end-to-end with faithful subscription)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('stocked-feature-flags', JSON.stringify({ enablePurposeLists: true }))
  })

  it('creates a list, a category, and a second list', async () => {
    const sim = wireFirestoreSim()
    const user = userEvent.setup()
    renderWithProvider(<HomeScreen />)

    // Create first list
    await waitFor(() => expect(screen.getByTitle('רשימה חדשה')).toBeInTheDocument())
    await user.click(screen.getByTitle('רשימה חדשה'))
    await waitFor(() => expect(screen.getByPlaceholderText(/שם הרשימה/)).toBeInTheDocument())
    await user.type(screen.getByPlaceholderText(/שם הרשימה/), 'טיול')
    await user.click(screen.getByRole('button', { name: 'צור רשימה' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'הוסף קטגוריה' })).toBeInTheDocument())

    // Add a category
    await user.click(screen.getByRole('button', { name: 'הוסף קטגוריה' }))
    await waitFor(() => expect(screen.getByPlaceholderText('שם הקטגוריה')).toBeInTheDocument())
    await user.type(screen.getByPlaceholderText('שם הקטגוריה'), 'ביגוד')
    const addCatButtons = screen.getAllByRole('button', { name: 'הוסף קטגוריה' })
    await user.click(addCatButtons[addCatButtons.length - 1])

    await waitFor(() => expect(screen.getByText('ביגוד')).toBeInTheDocument())
    expect(sim.getServer().purposeLists[0].categories).toHaveLength(1)

    // Create a second list
    await user.click(screen.getByTitle('רשימה חדשה'))
    await waitFor(() => expect(screen.getByPlaceholderText(/שם הרשימה/)).toBeInTheDocument())
    await user.type(screen.getByPlaceholderText(/שם הרשימה/), 'מסיבה')
    await user.click(screen.getByRole('button', { name: 'צור רשימה' }))

    await waitFor(() => expect(sim.getServer().purposeLists).toHaveLength(2))
    expect(screen.getAllByText('מסיבה').length).toBeGreaterThan(0)
  })
})
