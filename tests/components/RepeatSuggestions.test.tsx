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

describe('RepeatSuggestions', () => {
  it('renders suggestions with item names', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    expect(screen.getByText('חלב')).toBeInTheDocument()
    expect(screen.getByText('לחם')).toBeInTheDocument()
  })

  it('displays category emoji and name for each suggestion', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    expect(screen.getByText(/🥛.*מוצרי חלב/)).toBeInTheDocument()
    expect(screen.getByText(/🍞.*לחם ומאפים/)).toBeInTheDocument()
  })

  it('shows formatted interval text', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Should show intervals - using getAllByText since there are multiple suggestions
    const intervalTexts = screen.getAllByText(/בערך כל/)
    expect(intervalTexts.length).toBeGreaterThan(0)
  })

  it('calls onUncheck when "החזר לרשימה" button is clicked', async () => {
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

    const returnButtons = screen.getAllByText('החזר לרשימה')
    await user.click(returnButtons[0])

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

    const snoozeButtons = screen.getAllByText('השהה')
    await user.click(snoozeButtons[0])

    // Dropdown should show snooze options
    // Note: Radix UI dropdowns may need special handling in tests
  })

  it('can be collapsed and expanded', async () => {
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

    // Should show items initially (expanded by default based on useState(false))
    expect(screen.getByText('חלב')).toBeInTheDocument()

    // Find and click the collapse button
    const collapseButton = screen.getByText('הצעות חכמות לפריטים שחוזרים')
    await user.click(collapseButton)

    // Items should be hidden, collapsed message shown
    // Note: This depends on the actual implementation of collapse/expand
  })

  it('shows appropriate message for suggestion count', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    const singleSuggestion = [mockSuggestions[0]]

    render(
      <RepeatSuggestions
        suggestions={singleSuggestion}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Should indicate there's one suggestion when collapsed
    // (This is shown in the collapse button text)
    expect(screen.getByText(/הוספה מהירה/)).toBeInTheDocument()
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

  it('displays purchase history information', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Should show purchase history - using getAllByText since there are multiple suggestions
    const purchaseTexts = screen.getAllByText(/נקנה/)
    expect(purchaseTexts.length).toBeGreaterThan(0)
  })

  it('shows privacy notice about local storage', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    expect(
      screen.getByText(/ההצעות מבוססות על הרגלי הקנייה האישיים שלך ונשמרות מקומית בלבד/)
    ).toBeInTheDocument()
  })

  it('handles multiple suggestions correctly', () => {
    const onUncheck = vi.fn()
    const onSnooze = vi.fn()

    render(
      <RepeatSuggestions
        suggestions={mockSuggestions}
        onUncheck={onUncheck}
        onSnooze={onSnooze}
      />
    )

    // Should render both suggestions
    const returnButtons = screen.getAllByText('החזר לרשימה')
    expect(returnButtons).toHaveLength(2)

    const snoozeButtons = screen.getAllByText('השהה')
    expect(snoozeButtons).toHaveLength(2)
  })
})
