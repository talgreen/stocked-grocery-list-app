import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// Mock OpenAI
const mockCreate = vi.fn()
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      }
    },
  }
})

// Set env before importing route
process.env.OPENAI_API_KEY = 'test-key'

import { POST } from '@/app/api/categorize-batch/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/categorize-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/categorize-batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns categorized results for multiple items', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify([
            { name: 'עגבניות', category: 'ירקות' },
            { name: 'חלב', category: 'מוצרי חלב' },
          ]),
        },
      }],
    })

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }, { name: 'חלב' }],
    }))

    const data = await response.json()
    expect(data.results).toHaveLength(2)
    expect(data.results[0]).toEqual({ name: 'עגבניות', category: 'ירקות' })
    expect(data.results[1]).toEqual({ name: 'חלב', category: 'מוצרי חלב' })
  })

  it('defaults missing items to אחר', async () => {
    // LLM returns only one result for two items
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify([
            { name: 'עגבניות', category: 'ירקות' },
          ]),
        },
      }],
    })

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }, { name: 'דבר מוזר' }],
    }))

    const data = await response.json()
    expect(data.results).toHaveLength(2)
    expect(data.results[0].category).toBe('ירקות')
    expect(data.results[1].category).toBe('אחר')
  })

  it('returns 400 for empty items array', async () => {
    const response = await POST(makeRequest({ items: [] }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for non-array items', async () => {
    const response = await POST(makeRequest({ items: 'not-an-array' }))
    expect(response.status).toBe(400)
  })

  it('returns 500 when LLM response is not an array', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({ category: 'ירקות' }),
        },
      }],
    })

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }],
    }))
    expect(response.status).toBe(500)
  })

  it('returns 500 when LLM returns no content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    })

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }],
    }))
    expect(response.status).toBe(500)
  })

  it('returns 500 when LLM returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: { content: 'not valid json at all' },
      }],
    })

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }],
    }))
    expect(response.status).toBe(500)
  })

  it('handles markdown-wrapped JSON response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: '```json\n[{"name": "עגבניות", "category": "ירקות"}]\n```',
        },
      }],
    })

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }],
    }))

    const data = await response.json()
    expect(data.results).toHaveLength(1)
    expect(data.results[0].category).toBe('ירקות')
  })

  it('includes comments in the prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify([
            { name: 'חלב', category: 'מוצרי חלב' },
          ]),
        },
      }],
    })

    await POST(makeRequest({
      items: [{ name: 'חלב', comment: '3% שומן' }],
    }))

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain('חלב')
    expect(userMessage.content).toContain('3% שומן')
  })

  it('returns 500 on OpenAI API error', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limit'))

    const response = await POST(makeRequest({
      items: [{ name: 'עגבניות' }],
    }))
    expect(response.status).toBe(500)
  })
})
