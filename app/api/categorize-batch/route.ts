import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Items array is empty' }, { status: 400 })
    }

    // Format items list for the prompt
    const itemsList = items
      .map((item, index) => `${index + 1}. ${item.name}${item.comment ? ` (${item.comment})` : ''}`)
      .join('\n')

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `אתה מומחה לקטגוריזציה של מוצרי מכולת. תפקידך לסווג מוצרים לקטגוריות המתאימות ביותר.
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

החזר תשובה בפורמט של מערך JSON בלבד, גם אם יש רק פריט אחד.
לדוגמה:
[{
  "category": "שם הקטגוריה בעברית",
  "emoji": "האימוג׳י המתאים ביותר לקטגוריה"
}]

סווג כל מוצר לקטגוריה המתאימה ביותר לפי ההגדרות לעיל.`
        },
        {
          role: 'user',
          content: `Categorize these items:\n${itemsList}`
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 500
    })

    if (!completion.choices[0]?.message?.content) {
      console.error('Unexpected API response structure:', completion)
      return NextResponse.json({ error: 'Invalid API response format' }, { status: 500 })
    }

    const content = completion.choices[0].message.content
    // Clean up the content by removing markdown formatting if present
    const cleanContent = content.replace(/```json\n|\n```/g, '').trim()
    
    try {
      const parsed = JSON.parse(cleanContent)
      // Ensure the response is always an array
      const results = Array.isArray(parsed) ? parsed : [parsed]
      return NextResponse.json(results)
    } catch (error) {
      console.error('JSON parse error:', {
        content,
        cleanContent,
        error: error instanceof Error ? error.message : error
      })
      return NextResponse.json({ error: 'Failed to parse categorization response' }, { status: 500 })
    }
  } catch (error) {
    console.error('Batch categorization error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 