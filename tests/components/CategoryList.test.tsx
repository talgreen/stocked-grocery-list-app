import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryList from '@/components/CategoryList'
import { Category } from '@/types/categories'
import { TabViewProvider } from '@/contexts/TabViewContext'

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
        purchased: true,
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

const renderWithProvider = (component: React.ReactElement) => {
  return render(<TabViewProvider>{component}</TabViewProvider>)
}

describe('CategoryList', () => {
  it('renders category name and emoji', () => {
    const onToggleItem = vi.fn()
    const onDeleteItem = vi.fn()
    const onEditItem = vi.fn()
    const setExpandedCategories = vi.fn()

    renderWithProvider(
      <CategoryList
        categories={mockCategories}
        onToggleItem={onToggleItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        expandedCategories={[1]}
        setExpandedCategories={setExpandedCategories}
      />
    )

    expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
    expect(screen.getByText('🥛')).toBeInTheDocument()
  })

  it('displays item counts correctly', () => {
    const onToggleItem = vi.fn()
    const onDeleteItem = vi.fn()
    const onEditItem = vi.fn()
    const setExpandedCategories = vi.fn()

    renderWithProvider(
      <CategoryList
        categories={mockCategories}
        onToggleItem={onToggleItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        expandedCategories={[1]}
        setExpandedCategories={setExpandedCategories}
      />
    )

    // Should show (1/2) - 1 unchecked out of 2 total
    expect(screen.getByText('(1/2)')).toBeInTheDocument()
  })

  it('shows items when category is expanded', () => {
    const onToggleItem = vi.fn()
    const onDeleteItem = vi.fn()
    const onEditItem = vi.fn()
    const setExpandedCategories = vi.fn()

    renderWithProvider(
      <CategoryList
        categories={mockCategories}
        onToggleItem={onToggleItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        expandedCategories={[1]}
        setExpandedCategories={setExpandedCategories}
      />
    )

    expect(screen.getByText('חלב')).toBeInTheDocument()
    expect(screen.getByText('גבינה')).toBeInTheDocument()
  })

  it('renders empty state when no categories have items', () => {
    const onToggleItem = vi.fn()
    const onDeleteItem = vi.fn()
    const onEditItem = vi.fn()
    const setExpandedCategories = vi.fn()

    renderWithProvider(
      <CategoryList
        categories={[{ id: 1, name: 'ריק', emoji: '📦', items: [] }]}
        onToggleItem={onToggleItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        expandedCategories={[]}
        setExpandedCategories={setExpandedCategories}
      />
    )

    expect(screen.getByText('הרשימה ריקה')).toBeInTheDocument()
  })

  it('shows completion check mark when all items are purchased', () => {
    const completedCategory: Category[] = [
      {
        id: 1,
        name: 'מושלם',
        emoji: '✅',
        items: [
          {
            id: 1,
            name: 'פריט',
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
    ]

    const onToggleItem = vi.fn()
    const onDeleteItem = vi.fn()
    const onEditItem = vi.fn()
    const setExpandedCategories = vi.fn()

    renderWithProvider(
      <CategoryList
        categories={completedCategory}
        onToggleItem={onToggleItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        expandedCategories={[1]}
        setExpandedCategories={setExpandedCategories}
      />
    )

    expect(screen.getByText('(0/1)')).toBeInTheDocument()
  })
})
