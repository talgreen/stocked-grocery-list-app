import { Category } from '../types/categories'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const MIN_PURCHASES_FOR_REGULARITY = 3
const TOP_ITEMS_LIMIT = 8
const REGULAR_ITEMS_LIMIT = 5

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export interface ItemInsight {
  name: string
  categoryId: number
  categoryName: string
  categoryEmoji: string
  purchaseCount: number
  expectedGapDays: number | null
  daysSinceLastPurchase: number | null
}

export interface CategoryInsight {
  categoryId: number
  name: string
  emoji: string
  purchaseCount: number
  itemCount: number
}

export interface ShoppingInsights {
  totalPurchases: number
  trackedItems: number
  activeStaples: number
  topItems: ItemInsight[]
  categoryBreakdown: CategoryInsight[]
  mostRegular: ItemInsight[]
}

// Derives a read-only overview of shopping habits from the purchase stats the
// EWMA tracker already records on each item. Pure and side-effect free so it
// can be memoized in the UI and unit tested in isolation.
export function computeInsights(
  categories: Category[],
  now: Date = new Date()
): ShoppingInsights {
  const allItems: ItemInsight[] = []
  const categoryBreakdown: CategoryInsight[] = []
  let totalPurchases = 0
  let trackedItems = 0
  let activeStaples = 0

  categories.forEach(category => {
    let categoryPurchases = 0
    let categoryItemCount = 0

    category.items.forEach(item => {
      const purchaseCount = isFiniteNumber(item.purchaseCount) ? item.purchaseCount : 0
      if (purchaseCount <= 0) return

      totalPurchases += purchaseCount
      trackedItems += 1
      categoryPurchases += purchaseCount
      categoryItemCount += 1
      if (purchaseCount >= MIN_PURCHASES_FOR_REGULARITY) activeStaples += 1

      const lastPurchaseAt = item.lastPurchaseAt ? new Date(item.lastPurchaseAt) : null
      const daysSinceLastPurchase =
        lastPurchaseAt && Number.isFinite(lastPurchaseAt.getTime())
          ? Math.max((now.getTime() - lastPurchaseAt.getTime()) / MS_PER_DAY, 0)
          : null

      allItems.push({
        name: item.name,
        categoryId: category.id,
        categoryName: category.name,
        categoryEmoji: category.emoji,
        purchaseCount,
        expectedGapDays: isFiniteNumber(item.expectedGapDays) ? item.expectedGapDays : null,
        daysSinceLastPurchase,
      })
    })

    if (categoryPurchases > 0) {
      categoryBreakdown.push({
        categoryId: category.id,
        name: category.name,
        emoji: category.emoji,
        purchaseCount: categoryPurchases,
        itemCount: categoryItemCount,
      })
    }
  })

  const topItems = [...allItems]
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, TOP_ITEMS_LIMIT)

  categoryBreakdown.sort((a, b) => b.purchaseCount - a.purchaseCount)

  // "Most regular" = the staples we buy on the steadiest rhythm. Rank by the
  // lowest gap variance among items with enough history and a known cadence.
  const mostRegular = allItems
    .filter(
      item =>
        item.purchaseCount >= MIN_PURCHASES_FOR_REGULARITY &&
        item.expectedGapDays !== null
    )
    .map(item => {
      const source = categories
        .find(c => c.id === item.categoryId)
        ?.items.find(i => i.name === item.name)
      const variance = isFiniteNumber(source?.gapVariance) ? source!.gapVariance! : Infinity
      return { item, variance }
    })
    .filter(entry => Number.isFinite(entry.variance))
    .sort((a, b) => a.variance - b.variance)
    .slice(0, REGULAR_ITEMS_LIMIT)
    .map(entry => entry.item)

  return {
    totalPurchases,
    trackedItems,
    activeStaples,
    topItems,
    categoryBreakdown,
    mostRegular,
  }
}

export const INSIGHTS_CONSTANTS = {
  MIN_PURCHASES_FOR_REGULARITY,
  TOP_ITEMS_LIMIT,
  REGULAR_ITEMS_LIMIT,
}
