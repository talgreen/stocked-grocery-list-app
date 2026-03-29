interface BatchItem {
  name: string
  comment?: string
}

interface BatchResult {
  name: string
  category: string
}

export class OpenRouter {
  static async categorize(itemName: string) {
    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemName })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Categorization request failed:', {
          status: response.status,
          error: errorData
        })
        throw new Error('Failed to categorize item')
      }

      return await response.json()
    } catch (error) {
      console.error('OpenRouter client error:', error)
      throw error
    }
  }

  static async categorizeBatch(items: BatchItem[]): Promise<BatchResult[]> {
    try {
      const response = await fetch('/api/categorize-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Batch categorization request failed:', {
          status: response.status,
          error: errorData
        })
        throw new Error('Failed to batch categorize items')
      }

      const data = await response.json()
      return data.results
    } catch (error) {
      console.error('OpenRouter batch client error:', error)
      throw error
    }
  }
} 