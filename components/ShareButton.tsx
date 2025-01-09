'use client'

import { useState, useRef } from 'react'
import { Share2, X, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Category {
  id: number
  name: string
  items: {
    id: number
    name: string
    purchased: boolean
    comment?: string
  }[]
}

interface ShareButtonProps {
  categories: Category[]
}

export default function ShareButton({ categories }: ShareButtonProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const linkInputRef = useRef<HTMLInputElement>(null)

  const generateShareLink = () => {
    const data = JSON.stringify(categories)
    const encodedData = btoa(encodeURIComponent(data))
    const link = `${window.location.origin}/share?data=${encodedData}`
    setShareLink(link)
    setIsShareModalOpen(true)
  }

  const copyToClipboard = () => {
    if (linkInputRef.current) {
      linkInputRef.current.select()
      document.execCommand('copy')
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
        setIsShareModalOpen(false)
      }, 1500)
    }
  }

  return (
    <>
      <button
        onClick={generateShareLink}
        className="text-black/60 hover:text-black/80 transition-colors duration-200 flex items-center"
      >
        <Share2 size={20} className="mr-1" />
        <span className="text-sm">Share</span>
      </button>

      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-32 p-4 z-[9999]"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsShareModalOpen(false)
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-black/5 z-[10000]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black/90">Share List</h2>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-black/40 hover:text-black/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-grow px-3 py-2 rounded-xl bg-black/5 text-sm text-black/80 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

