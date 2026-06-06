import { describe, it, expect } from 'vitest'
import { computeInsights } from '@/lib/insights'
import { Category } from '@/types/categories'
import { Item } from '@/types/item'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const NOW = new Date('2026-06-06T12:00:00.000Z')

function tracked(
  id: number,
  name: string,
  opts: { count: number; gapDays?: number; lastAgoDays?: number; variance?: number }
): Item {
  return {
    id,
    name,
    purchased: true,
    comment: '',
    photo: null,
    lastPurchaseAt:
      opts.lastAgoDays !== undefined
        ? new Date(NOW.getTime() - opts.lastAgoDays * MS_PER_DAY).toISOString()
        : null,
    expectedGapDays: opts.gapDays ?? null,
    gapVariance: opts.variance ?? null,
    decayedCount: Math.min(opts.count, 6),
    purchaseCount: opts.count,
    snoozeUntil: null,
  }
}

function fresh(id: number, name: string): Item {
  return {
    id,
    name,
    purchased: false,
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

const categories: Category[] = [
  {
    id: 1,
    name: 'מוצרי חלב',
    emoji: '🥛',
    items: [
      tracked(11, 'חלב', { count: 20, gapDays: 3, lastAgoDays: 4, variance: 1 }),
      tracked(12, 'ביצים', { count: 10, gapDays: 7, lastAgoDays: 6, variance: 2 }),
      fresh(13, 'גבינה'),
    ],
  },
  {
    id: 2,
    name: 'ירקות',
    emoji: '🥬',
    items: [
      tracked(21, 'עגבניה', { count: 5, gapDays: 5, lastAgoDays: 6, variance: 8 }),
      tracked(22, 'בצל', { count: 1, gapDays: 14, lastAgoDays: 2, variance: 1 }),
    ],
  },
]

describe('computeInsights', () => {
  it('sums total purchases and counts only tracked items', () => {
    const insights = computeInsights(categories, NOW)
    // 20 + 10 + 5 + 1
    expect(insights.totalPurchases).toBe(36)
    // four items have purchaseCount > 0; the fresh "גבינה" is excluded
    expect(insights.trackedItems).toBe(4)
    // staples = purchaseCount >= 3 → חלב, ביצים, עגבניה
    expect(insights.activeStaples).toBe(3)
  })

  it('ranks top items by purchase count', () => {
    const insights = computeInsights(categories, NOW)
    expect(insights.topItems.map(i => i.name)).toEqual(['חלב', 'ביצים', 'עגבניה', 'בצל'])
    expect(insights.topItems[0].purchaseCount).toBe(20)
  })

  it('aggregates purchases per category, sorted descending', () => {
    const insights = computeInsights(categories, NOW)
    expect(insights.categoryBreakdown.map(c => [c.name, c.purchaseCount])).toEqual([
      ['מוצרי חלב', 30],
      ['ירקות', 6],
    ])
  })

  it('orders most-regular staples by lowest variance and excludes thin history', () => {
    const insights = computeInsights(categories, NOW)
    // בצל has count 1 (< 3) so it is excluded despite low variance.
    // Of the staples, ordering by variance asc: חלב(1), ביצים(2), עגבניה(8)
    expect(insights.mostRegular.map(i => i.name)).toEqual(['חלב', 'ביצים', 'עגבניה'])
  })

  it('returns an empty overview when there is no purchase history', () => {
    const empty: Category[] = [{ id: 1, name: 'ירקות', emoji: '🥬', items: [fresh(1, 'גזר')] }]
    const insights = computeInsights(empty, NOW)
    expect(insights.totalPurchases).toBe(0)
    expect(insights.trackedItems).toBe(0)
    expect(insights.topItems).toEqual([])
    expect(insights.categoryBreakdown).toEqual([])
    expect(insights.mostRegular).toEqual([])
  })
})
