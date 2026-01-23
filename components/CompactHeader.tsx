'use client'

import { useTabView } from '@/contexts/TabViewContext'
import { Share2, ShoppingCart, Pill, Check } from 'lucide-react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'

interface CompactHeaderProps {
  uncheckedItems: number
  totalItems: number
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        {/* Background circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <motion.circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#FFB74D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      {/* Percentage text or checkmark */}
      <div className="absolute inset-0 flex items-center justify-center">
        {percentage === 100 ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Check className="w-5 h-5 text-[#FFB74D]" strokeWidth={3} />
          </motion.div>
        ) : (
          <span className="text-xs font-bold text-gray-700">{percentage}%</span>
        )}
      </div>
    </div>
  )
}

export default function CompactHeader({ uncheckedItems, totalItems }: CompactHeaderProps) {
  const params = useParams()
  const listId = params?.listId as string
  const { activeTab, setActiveTab } = useTabView()

  const completedItems = totalItems - uncheckedItems
  const progressPercentage = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 0

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${listId}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'רשימת קניות',
          text: 'הצטרפו לרשימת הקניות שלי',
          url: shareUrl
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert('הקישור הועתק ללוח')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const getProgressMessage = () => {
    if (totalItems === 0) return 'הרשימה ריקה'
    if (progressPercentage === 100) return 'כל הכבוד! סיימת הכל'
    if (progressPercentage >= 75) return 'כמעט שם!'
    if (progressPercentage >= 50) return 'יותר מחצי הדרך'
    if (uncheckedItems === 1) return 'נשאר פריט אחד'
    return `נשארו ${uncheckedItems} פריטים`
  }

  return (
    <div className="bg-white border-b border-black/5 shadow-sm sticky top-0 pt-safe z-30">
      {/* Main header row */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Progress ring and message */}
          <div className="flex items-center gap-3 flex-1">
            <CircularProgress percentage={progressPercentage} />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-700 truncate">
                {getProgressMessage()}
              </span>
              {totalItems > 0 && (
                <span className="text-xs text-gray-400">
                  {completedItems}/{totalItems}
                </span>
              )}
            </div>
          </div>

          {/* Tab Pills */}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('grocery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'grocery'
                  ? 'bg-[#FFB74D] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">קניות</span>
            </button>
            <button
              onClick={() => setActiveTab('pharmacy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'pharmacy'
                  ? 'bg-[#FFB74D] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">בית מרקחת</span>
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            title="שיתוף"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
