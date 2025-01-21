export interface Item {
  id: number
  name: string
  purchased: boolean
  comment?: string
  photo?: string | null
  categoryId?: number
}

