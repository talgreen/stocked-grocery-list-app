import { Category } from './categories'

// A purpose-based list (e.g. an event, occasion, or travel packing) that lives
// alongside the grocery/pharmacy categories inside the same shared list document.
export interface PurposeList {
  id: string
  name: string
  emoji: string
  categories: Category[]
  createdAt: string
}
