import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { itemName } = await request.json()
    
    console.log('Categorization request:', { itemName })
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
      },
      body: JSON.stringify({
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

- החזר תשובה בפורמט JSON בלבד.
- סווג כל מוצר לקטגוריה המתאימה ביותר לפי ההגדרות לעיל.
{
  "category": "שם הקטגוריה בעברית",
  "emoji": "האימוג׳י המתאים ביותר לקטגוריה"
}`
          },
          {
            role: 'user',
            content: `המוצר: ${itemName}`
          }
        ],
        model: "google/gemini-2.0-flash-exp:free",
        temperature: 0.3
      })
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers)
      })
      return NextResponse.json({ error: 'Failed to categorize item' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(JSON.parse(data.choices[0].message.content))
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