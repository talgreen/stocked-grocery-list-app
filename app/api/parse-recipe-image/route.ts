import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { RECIPE_IMAGE_SYSTEM_PROMPT } from './prompt'

const VISION_MODEL = 'gpt-4o-mini'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: RECIPE_IMAGE_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: image }
            },
            {
              type: 'text',
              text: 'חלץ את המתכון מהתמונה'
            }
          ]
        }
      ],
      model: VISION_MODEL
    })

    if (!completion.choices[0]?.message?.content) {
      console.error('Unexpected API response structure:', completion)
      return NextResponse.json({ error: 'Invalid API response format' }, { status: 500 })
    }

    const content = completion.choices[0].message.content
    const cleanContent = content.replace(/```json\n|\n```/g, '').trim()

    try {
      const parsed = JSON.parse(cleanContent)

      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 422 })
      }

      if (!parsed.name || !Array.isArray(parsed.ingredients)) {
        console.error('Invalid recipe format:', parsed)
        return NextResponse.json({ error: 'Invalid recipe format in response' }, { status: 500 })
      }

      return NextResponse.json(parsed)
    } catch (error) {
      console.error('JSON parse error:', {
        content,
        cleanContent,
        error: error instanceof Error ? error.message : error
      })
      return NextResponse.json({ error: 'Failed to parse recipe response' }, { status: 500 })
    }
  } catch (error) {
    console.error('Recipe image parsing error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
