export interface Item {
  id: number
  name: string
  purchased: boolean
  comment?: string
  photo?: string | null
  categoryId?: number
  lastPurchaseAt?: string | null
  expectedGapDays?: number | null
  gapVariance?: number | null
  decayedCount?: number
  purchaseCount?: number
  snoozeUntil?: string | null
  neverSuggest?: boolean
}

