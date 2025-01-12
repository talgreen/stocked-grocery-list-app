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
} 