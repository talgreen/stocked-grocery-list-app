import { Category } from '@/types/categories'
import { Item, ItemInteractionType } from '@/types/item'

const MILLISECONDS_IN_DAY = 86_400_000
const HALF_LIFE_DAYS = 14
const DECAY_RATE = Math.log(2) / (HALF_LIFE_DAYS * MILLISECONDS_IN_DAY)
const PURCHASE_WEIGHT = 1
const RESET_WEIGHT = -0.2
const HISTORY_LIMIT = 12

export interface StapleHeuristicOptions {
  thresholdScore?: number
  minPurchases?: number
  freshnessWindowDays?: number
  now?: number
}

export interface StapleCandidateOptions extends StapleHeuristicOptions {
  allowedCategoryIds?: Set<number>
}

export interface StapleCandidate {
  categoryId: number
  item: Item
  score: number
}

export const DEFAULT_STAPLE_OPTIONS: Required<Omit<StapleHeuristicOptions, 'now'>> = {
  thresholdScore: 1.5,
  minPurchases: 2,
  freshnessWindowDays: 45,
}

export function withDefaultMetrics(item: Item): Item {
  return {
    ...item,
    comment: item.comment ?? '',
    photo: item.photo ?? null,
    popularityScore: item.popularityScore ?? 0,
    popularityUpdatedAt: item.popularityUpdatedAt ?? null,
    totalPurchases: item.totalPurchases ?? 0,
    lastPurchasedAt: item.lastPurchasedAt ?? null,
    interactionHistory: item.interactionHistory ?? [],
  }
}

export function getDecayedPopularityScore(item: Item, now: number = Date.now()): number {
  const baseItem = withDefaultMetrics(item)
  const updatedAt = baseItem.popularityUpdatedAt
    ? new Date(baseItem.popularityUpdatedAt).getTime()
    : null

  if (!updatedAt) {
    return baseItem.popularityScore ?? 0
  }

  const deltaMs = Math.max(now - updatedAt, 0)
  const decayed = (baseItem.popularityScore ?? 0) * Math.exp(-DECAY_RATE * deltaMs)
  return Number.isFinite(decayed) ? decayed : 0
}

export function applyInteraction(
  item: Item,
  type: ItemInteractionType,
  timestamp: number = Date.now()
): Item {
  const baseItem = withDefaultMetrics(item)
  const baseScore = getDecayedPopularityScore(baseItem, timestamp)
  const weight = type === 'purchase' ? PURCHASE_WEIGHT : RESET_WEIGHT
  const nextScore = Math.max(baseScore + weight, 0)
  const nextHistory = [...baseItem.interactionHistory!, {
    type,
    at: new Date(timestamp).toISOString(),
  }]

  return {
    ...baseItem,
    popularityScore: nextScore,
    popularityUpdatedAt: new Date(timestamp).toISOString(),
    totalPurchases: type === 'purchase'
      ? (baseItem.totalPurchases ?? 0) + 1
      : baseItem.totalPurchases ?? 0,
    lastPurchasedAt: type === 'purchase'
      ? new Date(timestamp).toISOString()
      : baseItem.lastPurchasedAt ?? null,
    interactionHistory: nextHistory.slice(-HISTORY_LIMIT),
  }
}

export function isStaple(
  item: Item,
  options: StapleHeuristicOptions = {}
): boolean {
  const {
    thresholdScore,
    minPurchases,
    freshnessWindowDays,
    now = Date.now(),
  } = { ...DEFAULT_STAPLE_OPTIONS, ...options }

  const baseItem = withDefaultMetrics(item)
  const currentScore = getDecayedPopularityScore(baseItem, now)
  if (currentScore < thresholdScore) {
    return false
  }

  if ((baseItem.totalPurchases ?? 0) < minPurchases) {
    return false
  }

  if (!baseItem.lastPurchasedAt) {
    return false
  }

  const lastPurchased = new Date(baseItem.lastPurchasedAt).getTime()
  if (Number.isNaN(lastPurchased)) {
    return false
  }

  const windowMs = freshnessWindowDays * MILLISECONDS_IN_DAY
  if (now - lastPurchased > windowMs) {
    return false
  }

  return true
}

export function findStapleCandidates(
  categories: Category[],
  options: StapleCandidateOptions = {}
): StapleCandidate[] {
  const { allowedCategoryIds, ...rest } = options
  const now = rest.now ?? Date.now()
  const result: StapleCandidate[] = []

  for (const category of categories) {
    if (allowedCategoryIds && !allowedCategoryIds.has(category.id)) {
      continue
    }

    for (const item of category.items) {
      if (!item.purchased) {
        continue
      }

      if (!isStaple(item, { ...rest, now })) {
        continue
      }

      result.push({
        categoryId: category.id,
        item,
        score: getDecayedPopularityScore(item, now),
      })
    }
  }

  return result.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.item.name.localeCompare(b.item.name, 'he')
  })
}
