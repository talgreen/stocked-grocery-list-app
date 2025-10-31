export interface Item {
  id: number
  name: string
  purchased: boolean
  comment?: string
  photo?: string | null
  categoryId?: number
  quantity?: number | null
  unit?: string | null
  price?: number | null
}

