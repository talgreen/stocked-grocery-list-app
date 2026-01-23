import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { itemName } = await request.json()
    
    console.log('Categorization request:', { itemName })
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `אתה מומחה לקטגוריזציה של מוצרי מכולת. תפקידך לסווג מוצרים לקטגוריות המתאימות ביותר.

הקטגוריות האפשריות (החזר את השם בדיוק כפי שמופיע, ללא אימוג׳י):
- ירקות: כל סוגי הירקות הטריים שנאכלים או מבושלים.
- פירות: כל סוגי הפירות הטריים.
- מוצרי חלב: כל המוצרים המכילים חלב או תוצרתו.
- בשר ודגים: כל סוגי הבשר והדגים.
- ביצים: ביצים ומוצרים תחליפיים כמו טופו וסייטן.
- שימורים: מזון ארוז ושמור בקופסאות שימורים.
- ממרחים ורטבים: ממרחים או רטבים המשמשים תוספת למזון.
- מאפים: לחמים, פיתות, לחמניות, וכל סוגי המאפים.
- תבלינים: כל סוגי התבלינים והתערובות.
- מזווה: מוצרי בסיס יבשים כמו אורז, פסטה, קמח וסוכר.
- משקאות: כל סוגי השתייה.
- חטיפים ומתוקים: כל סוגי החטיפים והממתקים.
- קפואים: מזון מוקפא שמוכן לשימוש מאוחר יותר.
- כלי מטבח: מוצרים וחומרים המשמשים במטבח להכנה, בישול, אפייה, או אחסון. לדוגמה: נייר כסף, תבניות חד פעמיות, שקיות זיפלוק.
- מוצרי ניקיון: חומרי ניקוי, מוצרי כביסה, נייר טואלט, מגבונים ומוצרי היגיינה לבית. לדוגמה: סבון כלים, אקונומיקה, מרכך כביסה, שקיות אשפה.
- אחר: כל סוגי המוצרים שאינם נכללים בקטגוריות שלעיל.

חוקים:
- החזר תשובה בפורמט JSON בלבד.
- סווג כל מוצר לקטגוריה המתאימה ביותר לפי ההגדרות לעיל.
- השתמש בשם הקטגוריה בדיוק כפי שמופיע ברשימה (ללא אימוג׳י בשדה category).
{
  "category": "שם הקטגוריה בדיוק מהרשימה למעלה",
  "emoji": "אימוג׳י מתאים למוצר"
}`
        },
        {
          role: 'user',
          content: `המוצר: ${itemName}`
        }
      ],
      model: "gpt-5-nano"
    })

    if (!completion.choices[0]?.message?.content) {
      console.error('Unexpected API response structure:', completion)
      return NextResponse.json({ error: 'Invalid API response format' }, { status: 500 })
    }

    const content = completion.choices[0].message.content
    // Clean up the content by removing markdown formatting if present
    const cleanContent = content.replace(/```json\n|\n```/g, '').trim()
    
    try {
      return NextResponse.json(JSON.parse(cleanContent))
    } catch (error) {
      console.error('JSON parse error:', {
        content,
        cleanContent,
        error: error instanceof Error ? error.message : error
      })
      return NextResponse.json({ error: 'Failed to parse categorization response' }, { status: 500 })
    }
  } catch (error) {
    console.error('Categorization error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
