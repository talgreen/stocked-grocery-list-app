import { NextResponse } from 'next/server'
import { categorizeItem } from '@/lib/server/categorize'

export async function POST(request: Request) {
  try {
    const { itemName } = await request.json()

    console.log('Categorization request:', { itemName })

    const result = await categorizeItem(itemName)

    return NextResponse.json(result)
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
