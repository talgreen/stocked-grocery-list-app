import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeRepeatSuggestions, updateItemPurchaseStats } from '../lib/repeat-suggester'
import type { Category } from '../types/categories'
import type { Item } from '../types/item'

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: overrides.id ?? Math.floor(Math.random() * 100000),
  name: overrides.name ?? 'פריט בדיקה',
  purchased: overrides.purchased ?? true,
  comment: overrides.comment,
  photo: overrides.photo ?? null,
  categoryId: overrides.categoryId,
  lastPurchaseAt: overrides.lastPurchaseAt ?? null,
  expectedGapDays: overrides.expectedGapDays ?? 7,
  gapVariance: overrides.gapVariance ?? 0,
  decayedCount: overrides.decayedCount ?? 0,
  purchaseCount: overrides.purchaseCount ?? 0,
  snoozeUntil: overrides.snoozeUntil ?? null,
})

describe('updateItemPurchaseStats', () => {
  it('ignores ultra-short double toggles within half a day', () => {
    const now = new Date('2024-05-01T12:00:00Z')
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

    const original = makeItem({
      id: 1,
      lastPurchaseAt: threeHoursAgo.toISOString(),
      expectedGapDays: 6,
      gapVariance: 2,
      decayedCount: 5,
      purchaseCount: 4,
      snoozeUntil: '2024-05-10T00:00:00Z',
    })

    const updated = updateItemPurchaseStats(original, now)

    assert.equal(updated.purchaseCount, original.purchaseCount)
    assert.equal(updated.lastPurchaseAt, original.lastPurchaseAt)
    assert.equal(updated.expectedGapDays, original.expectedGapDays)
    assert.equal(updated.decayedCount, original.decayedCount)
    assert.equal(updated.gapVariance, original.gapVariance)
    assert.equal(updated.snoozeUntil, null)
  })

  it('updates rolling averages after a real purchase', () => {
    const now = new Date('2024-05-20T12:00:00Z')
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

    const original = makeItem({
      id: 2,
      lastPurchaseAt: tenDaysAgo.toISOString(),
      expectedGapDays: 8,
      gapVariance: 4,
      decayedCount: 3,
      purchaseCount: 3,
    })

    const updated = updateItemPurchaseStats(original, now)

    assert.equal(updated.purchaseCount, (original.purchaseCount ?? 0) + 1)
    assert.equal(updated.purchased, true)
    assert.equal(updated.snoozeUntil, null)

    const expectedGap = original.expectedGapDays! + 0.2 * (10 - original.expectedGapDays!)
    assert.ok(Math.abs((updated.expectedGapDays ?? 0) - expectedGap) < 1e-6)

    const deviation = 10 - original.expectedGapDays!
    const expectedVariance = (1 - 0.2) * (original.gapVariance ?? 0) + 0.2 * deviation * deviation
    assert.ok(Math.abs((updated.gapVariance ?? 0) - expectedVariance) < 1e-6)

    const decayFactor = Math.exp(-10 / 90)
    const expectedDecayed = (original.decayedCount ?? 0) * decayFactor + 1
    assert.ok(Math.abs((updated.decayedCount ?? 0) - expectedDecayed) < 1e-6)
  })
})

describe('computeRepeatSuggestions', () => {
  const buildCategory = (items: Item[]): Category => ({
    id: 10,
    name: 'מדף מבחן',
    emoji: '🧪',
    items,
  })

  it('only returns items that are sufficiently due', () => {
    const now = new Date('2024-06-01T00:00:00Z')

    const dueItem = makeItem({
      id: 100,
      name: 'חלב',
      lastPurchaseAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      expectedGapDays: 7,
      decayedCount: 3,
      purchaseCount: 3,
    })

    const notDueYet = makeItem({
      id: 101,
      name: 'שוקולד',
      lastPurchaseAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expectedGapDays: 10,
      decayedCount: 3,
      purchaseCount: 3,
    })

    const suggestions = computeRepeatSuggestions([buildCategory([dueItem, notDueYet])], now)

    assert.equal(suggestions.length, 1)
    assert.equal(suggestions[0]?.item.id, dueItem.id)
    assert.ok(suggestions[0].dueScore >= 0.45)
  })

  it('filters out very stale items despite high due-ness', () => {
    const now = new Date('2024-06-01T00:00:00Z')

    const staleItem = makeItem({
      id: 102,
      name: 'מלח',
      lastPurchaseAt: new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(),
      expectedGapDays: 7,
      decayedCount: 4,
      purchaseCount: 4,
    })

    const suggestions = computeRepeatSuggestions([buildCategory([staleItem])], now)

    assert.equal(suggestions.length, 0)
  })
})
