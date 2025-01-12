export class OpenRouter {
  static async categorize(itemName: string) {
    const response = await fetch('/api/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemName })
    })

    if (!response.ok) {
      throw new Error('Failed to categorize item')
    }

    return await response.json()
  }
} 