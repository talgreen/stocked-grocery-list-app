import { describe, it, expect } from 'vitest'
import { buildDemoCategories, isDemoList, DEMO_LIST_ID } from '@/lib/demo'
import { computeInsights } from '@/lib/insights'
import { computeRepeatSuggestions } from '@/lib/repeat-suggester'

describe('isDemoList', () => {
  it('recognises the reserved sandbox ids (case-insensitive)', () => {
    expect(isDemoList('demo')).toBe(true)
    expect(isDemoList('DEMO')).toBe(true)
    expect(isDemoList(' sandbox ')).toBe(true)
    expect(isDemoList('playground')).toBe(true)
    expect(isDemoList(DEMO_LIST_ID)).toBe(true)
  })

  it('treats real list ids and empty values as non-demo', () => {
    expect(isDemoList('a1b2c3-real-uuid')).toBe(false)
    expect(isDemoList('')).toBe(false)
    expect(isDemoList(null)).toBe(false)
    expect(isDemoList(undefined)).toBe(false)
  })
})

describe('buildDemoCategories', () => {
  it('seeds both items still to buy and a deep purchase history', () => {
    const categories = buildDemoCategories()
    const allItems = categories.flatMap(c => c.items)

    expect(allItems.some(i => !i.purchased)).toBe(true)
    expect(allItems.some(i => (i.purchaseCount ?? 0) >= 3 && i.lastPurchaseAt)).toBe(true)
  })

  it('produces data rich enough for repeat suggestions and insights', () => {
    const categories = buildDemoCategories()

    expect(computeRepeatSuggestions(categories).length).toBeGreaterThan(0)

    const insights = computeInsights(categories)
    expect(insights.totalPurchases).toBeGreaterThan(0)
    expect(insights.topItems.length).toBeGreaterThan(0)
    expect(insights.mostRegular.length).toBeGreaterThan(0)
  })
})
