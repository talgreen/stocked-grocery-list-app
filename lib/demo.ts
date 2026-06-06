import { Category } from '../types/categories'
import { Item } from '../types/item'

const MS_PER_DAY = 1000 * 60 * 60 * 24

// Reserved list ids that open an ephemeral, pre-seeded sandbox instead of a
// real Firebase list. Anything you do here stays local and never persists, so
// it's safe to play with experimental features without touching real data.
const DEMO_LIST_IDS = new Set(['demo', 'sandbox', 'playground'])

export const DEMO_LIST_ID = 'demo'

export function isDemoList(listId: string | null | undefined): boolean {
  if (!listId) return false
  return DEMO_LIST_IDS.has(listId.trim().toLowerCase())
}

interface StapleSpec {
  id: number
  name: string
  comment?: string
  count: number
  gapDays: number
  lastAgoDays: number
  variance: number
}

function makeStaple(spec: StapleSpec, now: Date): Item {
  // Approximate the decayed count the EWMA tracker would have arrived at, so
  // staple scores in the seeded data look realistic rather than maxed out.
  const decayedCount = Math.min(spec.count, 6)

  return {
    id: spec.id,
    name: spec.name,
    purchased: true,
    comment: spec.comment ?? '',
    photo: null,
    lastPurchaseAt: new Date(now.getTime() - spec.lastAgoDays * MS_PER_DAY).toISOString(),
    expectedGapDays: spec.gapDays,
    gapVariance: spec.variance,
    decayedCount,
    purchaseCount: spec.count,
    snoozeUntil: null,
  }
}

function makeFresh(id: number, name: string, comment = ''): Item {
  return {
    id,
    name,
    purchased: false,
    comment,
    photo: null,
    lastPurchaseAt: null,
    expectedGapDays: null,
    gapVariance: null,
    decayedCount: 0,
    purchaseCount: 0,
    snoozeUntil: null,
  }
}

// A rich, realistic snapshot: a mix of items still to buy plus a deep purchase
// history so repeat suggestions, "most purchased" and the insights view all
// light up immediately. Timestamps are relative to `now` so the data never
// goes stale.
export function buildDemoCategories(now: Date = new Date()): Category[] {
  return [
    {
      id: 1,
      emoji: '🥬',
      name: 'ירקות',
      items: [
        makeFresh(101, 'גזר'),
        makeFresh(102, 'חסה', 'שלמה'),
        makeStaple({ id: 103, name: 'עגבניות', count: 9, gapDays: 5, lastAgoDays: 6, variance: 2 }, now),
        makeStaple({ id: 104, name: 'מלפפונים', count: 7, gapDays: 5, lastAgoDays: 3, variance: 3 }, now),
        makeStaple({ id: 105, name: 'בצל', count: 4, gapDays: 14, lastAgoDays: 16, variance: 9 }, now),
      ],
    },
    {
      id: 2,
      emoji: '🍎',
      name: 'פירות',
      items: [
        makeFresh(201, 'אבטיח'),
        makeStaple({ id: 202, name: 'בננות', count: 14, gapDays: 4, lastAgoDays: 5, variance: 1 }, now),
        makeStaple({ id: 203, name: 'תפוחים', count: 8, gapDays: 7, lastAgoDays: 4, variance: 4 }, now),
      ],
    },
    {
      id: 3,
      emoji: '🥛',
      name: 'מוצרי חלב',
      items: [
        makeStaple({ id: 301, name: 'חלב', count: 22, gapDays: 3, lastAgoDays: 4, variance: 1 }, now),
        makeStaple({ id: 302, name: 'ביצים', count: 16, gapDays: 7, lastAgoDays: 6, variance: 2 }, now),
        makeStaple({ id: 303, name: 'גבינה צהובה', count: 9, gapDays: 7, lastAgoDays: 9, variance: 5 }, now),
        makeStaple({ id: 304, name: 'יוגורט', count: 6, gapDays: 5, lastAgoDays: 2, variance: 4 }, now),
      ],
    },
    {
      id: 4,
      emoji: '🍞',
      name: 'מאפים',
      items: [
        makeFresh(401, 'פיתות'),
        makeStaple({ id: 402, name: 'לחם', count: 19, gapDays: 3, lastAgoDays: 4, variance: 1 }, now),
      ],
    },
    {
      id: 5,
      emoji: '🧼',
      name: 'ניקיון',
      items: [
        makeStaple({ id: 501, name: 'נייר טואלט', count: 5, gapDays: 30, lastAgoDays: 33, variance: 20 }, now),
        makeStaple({ id: 502, name: 'סבון כלים', count: 4, gapDays: 21, lastAgoDays: 10, variance: 12 }, now),
      ],
    },
    {
      id: 99,
      emoji: '💊',
      name: 'בית מרקחת',
      items: [
        makeFresh(901, 'ויטמין C'),
        makeStaple({ id: 902, name: 'אקמול', count: 3, gapDays: 60, lastAgoDays: 25, variance: 30 }, now),
      ],
    },
  ]
}
