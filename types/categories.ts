import { Item } from './item'

export interface Category {
  id: number
  emoji: string
  name: string
  items: Item[]
}

export const initialCategories: Category[] = [
  {
    id: 1,
    emoji: '🥬',
    name: 'ירקות',
    items: []
  },
  {
    id: 2,
    emoji: '🍎',
    name: 'פירות',
    items: [
      // { id: 11, name: 'תפוחים', purchased: false, comment: '4-5 יחידות' },
      // { id: 12, name: 'בננות', purchased: false },
      // { id: 13, name: 'תפוזים', purchased: false, comment: 'רשת אדומה' },
      // { id: 14, name: 'אבוקדו', purchased: false },
      // { id: 15, name: 'לימון', purchased: false },
      // { id: 16, name: 'ענבים', purchased: false, comment: 'ירוקים/אדומים' },
    ]
  },
  {
    id: 3,
    emoji: '🥛',
    name: 'מוצרי חלב',
    items: [
      // { id: 17, name: 'חלב', purchased: false, comment: '3% שומן' },
      // { id: 18, name: 'גבינה צהובה', purchased: false },
      // { id: 19, name: 'קוטג׳', purchased: false, comment: '5%, 2 גביעים' },
      // { id: 20, name: 'יוגורט', purchased: false },
      // { id: 21, name: 'שמנת חמוצה', purchased: false },
      // { id: 22, name: 'גבינה בולגרית', purchased: false, comment: '5%, קובייה' },
      // { id: 23, name: 'חמאה', purchased: false },
      // { id: 24, name: 'גבינת שמנת', purchased: false },
    ]
  },
  {
    id: 4,
    emoji: '🥚',
    name: 'ביצים',
    items: [
      // { id: 25, name: 'ביצים', purchased: false, comment: 'תבנית L' },
      // { id: 26, name: 'חזה עוף', purchased: false, comment: 'טרי, 1 ק״ג' },
      // { id: 27, name: 'סלמון', purchased: false },
      // { id: 28, name: 'טונה', purchased: false, comment: '4 קופסאות' },
      // { id: 29, name: 'שניצל מהצומח', purchased: false },
    ]
  },
  {
    id: 5,
    emoji: '🥫',
    name: 'שימורים',
    items: [
      // { id: 30, name: 'תירס', purchased: false },
      // { id: 31, name: 'טונה', purchased: false, comment: '4 קופסאות' },
      // { id: 32, name: 'זיתים', purchased: false },
      // { id: 33, name: 'אפונה', purchased: false },
      // { id: 34, name: 'רסק עגבניות', purchased: false },
      // { id: 35, name: 'חומוס', purchased: false },
    ]
  },
  {
    id: 6,
    emoji: '🫙',
    name: 'ממרחים ורטבים',
    items: [
      // { id: 36, name: 'טחינה גולמית', purchased: false },
      // { id: 37, name: 'חמאת בוטנים', purchased: false },
      // { id: 38, name: 'קטשופ', purchased: false },
      // { id: 39, name: 'מיונז', purchased: false },
      // { id: 40, name: 'חרדל', purchased: false },
      // { id: 41, name: 'סויה', purchased: false },
    ]
  },
  {
    id: 7,
    emoji: '🥖',
    name: 'מאפים',
    items: [
      // { id: 42, name: 'לחם', purchased: false, comment: 'כפרי מחיטה מלאה' },
      // { id: 43, name: 'פיתות', purchased: false },
      // { id: 44, name: 'לחמניות', purchased: false, comment: '6 יחידות' },
      // { id: 45, name: 'חלה', purchased: false },
      // { id: 46, name: 'בייגלה', purchased: false },
      // { id: 47, name: 'פיתות מקמח מלא', purchased: false },
    ]
  },
  {
    id: 8,
    emoji: '🧂',
    name: 'תבלינים',
    items: [
      // { id: 48, name: 'מלח', purchased: false },
      // { id: 49, name: 'פלפל שחור', purchased: false },
      // { id: 50, name: 'פפריקה', purchased: false },
      // { id: 51, name: 'כמון', purchased: false },
      // { id: 52, name: 'כורכום', purchased: false },
    ]
  },
  {
    id: 9,
    emoji: '🍝',
    name: 'מזווה',
    items: [
      // { id: 53, name: 'אורז', purchased: false },
      // { id: 54, name: 'פסטה', purchased: false },
      // { id: 55, name: 'קמח', purchased: false },
      // { id: 56, name: 'סוכר', purchased: false },
      // { id: 57, name: 'שמן', purchased: false },
      // { id: 58, name: 'דגני בוקר', purchased: false },
    ]
  },
  {
    id: 10,
    emoji: '🧃',
    name: 'משקאות',
    items: [
      // { id: 59, name: 'מים מינרלים', purchased: false, comment: '2 שישיות' },
      // { id: 60, name: 'סודה', purchased: false },
      // { id: 61, name: 'מיץ תפוזים', purchased: false, comment: 'טרי' },
      // { id: 62, name: 'קולה', purchased: false, comment: '6 פחיות' },
      // { id: 63, name: 'בירה', purchased: false },
      // { id: 64, name: 'יין', purchased: false, comment: 'אדום יבש' },
    ]
  },
  {
    id: 11,
    emoji: '🍪',
    name: 'חטיפים ומתוקים',
    items: [
      // { id: 65, name: 'במבה', purchased: false },
      // { id: 66, name: 'ביסלי', purchased: false },
      // { id: 67, name: 'שוקולד', purchased: false },
      // { id: 68, name: 'עוגיות', purchased: false },
      // { id: 69, name: 'חטיף אנרגיה', purchased: false },
      // { id: 70, name: 'מסטיק', purchased: false },
    ]
  },
  {
    id: 12,
    emoji: '🧊',
    name: 'קפואים',
    items: [
      // { id: 71, name: 'אפונה', purchased: false },
      // { id: 72, name: 'שעועית ירוקה', purchased: false },
      // { id: 73, name: 'פיצה', purchased: false, comment: 'משפחתית' },
      // { id: 74, name: 'גלידה', purchased: false },
      // { id: 75, name: 'פטריות', purchased: false },
    ]
  },
  {
    id: 13,
    emoji: '🥩',
    name: 'בשר ודגים',
    items: [
      // { id: 76, name: 'חזה עוף', purchased: false, comment: 'טרי, 1 ק״ג' },
      // { id: 77, name: 'פרגיות', purchased: false },
      // { id: 78, name: 'סלמון', purchased: false, comment: 'טרי' },
      // { id: 79, name: 'בשר טחון', purchased: false, comment: '500 גרם' },
      // { id: 80, name: 'נקניקיות', purchased: false },
      // { id: 81, name: 'דג אמנון', purchased: false },
    ]
  },
  {
    id: 14,
    emoji: '🧹',
    name: 'מוצרי ניקיון',
    items: [
      // { id: 82, name: 'נוזל כלים', purchased: false },
      // { id: 83, name: 'אקונומיקה', purchased: false },
      // { id: 84, name: 'נייר טואלט', purchased: false, comment: 'חבילה של 32' },
      // { id: 85, name: 'מגבונים', purchased: false },
      // { id: 86, name: 'שקיות אשפה', purchased: false },
      // { id: 87, name: 'סבון כביסה', purchased: false },
      // { id: 88, name: 'מרכך כביסה', purchased: false },
      // { id: 89, name: 'נוזל רצפות', purchased: false },
    ]
  },
  {
    id: 15,
    emoji: '🍴',
    name: 'כלי מטבח',
    items: []
  },
  {
    id: 16,
    name: 'אחר',
    emoji: '📦',
    items: []
  },
  {
    id: 17,
    name: 'בית מרקחת',
    emoji: '💊',
    items: []
  }
]

