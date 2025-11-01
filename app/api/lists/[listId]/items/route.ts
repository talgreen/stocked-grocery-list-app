import { NextResponse } from 'next/server'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Category, initialCategories } from '@/types/categories'
import { Item } from '@/types/item'
import { categorizeItem } from '@/lib/server/categorize'

type Mode = 'grocery' | 'pharmacy'

type IncomingItem = {
  name: string
  comment?: string
  category?: string
  emoji?: string
}

type ProcessedResult = {
  name: string
  comment: string
  status: 'added' | 'unchecked' | 'skipped'
  category: {
    name: string
    emoji: string
  } | null
  reason?: string
}

const PHARMACY_CATEGORY = {
  name: 'בית מרקחת',
  emoji: '💊'
}

function cloneCategories(categories: Category[]): Category[] {
  return JSON.parse(JSON.stringify(categories)) as Category[]
}

function sanitizeItem(item: Item): Item {
  return {
    id: item.id,
    name: item.name,
    purchased: Boolean(item.purchased),
    comment: (item.comment ?? '').trim(),
    photo: item.photo ?? null,
    categoryId: item.categoryId,
    lastPurchaseAt: item.lastPurchaseAt ?? null,
    expectedGapDays:
      typeof item.expectedGapDays === 'number' && Number.isFinite(item.expectedGapDays)
        ? item.expectedGapDays
        : null,
    gapVariance:
      typeof item.gapVariance === 'number' && Number.isFinite(item.gapVariance)
        ? item.gapVariance
        : null,
    decayedCount:
      typeof item.decayedCount === 'number' && Number.isFinite(item.decayedCount)
        ? item.decayedCount
        : 0,
    purchaseCount:
      typeof item.purchaseCount === 'number' && Number.isFinite(item.purchaseCount)
        ? item.purchaseCount
        : 0,
    snoozeUntil: item.snoozeUntil ?? null
  }
}

function sanitizeCategories(categories: Category[]) {
  return categories.map(category => ({
    id: category.id,
    emoji: category.emoji,
    name: category.name,
    items: category.items.map(sanitizeItem)
  }))
}

function normalizeIncomingItems(body: unknown): { items: IncomingItem[]; mode: Mode } {
  const data = (typeof body === 'object' && body !== null) ? body as Record<string, unknown> : {}

  const mode: Mode = data.mode === 'pharmacy' ? 'pharmacy' : 'grocery'

  const items: IncomingItem[] = []

  const rawItems = Array.isArray(data.items) ? data.items : []
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue
    const rawRecord = raw as Record<string, unknown>
    if (typeof rawRecord.name !== 'string') continue

    items.push({
      name: rawRecord.name,
      comment: typeof rawRecord.comment === 'string' ? rawRecord.comment : undefined,
      category: typeof rawRecord.category === 'string' ? rawRecord.category : undefined,
      emoji: typeof rawRecord.emoji === 'string' ? rawRecord.emoji : undefined
    })
  }

  if (typeof data.item === 'string') {
    items.push({
      name: data.item,
      comment: typeof data.comment === 'string' ? data.comment : undefined,
      category: typeof data.category === 'string' ? data.category : undefined,
      emoji: typeof data.emoji === 'string' ? data.emoji : undefined
    })
  }

  if (!items.length) {
    throw new Error('No valid items provided')
  }

  return { items, mode }
}

function sortItemsByPurchased(items: Item[]) {
  return [...items].sort((a, b) => (a.purchased === b.purchased ? 0 : a.purchased ? 1 : -1))
}

function findExistingItem(categories: Category[], name: string, comment: string) {
  const targetName = name.trim().toLowerCase()
  const targetComment = comment.trim().toLowerCase()

  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const category = categories[catIndex]
    for (let itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
      const item = category.items[itemIndex]
      if (
        item.name.trim().toLowerCase() === targetName &&
        (item.comment ?? '').trim().toLowerCase() === targetComment
      ) {
        return { catIndex, itemIndex }
      }
    }
  }

  return null
}

function ensureCategory(
  categories: Category[],
  name: string,
  emoji: string
): { categories: Category[]; categoryId: number } {
  const existing = categories.find(
    category => category.name.trim().toLowerCase() === name.trim().toLowerCase()
  )
  if (existing) {
    return { categories, categoryId: existing.id }
  }

  const maxId = categories.reduce((max, category) => Math.max(max, category.id), 0)
  const newCategory: Category = {
    id: maxId + 1,
    name,
    emoji,
    items: []
  }

  return { categories: [...categories, newCategory], categoryId: newCategory.id }
}

export async function POST(request: Request, { params }: { params: { listId: string } }) {
  try {
    const listId = params?.listId || 'default'
    const body = await request.json()
    const { items: incomingItems, mode } = normalizeIncomingItems(body)

    const listRef = doc(db, 'lists', listId)
    const snapshot = await getDoc(listRef)

    const existingCategories: Category[] = snapshot.exists()
      ? ((snapshot.data()?.categories as Category[]) ?? [])
      : cloneCategories(initialCategories)

    let categories = cloneCategories(existingCategories.length ? existingCategories : initialCategories)

    const results: ProcessedResult[] = []
    let hasChanges = false

    for (const [index, incoming] of incomingItems.entries()) {
      const name = incoming.name.trim()
      const comment = (incoming.comment ?? '').trim()

      if (!name) {
        results.push({
          name: incoming.name,
          comment,
          status: 'skipped',
          category: null,
          reason: 'Empty item name after trimming'
        })
        continue
      }

      const existing = findExistingItem(categories, name, comment)

      if (existing) {
        const { catIndex, itemIndex } = existing
        const item = categories[catIndex].items[itemIndex]

        if (item.purchased || item.snoozeUntil) {
          categories[catIndex].items[itemIndex] = {
            ...item,
            purchased: false,
            snoozeUntil: null
          }
          hasChanges = true
        }

        categories[catIndex].items = sortItemsByPurchased(categories[catIndex].items)

        results.push({
          name,
          comment,
          status: 'unchecked',
          category: {
            name: categories[catIndex].name,
            emoji: categories[catIndex].emoji
          }
        })
        continue
      }

      let categoryName: string
      let categoryEmoji: string

      if (mode === 'pharmacy') {
        categoryName = PHARMACY_CATEGORY.name
        categoryEmoji = PHARMACY_CATEGORY.emoji
      } else if (incoming.category && incoming.emoji) {
        categoryName = incoming.category
        categoryEmoji = incoming.emoji
      } else if (incoming.category && !incoming.emoji) {
        categoryName = incoming.category
        const existingCategory = categories.find(
          category => category.name.trim().toLowerCase() === incoming.category.trim().toLowerCase()
        )
        categoryEmoji = existingCategory?.emoji ?? '📦'
      } else {
        try {
          const categorized = await categorizeItem(comment ? `${name} - ${comment}` : name)
          categoryName = categorized.category
          categoryEmoji = categorized.emoji
        } catch (error) {
          results.push({
            name,
            comment,
            status: 'skipped',
            category: null,
            reason: error instanceof Error ? error.message : 'Categorization failed'
          })
          continue
        }
      }

      const ensured = ensureCategory(categories, categoryName, categoryEmoji)
      categories = ensured.categories
      const categoryIndex = categories.findIndex(category => category.id === ensured.categoryId)
      const targetCategory = categories[categoryIndex]

      const newItem: Item = {
        id: Date.now() + index,
        name,
        comment,
        purchased: false,
        categoryId: targetCategory.id,
        photo: null,
        lastPurchaseAt: null,
        expectedGapDays: null,
        gapVariance: null,
        decayedCount: 0,
        purchaseCount: 0,
        snoozeUntil: null
      }

      const updatedItems = sortItemsByPurchased([...targetCategory.items, newItem])
      categories[categoryIndex] = {
        ...targetCategory,
        emoji: categoryEmoji,
        name: categoryName,
        items: updatedItems
      }

      hasChanges = true

      results.push({
        name,
        comment,
        status: 'added',
        category: {
          name: categoryName,
          emoji: categoryEmoji
        }
      })
    }

    if (hasChanges) {
      const sanitized = sanitizeCategories(categories)
      const timestamp = new Date().toISOString()

      if (snapshot.exists()) {
        await setDoc(
          listRef,
          {
            categories: sanitized,
            updatedAt: timestamp
          },
          { merge: true }
        )
      } else {
        await setDoc(listRef, {
          categories: sanitized,
          createdAt: timestamp,
          updatedAt: timestamp
        })
      }
    }

    return NextResponse.json({
      listId,
      mode,
      updated: hasChanges,
      results
    })
  } catch (error) {
    console.error('Add items API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'No valid items provided' ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
