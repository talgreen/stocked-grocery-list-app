export class OpenRouter {
  static async categorize(itemName: string) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.href,
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
        model: "anthropic/claude-3.5-haiku-20241022:beta",
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error('Failed to categorize item')
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    return JSON.parse(content)
  }
} 