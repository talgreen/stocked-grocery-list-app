export interface RecipeIngredient {
  id: number
  name: string
  comment?: string
  addedToList?: boolean
}

export interface Recipe {
  id: number
  name: string
  ingredients: RecipeIngredient[]
  createdAt: string
}
