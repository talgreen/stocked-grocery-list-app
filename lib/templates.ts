import { Item } from '@/types/item'

export interface TemplateItem extends Pick<Item, 'name' | 'comment' | 'quantity' | 'unit' | 'price'> {
  category: string
  emoji?: string
}

export interface ListTemplate {
  id: string
  title: string
  description: string
  items: TemplateItem[]
}

export const listTemplates: ListTemplate[] = [
  {
    id: 'weekly-basics',
    title: 'מצרכים לשבוע',
    description: 'סטוק בסיסי לשבוע רגיל של קניות לבית',
    items: [
      { name: 'חלב', category: 'מוצרי חלב', emoji: '🥛', quantity: 2, unit: 'ליטר' },
      { name: 'ביצים', category: 'ביצים', emoji: '🥚', quantity: 1, unit: 'תבנית', comment: 'L' },
      { name: 'לחם מחיטה מלאה', category: 'מאפים', emoji: '🥖', quantity: 2, unit: 'יח׳' },
      { name: 'חזה עוף טרי', category: 'בשר ודגים', emoji: '🥩', quantity: 1, unit: 'ק"ג' },
      { name: 'אורז בסמטי', category: 'מזווה', emoji: '🍝', quantity: 1, unit: 'ק"ג' },
      { name: 'עגבניות', category: 'ירקות', emoji: '🥬', quantity: 6, unit: 'יח׳' },
      { name: 'מלפפונים', category: 'ירקות', emoji: '🥬', quantity: 6, unit: 'יח׳' },
      { name: 'גבינה צהובה', category: 'מוצרי חלב', emoji: '🥛', quantity: 0.4, unit: 'ק"ג' },
      { name: 'סלמון', category: 'בשר ודגים', emoji: '🥩', quantity: 4, unit: 'נתחים', comment: 'לארוחת ערב' },
      { name: 'נייר טואלט', category: 'מוצרי ניקיון', emoji: '🧹', quantity: 1, unit: 'חבילה' }
    ]
  },
  {
    id: 'hosting-night',
    title: 'אירוח ערב',
    description: 'מבחר נשנושים ושתייה לאירוח חברים',
    items: [
      { name: 'פלטת גבינות', category: 'מוצרי חלב', emoji: '🥛', quantity: 1, unit: 'מגש' },
      { name: 'קרקרים מלוחים', category: 'מאפים', emoji: '🥖', quantity: 2, unit: 'חבילות' },
      { name: 'יין אדום', category: 'משקאות', emoji: '🧃', quantity: 2, unit: 'בקבוקים' },
      { name: 'ירקות חתוכים', category: 'ירקות', emoji: '🥬', quantity: 1, unit: 'מגש' },
      { name: 'חטיפי שוקולד', category: 'חטיפים ומתוקים', emoji: '🍪', quantity: 3, unit: 'חבילות' },
      { name: 'בירה', category: 'משקאות', emoji: '🧃', quantity: 6, unit: 'בקבוקים' }
    ]
  },
  {
    id: 'pharmacy-restock',
    title: 'חידוש בית מרקחת',
    description: 'רשימת מוצרים עיקריים למדף התרופות הביתי',
    items: [
      { name: 'אקמול', category: 'בית מרקחת', emoji: '💊', quantity: 2, unit: 'אריזות' },
      { name: 'תחבושות אלסטיות', category: 'בית מרקחת', emoji: '💊', quantity: 1, unit: 'סט' },
      { name: 'מדחום דיגיטלי', category: 'בית מרקחת', emoji: '💊', quantity: 1, unit: 'יח׳' },
      { name: 'ויטמין C', category: 'בית מרקחת', emoji: '💊', quantity: 1, unit: 'בקבוק' }
    ]
  }
]
