import { Category } from '@/types/categories'
import { Item } from '@/types/item'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const EWMA_BETA = 0.2
const DEFAULT_EXPECTED_GAP_DAYS = 7
const MIN_SCORE_THRESHOLD = 0.25
const MIN_REAL_PURCHASE_GAP_DAYS = 0.5
const MIN_DUE_SCORE_TO_SUGGEST = 0.45

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value))

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const sanitizeGap = (value: number | null | undefined) =>
  isFiniteNumber(value) && value > 0 ? value : DEFAULT_EXPECTED_GAP_DAYS

export interface RepeatSuggestion {
  item: Item
  categoryId: number
  categoryName: string
  categoryEmoji: string
  score: number
  expectedGapDays: number
  daysSinceLastPurchase: number
  dueScore: number
  stapleScore: number
  regularityScore: number
}

export function updateItemPurchaseStats(item: Item, now: Date = new Date()): Item {
  const lastPurchaseAt = item.lastPurchaseAt ? new Date(item.lastPurchaseAt) : null
  const previousExpectedGap = sanitizeGap(item.expectedGapDays)
  const previousVariance = isFiniteNumber(item.gapVariance) ? item.gapVariance : 0
  const previousDecayed = isFiniteNumber(item.decayedCount) ? item.decayedCount : 0
  const previousPurchaseCount = isFiniteNumber(item.purchaseCount) ? item.purchaseCount : 0

  let updatedExpectedGap = previousExpectedGap
  let updatedVariance = previousVariance
  let updatedDecayedCount = previousDecayed

  if (lastPurchaseAt) {
    const deltaMs = now.getTime() - lastPurchaseAt.getTime()
    const deltaDays = Math.max(deltaMs / MS_PER_DAY, 0)

    if (deltaDays < MIN_REAL_PURCHASE_GAP_DAYS) {
      return {
        ...item,
        purchased: true,
        lastPurchaseAt: item.lastPurchaseAt,
        expectedGapDays: previousExpectedGap,
        gapVariance: previousVariance,
        decayedCount: previousDecayed,
        purchaseCount: previousPurchaseCount,
        snoozeUntil: null,
      }
    }

    updatedExpectedGap = previousExpectedGap + EWMA_BETA * (deltaDays - previousExpectedGap)

    const deviation = deltaDays - previousExpectedGap
    updatedVariance = (1 - EWMA_BETA) * previousVariance + EWMA_BETA * deviation * deviation

    const decayFactor = Math.exp(-deltaDays / 90)
    updatedDecayedCount = previousDecayed * decayFactor + 1
  } else {
    // First recorded purchase, bootstrap stats with defaults
    updatedExpectedGap = previousExpectedGap
    updatedVariance = previousVariance
    updatedDecayedCount = previousDecayed + 1
  }

  updatedExpectedGap = Math.max(updatedExpectedGap, 1)
  updatedVariance = Math.max(updatedVariance, 0)

  return {
    ...item,
    purchased: true,
    lastPurchaseAt: now.toISOString(),
    expectedGapDays: updatedExpectedGap,
    gapVariance: updatedVariance,
    decayedCount: updatedDecayedCount,
    purchaseCount: previousPurchaseCount + 1,
    snoozeUntil: null,
  }
}

export function computeRepeatSuggestions(
  categories: Category[],
  now: Date = new Date()
): RepeatSuggestion[] {
  const suggestions: RepeatSuggestion[] = []

  categories.forEach(category => {
    category.items.forEach(item => {
      if (!item.purchased) return

      const purchaseCount = item.purchaseCount ?? 0
      if (purchaseCount < 2) return

      if (!item.lastPurchaseAt) return

      if (item.snoozeUntil) {
        const snoozeUntil = new Date(item.snoozeUntil)
        if (snoozeUntil.getTime() > now.getTime()) {
          return
        }
      }

      const lastPurchaseAt = new Date(item.lastPurchaseAt)
      const deltaMs = now.getTime() - lastPurchaseAt.getTime()
      if (deltaMs < 0) return

      const daysSinceLastPurchase = deltaMs / MS_PER_DAY
      const expectedGapDays = sanitizeGap(item.expectedGapDays)
      const gapVariance = isFiniteNumber(item.gapVariance) ? item.gapVariance : 0
      const decayedCount = Math.max(item.decayedCount ?? 0, 0)

      const denom = Math.max(expectedGapDays * 0.3, 1)
      const dueScore = sigmoid((daysSinceLastPurchase - expectedGapDays) / denom)
      const stapleScore = 1 - Math.exp(-0.7 * decayedCount)
      const regularity = clamp(1 - Math.sqrt(gapVariance) / (2 * DEFAULT_EXPECTED_GAP_DAYS), 0, 1)

      let finalScore = 0.6 * dueScore + 0.35 * stapleScore + 0.05 * regularity

      if (daysSinceLastPurchase > expectedGapDays * 6) {
        finalScore *= 0.1
      }

      if (dueScore < MIN_DUE_SCORE_TO_SUGGEST) {
        return
      }

      finalScore = clamp(finalScore, 0, 1)

      if (finalScore < MIN_SCORE_THRESHOLD) {
        return
      }

      suggestions.push({
        item,
        categoryId: category.id,
        categoryName: category.name,
        categoryEmoji: category.emoji,
        score: finalScore,
        expectedGapDays,
        daysSinceLastPurchase,
        dueScore,
        stapleScore,
        regularityScore: regularity,
      })
    })
  })

  suggestions.sort((a, b) => b.score - a.score)

  return suggestions.slice(0, 15)
}

export const REPEAT_SUGGESTER_CONSTANTS = {
  DEFAULT_EXPECTED_GAP_DAYS,
  MIN_SCORE_THRESHOLD,
}
