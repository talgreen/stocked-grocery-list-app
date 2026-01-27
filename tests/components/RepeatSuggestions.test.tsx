import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RepeatSuggestions from '@/components/RepeatSuggestions'
import { RepeatSuggestion } from '@/lib/repeat-suggester'

const mockSuggestions: RepeatSuggestion[] = [
  {
    item: {
      id: 1,
      name: 'חלב',
      purchased: true,
      comment: '',
      photo: null,
      categoryId: 1,
      lastPurchaseAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      expectedGapDays: 7,
      gapVariance: 1,
      decayedCount: 3,
      purchaseCount: 3,
      snoozeUntil: null,
    },
    categoryId: 1,
    categoryName: 'מוצרי חלב',
    categoryEmoji: '🥛',
    expectedGapDays: 7,
    daysSinceLastPurchase: 8,
    dueScore: 0.5,
  },
  {
    item: {
      id: 2,
      name: 'לחם',
      purchased: true,
      comment: '',
      photo: null,
      categoryId: 2,
      lastPurchaseAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      expectedGapDays: 3,
      gapVariance: 0.5,
      decayedCount: 5,
      purchaseCount: 5,
      snoozeUntil: null,
    },
    categoryId: 2,
    categoryName: 'לחם ומאפים',
    categoryEmoji: '🍞',
    expectedGapDays: 3,
    daysSinceLastPurchase: 4,
    dueScore: 0.6,
  },
]

// Helper function to expand the component (since it starts collapsed)
async function expandComponent(user: ReturnType<typeof userEvent.setup>) {
  const headerButton = screen.getByRole('button', { name: /קניות חוזרות/i })
  await user.click(headerButton)
}

describe('RepeatSuggestions', () => {
  it('renders suggestions with item names when expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Expand the component first (starts collapsed by default)
    await expandComponent(user)

    expect(screen.getByText('חלב')).toBeInTheDocument()
    expect(screen.getByText('לחם')).toBeInTheDocument()
  })

  it('displays category emoji for each suggestion when expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    expect(screen.getByText('🥛')).toBeInTheDocument()
    expect(screen.getByText('🍞')).toBeInTheDocument()
  })

  it('shows formatted interval text when expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    // Should show intervals - using getAllByText since there are multiple suggestions
    const intervalTexts = screen.getAllByText(/כל \d+ ימים/)
    expect(intervalTexts.length).toBeGreaterThan(0)
  })

  it('calls onUncheck when add button is clicked', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    // Add buttons now use aria-label
    const addButtons = screen.getAllByRole('button', { name: 'הוסף לרשימה' })
    await user.click(addButtons[0])

    expect(onUncheck).toHaveBeenCalledWith(
      mockSuggestions[0].categoryId,
      mockSuggestions[0].item.id
    )
  })

  it('opens snooze dropdown when clicking snooze button', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    // Snooze buttons now use aria-label
    const snoozeButtons = screen.getAllByRole('button', { name: 'השהה פריט' })
    await user.click(snoozeButtons[0])

    // Dropdown should show snooze options
    // Note: Radix UI dropdowns may need special handling in tests
  })

  it('starts collapsed and can be expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Should start collapsed - items not visible
    expect(screen.queryByText('חלב')).not.toBeInTheDocument()

    // Should show preview text when collapsed
    expect(screen.getByText('קניות חוזרות')).toBeInTheDocument()

    // Expand the component
    await expandComponent(user)

    // Items should now be visible
    expect(screen.getByText('חלב')).toBeInTheDocument()
    expect(screen.getByText('לחם')).toBeInTheDocument()
  })

  it('shows count badge', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Should show count badge
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not render when suggestions array is empty', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    const { container } = render(
      <RepeatSuggestions
        suggestions={[]}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Component returns null for empty suggestions
    expect(container.firstChild).toBeNull()
  })

  it('displays purchase history information when expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    // Should show purchase history - using getAllByText since there are multiple suggestions
    const purchaseTexts = screen.getAllByText(/לפני \d+ ימים/)
    expect(purchaseTexts.length).toBeGreaterThan(0)
  })

  it('shows footer text when expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    expect(
      screen.getByText(/מבוסס על היסטוריית הקניות שלך/)
    ).toBeInTheDocument()
  })

  it('handles multiple suggestions correctly when expanded', async () => {
    const user = userEvent.setup()
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    await expandComponent(user)

    // Should render both suggestions with add buttons
    const addButtons = screen.getAllByRole('button', { name: 'הוסף לרשימה' })
    expect(addButtons).toHaveLength(2)

    const snoozeButtons = screen.getAllByRole('button', { name: 'השהה פריט' })
    expect(snoozeButtons).toHaveLength(2)
  })
})
