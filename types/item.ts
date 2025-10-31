export type ItemInteractionType = 'purchase' | 'reset'

export interface ItemInteraction {
  type: ItemInteractionType
  at: string
}

export interface Item {
  id: number
  name: string
  purchased: boolean
  comment?: string
  photo?: string | null
  categoryId?: number
  popularityScore?: number
  popularityUpdatedAt?: string | null
  totalPurchases?: number
  lastPurchasedAt?: string | null
  interactionHistory?: ItemInteraction[]
}

