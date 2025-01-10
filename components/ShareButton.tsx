'use client'

import { Share2 } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function ShareButton() {
  const params = useParams()
  const listId = params.listId as string

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${listId}`
    
    try {
      if (navigator.share) {
        // Use native share dialog
        await navigator.share({
          title: 'רשימת קניות',
          text: 'הצטרפו לרשימת הקניות שלי',
          url: shareUrl
        })
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl)
        alert('הקישור הועתק ללוח')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-black/60 hover:text-black/80 transition-colors duration-200 flex items-center"
    >
      <Share2 size={20} className="ml-1" />
      <span className="text-sm">שיתוף</span>
    </button>
  )
}

