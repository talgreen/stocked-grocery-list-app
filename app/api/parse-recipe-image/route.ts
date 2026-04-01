import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { RECIPE_IMAGE_SYSTEM_PROMPT } from './prompt'

const VISION_MODEL = 'gpt-5-nano'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body - image may be too large' }, { status: 413 })
    }

    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    // Ensure the image is a valid data URI
    let imageUrl = image
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${imageUrl}`
    }

    console.log('Recipe image parse request, image length:', imageUrl.length, 'prefix:', imageUrl.substring(0, 30))

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${RECIPE_IMAGE_SYSTEM_PROMPT}\n\nחלץ את המתכון מהתמונה`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
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
    console.log('LLM raw response:', content)

    // Strip markdown fences and extract JSON object
    let cleanContent = content
      .replace(/```(?:json|JSON)?\s*/g, '')
      .replace(/```/g, '')
      .trim()

    // If there's extra text around the JSON, extract the JSON object
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanContent = jsonMatch[0]
    }

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
