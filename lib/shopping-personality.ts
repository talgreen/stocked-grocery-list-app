import { Category } from '@/types/categories'

export interface ShoppingPersonality {
  title: string
  titleHe: string
  emoji: string
  description: string
}

interface CategoryCount {
  categoryId: number
  categoryName: string
  emoji: string
  count: number
}

// Analyze purchased items across categories and return a fun personality
export function analyzeShoppingPersonality(categories: Category[]): ShoppingPersonality {
  const categoryCounts: CategoryCount[] = categories
    .filter(c => c.items.length > 0)
    .map(c => ({
      categoryId: c.id,
      categoryName: c.name,
      emoji: c.emoji,
      count: c.items.filter(i => i.purchased).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)

  const totalPurchased = categoryCounts.reduce((sum, c) => sum + c.count, 0)
  if (totalPurchased === 0) return personalities.default

  // Check for specific personality patterns
  const categoryNameCounts = new Map(categoryCounts.map(c => [c.categoryName, c.count]))
  const get = (name: string) => categoryNameCounts.get(name) || 0

  const veggies = get('ירקות')
  const fruits = get('פירות')
  const healthyItems = veggies + fruits
  const snacks = get('חטיפים ומתוקים')
  const spices = get('תבלינים')
  const pantry = get('מזווה')
  const meat = get('בשר ודגים')
  const dairy = get('מוצרי חלב')
  const bakery = get('מאפים')
  const cleaning = get('מוצרי ניקיון')
  const drinks = get('משקאות')
  const frozen = get('קפואים')
  const pharmacy = get('בית מרקחת')

  // Pattern matching - most specific first
  if (healthyItems > totalPurchased * 0.4) return personalities.healthGuru
  if (snacks > totalPurchased * 0.3) return personalities.sweetTooth
  if (spices + pantry > totalPurchased * 0.35) return personalities.masterChef
  if (meat > totalPurchased * 0.3) return personalities.grillMaster
  if (cleaning > totalPurchased * 0.3) return personalities.cleanFreak
  if (frozen > totalPurchased * 0.3) return personalities.frozenFan
  if (drinks > totalPurchased * 0.3) return personalities.hydrationHero
  if (bakery > totalPurchased * 0.25) return personalities.carbLover
  if (dairy > totalPurchased * 0.25) return personalities.dairyDevotee
  if (pharmacy > totalPurchased * 0.3) return personalities.wellnessWarrior
  if (categoryCounts.length >= 6) return personalities.balanced
  if (totalPurchased >= 20) return personalities.stockpiler
  if (totalPurchased <= 5) return personalities.minimalist

  return personalities.smartShopper
}

const personalities: Record<string, ShoppingPersonality> = {
  healthGuru: {
    title: 'Health Guru',
    titleHe: 'גורו הבריאות',
    emoji: '🥗',
    description: 'הסל שלך מלא בירוקים ובריאות! הגוף שלך מודה לך',
  },
  sweetTooth: {
    title: 'Sweet Tooth',
    titleHe: 'שיניים מתוקות',
    emoji: '🍭',
    description: 'החיים מתוקים יותר עם חטיפים! אתה יודע ליהנות',
  },
  masterChef: {
    title: 'Master Chef',
    titleHe: 'שף מאסטר',
    emoji: '👨‍🍳',
    description: 'תבלינים ומצרכים בשפע — ארוחה מדהימה בדרך!',
  },
  grillMaster: {
    title: 'Grill Master',
    titleHe: 'מלך המנגל',
    emoji: '🔥',
    description: 'בשר ודגים ברמה אחרת! המנגל חם ומוכן',
  },
  cleanFreak: {
    title: 'Clean Machine',
    titleHe: 'מכונת ניקיון',
    emoji: '✨',
    description: 'בית נקי = ראש שקט! הכל הולך לנצנץ',
  },
  frozenFan: {
    title: 'Frozen Fan',
    titleHe: 'מלך הקפואים',
    emoji: '🧊',
    description: 'המקפיא שלך תמיד מאובזר! מוכן לכל מצב',
  },
  hydrationHero: {
    title: 'Hydration Hero',
    titleHe: 'גיבור ההידרציה',
    emoji: '💧',
    description: 'שתייה בשפע! תמיד לחות ורעננות',
  },
  carbLover: {
    title: 'Carb Lover',
    titleHe: 'חובב פחמימות',
    emoji: '🥐',
    description: 'לחם, מאפים ואושר! הפחמימות הן האושר האמיתי',
  },
  dairyDevotee: {
    title: 'Dairy Devotee',
    titleHe: 'חובב חלבי',
    emoji: '🧀',
    description: 'גבינות, יוגורט ושמנת — מגוון חלבי מושלם!',
  },
  wellnessWarrior: {
    title: 'Wellness Warrior',
    titleHe: 'לוחם הבריאות',
    emoji: '💊',
    description: 'בריאות מעל הכל! דואג לעצמך כמו שצריך',
  },
  balanced: {
    title: 'Balance Master',
    titleHe: 'מאסטר האיזון',
    emoji: '⚖️',
    description: 'קצת מהכל — רשימה מאוזנת ומגוונת בטירוף!',
  },
  stockpiler: {
    title: 'Stockpiler',
    titleHe: 'שורד מקצועי',
    emoji: '🏋️',
    description: 'רשימה מרשימה! המחסן שלך תמיד מלא',
  },
  minimalist: {
    title: 'Minimalist',
    titleHe: 'מינימליסט',
    emoji: '🎯',
    description: 'ממוקד ויעיל! יודע בדיוק מה צריך',
  },
  smartShopper: {
    title: 'Smart Shopper',
    titleHe: 'קונה חכם',
    emoji: '🛒',
    description: 'קניות חכמות ויעילות! הרשימה מוכנה',
  },
  default: {
    title: 'Explorer',
    titleHe: 'חוקר',
    emoji: '🧭',
    description: 'הרפתקה חדשה בסופר!',
  },
}
