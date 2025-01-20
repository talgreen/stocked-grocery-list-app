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

  static async categorizeBatch(items: { name: string, comment: string }[]) {
    try {
      const response = await fetch('/api/categorize-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: items.map(item => ({
            name: item.name,
            comment: item.comment
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Batch categorization request failed:', {
          status: response.status,
          error: errorData
        })
        throw new Error('Failed to categorize items')
      }

      return await response.json() as { category: string, emoji: string }[]
    } catch (error) {
      console.error('OpenRouter client error:', error)
      throw error
    }
  }
} 