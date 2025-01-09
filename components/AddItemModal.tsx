'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, X } from 'lucide-react'

interface AddItemModalProps {
  onAdd: (item: string, comment: string) => void
  onClose: () => void
}

export default function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    if (isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.onresult = (event) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (item.trim()) {
      const items = item.split(',').map(i => i.trim()).filter(i => i !== '')
      items.forEach(i => onAdd(i, comment.trim()))
      setItem('')
      setComment('')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-md shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <div className="flex">
              <input
                type="text"
                id="item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="flex-grow border-gray-300 rounded-l-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm"
                placeholder="Enter item name (comma-separated for multiple)"
                required
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
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
              placeholder="Add a comment"
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
      </motion.div>
    </motion.div>
  )
}

