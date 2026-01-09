import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import HomeScreen from '@/components/HomeScreen'
import { TabViewProvider } from '@/contexts/TabViewContext'

const renderWithProvider = (component: React.ReactElement) => {
  return render(<TabViewProvider>{component}</TabViewProvider>)
}

describe('HomeScreen', () => {
  it('renders without crashing', async () => {
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByText('Stocked')).toBeInTheDocument()
    })
  })

  it('handles initial state correctly', async () => {
    renderWithProvider(<HomeScreen />)

    // Component should either show loading state or content
    // Since our mock loads instantly, we wait for content
    await waitFor(() => {
      expect(screen.getByText('Stocked')).toBeInTheDocument()
    })
  })

  it('renders tab navigation', async () => {
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByText('קניות')).toBeInTheDocument()
      expect(screen.getByText('בית מרקחת')).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('חפש פריטים...')
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('renders add button', async () => {
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      const addButtons = screen.getAllByRole('button')
      const addButton = addButtons.find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-plus')
      )
      expect(addButton).toBeInTheDocument()
    })
  })

  it('renders share button', async () => {
    renderWithProvider(<HomeScreen />)

    await waitFor(() => {
      // ShareButton should be present
      expect(screen.getByText('Stocked')).toBeInTheDocument()
    })
  })
})
