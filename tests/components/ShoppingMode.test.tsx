import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShoppingMode from '@/components/ShoppingMode'
import { Category } from '@/types/categories'
import { Item } from '@/types/item'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'

// Confetti is a fire-and-forget side effect; stub it so the dynamic import
// resolves without touching the canvas in jsdom.
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// Strip framer-motion's animation lifecycle so view swaps (AnimatePresence
// mode="wait") and enter/exit transitions resolve synchronously in tests.
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const MOTION_PROPS = new Set([
    'initial', 'animate', 'exit', 'transition', 'layout', 'variants',
    'whileTap', 'whileHover', 'whileInView', 'whileFocus', 'whileDrag',
    'drag', 'dragConstraints', 'dragElastic', 'onDragEnd', 'onDragStart',
  ])
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef(function MotionMock(props: any, ref: any) {
          const clean: Record<string, any> = {}
          for (const key in props) {
            if (!MOTION_PROPS.has(key)) clean[key] = props[key]
          }
          return React.createElement(tag, { ...clean, ref })
        }),
    }
  )
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useMotionValue: (value: number) => ({ get: () => value, set: () => {} }),
  }
})

function makeItem(id: number, name: string, purchased = false): Item {
  return {
    id,
    name,
    purchased,
    comment: '',
    photo: null,
    lastPurchaseAt: null,
    expectedGapDays: null,
    gapVariance: null,
    decayedCount: 0,
    purchaseCount: 0,
    snoozeUntil: null,
  }
}

const baseCategories: Category[] = [
  {
    id: 1,
    name: 'ירקות',
    emoji: '🥬',
    items: [makeItem(11, 'מלפפון', false), makeItem(12, 'עגבניה', true)],
  },
  {
    id: 2,
    name: 'פירות',
    emoji: '🍎',
    items: [makeItem(21, 'תפוח', false)],
  },
  {
    id: 99,
    name: 'בית מרקחת',
    emoji: '💊',
    items: [makeItem(31, 'אקמול', false)],
  },
]

function renderShoppingMode(
  categories: Category[],
  overrides: Partial<React.ComponentProps<typeof ShoppingMode>> = {}
) {
  const props = {
    categories,
    onToggleItem: vi.fn(),
    onExit: vi.fn(),
    ...overrides,
  }
  const utils = render(
    <SettingsProvider>
      <TabViewProvider>
        <ShoppingMode {...props} />
      </TabViewProvider>
    </SettingsProvider>
  )
  return { ...utils, props }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ShoppingMode - category grid', () => {
  it('renders a card per grocery category with the remaining count', () => {
    renderShoppingMode(baseCategories)

    expect(screen.getByText('ירקות')).toBeInTheDocument()
    expect(screen.getByText('פירות')).toBeInTheDocument()
    // ירקות and פירות each have 1 unpurchased item -> two "1" badges
    expect(screen.getAllByText('1')).toHaveLength(2)
  })

  it('excludes the pharmacy category while on the grocery tab', () => {
    renderShoppingMode(baseCategories)

    expect(screen.queryByText('בית מרקחת')).not.toBeInTheDocument()
    expect(screen.queryByText('אקמול')).not.toBeInTheDocument()
  })

  it('shows the total remaining count in the header', () => {
    // grocery remaining = ירקות(1) + פירות(1) = 2
    renderShoppingMode(baseCategories)
    expect(screen.getByText('נשארו 2 פריטים לקנייה')).toBeInTheDocument()
  })

  it('calls onExit when the close button is clicked', () => {
    const { props } = renderShoppingMode(baseCategories)
    fireEvent.click(screen.getByText('סיום'))
    expect(props.onExit).toHaveBeenCalledTimes(1)
  })

  it('shows the celebration banner when everything is purchased', () => {
    const allDone: Category[] = [
      { id: 1, name: 'ירקות', emoji: '🥬', items: [makeItem(11, 'מלפפון', true)] },
    ]
    renderShoppingMode(allDone)
    expect(screen.getByText('כל הכבוד, סיימת!')).toBeInTheDocument()
  })

  it('renders an empty state when there is nothing to shop', () => {
    renderShoppingMode([])
    expect(screen.getByText('אין פריטים לקנייה')).toBeInTheDocument()
  })
})

describe('ShoppingMode - category detail', () => {
  it('drilling into a category shows unpurchased items and hides purchased ones', () => {
    renderShoppingMode(baseCategories)

    fireEvent.click(screen.getByText('ירקות'))

    // Unpurchased item is visible
    expect(screen.getByText('מלפפון')).toBeInTheDocument()
    // Purchased item is hidden from the aisle view by default
    expect(screen.queryByText('עגבניה')).not.toBeInTheDocument()
  })

  it('checking an item calls onToggleItem with the category and item ids', () => {
    const { props } = renderShoppingMode(baseCategories)

    fireEvent.click(screen.getByText('ירקות'))
    fireEvent.click(screen.getByText('מלפפון'))

    expect(props.onToggleItem).toHaveBeenCalledWith(1, 11)
  })

  it('reveals already-bought items when the completed section is expanded', () => {
    renderShoppingMode(baseCategories)

    fireEvent.click(screen.getByText('ירקות'))
    // Toggle to reveal completed items
    fireEvent.click(screen.getByText('1 פריטים שכבר נקנו'))

    expect(screen.getByText('עגבניה')).toBeInTheDocument()
  })

  it('navigates back to the grid via the back button', () => {
    renderShoppingMode(baseCategories)

    fireEvent.click(screen.getByText('ירקות'))
    expect(screen.getByText('כל הקטגוריות')).toBeInTheDocument()

    fireEvent.click(screen.getByText('כל הקטגוריות'))
    // Back on the grid: both category cards visible again, no back button
    expect(screen.queryByText('כל הקטגוריות')).not.toBeInTheDocument()
    expect(screen.getByText('נשארו 2 פריטים לקנייה')).toBeInTheDocument()
  })
})

describe('ShoppingMode - single category (e.g. the pharmacy tab)', () => {
  // When only one category is relevant there's nothing to choose between, so
  // the grid is skipped and the aisle opens straight onto its items. The
  // grocery tab excludes the pharmacy category, so a lone grocery category
  // exercises the same single-category code path here.
  const singleCategory: Category[] = [
    { id: 1, name: 'ירקות', emoji: '🥬', items: [makeItem(11, 'מלפפון', false)] },
  ]

  it('opens the item list directly, skipping the lone-card grid', () => {
    renderShoppingMode(singleCategory)

    // The item is shown without first having to tap a category card
    expect(screen.getByText('מלפפון')).toBeInTheDocument()
  })

  it('hides the back-to-categories button when there is nowhere to go back to', () => {
    renderShoppingMode(singleCategory)

    expect(screen.queryByText('כל הקטגוריות')).not.toBeInTheDocument()
  })
})

describe('ShoppingMode - auto return on completion', () => {
  it('returns to the grid shortly after the last item in a category is checked', async () => {
    const { rerender } = renderShoppingMode(baseCategories)

    // Drill into פירות (single unpurchased item)
    fireEvent.click(screen.getByText('פירות'))
    expect(screen.getByText('כל הקטגוריות')).toBeInTheDocument()

    // Simulate the parent marking that item purchased
    const cleared: Category[] = baseCategories.map(c =>
      c.id === 2 ? { ...c, items: [makeItem(21, 'תפוח', true)] } : c
    )

    rerender(
      <SettingsProvider>
        <TabViewProvider>
          <ShoppingMode categories={cleared} onToggleItem={vi.fn()} onExit={vi.fn()} />
        </TabViewProvider>
      </SettingsProvider>
    )

    // Auto-returns to the grid after the short celebration delay
    await waitFor(
      () => expect(screen.queryByText('כל הקטגוריות')).not.toBeInTheDocument(),
      { timeout: 1500 }
    )
  })
})
