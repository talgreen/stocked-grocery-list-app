import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { CATEGORIZATION_SYSTEM_PROMPT } from './prompt'

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
          content: `${CATEGORIZATION_SYSTEM_PROMPT}
{
  "category": "שם הקטגוריה בדיוק מהרשימה למעלה"
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
