import OpenAI from 'openai'

interface CategorizationResult {
  category: string
  emoji: string
}

const SYSTEM_PROMPT = `אתה מומחה לקטגוריזציה של מוצרי מכולת. תפקידך לסווג מוצרים לקטגוריות המתאימות ביותר.
הקטגוריות העיקריות וההגדרות שלהן:
- 🥬 ירקות: כל סוגי הירקות הטריים שנאכלים או מבושלים.
- 🍎 פירות: כל סוגי הפירות הטריים.
- 🥛 מוצרי חלב: כל המוצרים המכילים חלב או תוצרתו.
- 🥩 בשר ודגים: כל סוגי הבשר והדגים.
- 🥚 ביצים: ביצים ומוצרים תחליפיים כמו טופו וסייטן.
- 🥫 שימורים: מזון ארוז ושמור בקופסאות שימורים.
- 🫙 ממרחים ורטבים: ממרחים או רטבים המשמשים תוספת למזון.
- 🥖 מאפים: לחמים, פיתות, לחמניות, וכל סוגי המאפים.
- 🧂 תבלינים: כל סוגי התבלינים והתערובות.
- 🍝 מזווה: מוצרי בסיס יבשים כמו אורז, פסטה, קמח וסוכר.
- 🧃 משקאות: כל סוגי השתייה.
- 🍪 חטיפים ומתוקים: כל סוגי החטיפים והממתקים.
- 🧊 קפואים: מזון מוקפא שמוכן לשימוש מאוחר יותר.
- 🍴 כלי מטבח: מוצרים וחומרים המשמשים במטבח להכנה, בישול, אפייה, או אחסון. לדוגמה: נייר כסף, תבניות חד פעמיות, שקיות זיפלוק.
- 🧹 מוצרי ניקיון: חומרי ניקוי, מוצרי כביסה, נייר טואלט, מגבונים ומוצרי היגיינה לבית. לדוגמה: סבון כלים, אקונומיקה, מרכך כביסה, שקיות אשפה.
- 📦 אחר: כל סוגי המוצרים שאינם נכללים בקטגוריות שלעיל.

- החזר תשובה בפורמט JSON בלבד.
- סווג כל מוצר לקטגוריה המתאימה ביותר לפי ההגדרות לעיל.
{
  "category": "שם הקטגוריה בעברית",
  "emoji": "האימוג׳י המתאים ביותר לקטגוריה"
}`

export async function categorizeItem(itemName: string): Promise<CategorizationResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `המוצר: ${itemName}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.3
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Invalid categorization response')
  }

  const cleanContent = content.replace(/```json\n|\n```/g, '').trim()

  try {
    return JSON.parse(cleanContent)
  } catch {
    throw new Error('Failed to parse categorization response')
  }
}

export type { CategorizationResult }
