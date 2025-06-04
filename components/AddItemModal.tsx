'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Mic, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognition {
  start(): void
  onresult: (event: SpeechRecognitionEvent) => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

interface AddItemModalProps {
  onAdd: (item: string, comment: string) => void
  onClose: () => void
}

export default function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          setItem(transcript)
          setIsListening(false)
        }
        recognition.start()
      } else {
        console.error('Speech recognition not supported')
        setIsListening(false)
      }
    }
  }, [isListening])

  // Focus input when modal opens
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (item.trim()) {
      const items = item.split(',').map(i => i.trim()).filter(i => i !== '')
      items.forEach(i => onAdd(i, comment.trim()))
      setItem('')
      setComment('')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <div className="flex">
                  <input
                    ref={inputRef}
                    type="text"
                    id="item"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="flex-grow border-gray-300 rounded-l-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-base"
                    placeholder="Enter item name (comma-separated for multiple)"
                    required
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                  <button
                    type="button"
                    onClick={() => setIsListening(true)}
                    className="bg-emerald-500 text-white px-3 py-2 rounded-r-md hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center"
                  >
                    <Mic size={20} />
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Comment (optional)
                </label>
                <input
                  type="text"
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-base"
                  placeholder="Add a comment"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

