import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { CATEGORIZATION_SYSTEM_PROMPT } from '../categorize/prompt'

interface BatchItem {
  name: string
  comment?: string
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json() as { items: BatchItem[] }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 })
    }

    console.log('Batch categorization request:', { count: items.length })

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const itemsList = items
      .map((item, i) => `${i + 1}. ${item.name}${item.comment ? ` - ${item.comment}` : ''}`)
      .join('\n')

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `${CATEGORIZATION_SYSTEM_PROMPT}

כשמקבלים מספר מוצרים, החזר מערך JSON:
[
  { "name": "שם המוצר", "category": "שם הקטגוריה" },
  ...
]`
        },
        {
          role: 'user',
          content: `המוצרים:\n${itemsList}`
        }
      ],
      model: "gpt-5-nano"
    })

    if (!completion.choices[0]?.message?.content) {
      console.error('Unexpected API response structure:', completion)
      return NextResponse.json({ error: 'Invalid API response format' }, { status: 500 })
    }

    const content = completion.choices[0].message.content
    const cleanContent = content.replace(/```json\n|\n```/g, '').trim()

    try {
      const parsed = JSON.parse(cleanContent)

      if (!Array.isArray(parsed)) {
        console.error('Batch response is not an array:', cleanContent)
        return NextResponse.json({ error: 'Invalid batch response format' }, { status: 500 })
      }

      // Ensure every input item has a result, defaulting to "אחר" if missing
      const results = items.map(item => {
        const match = parsed.find(
          (r: { name: string; category: string }) =>
            r.name === item.name || r.name?.includes(item.name) || item.name?.includes(r.name)
        )
        return {
          name: item.name,
          category: match?.category?.trim() || 'אחר'
        }
      })

      return NextResponse.json({ results })
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
