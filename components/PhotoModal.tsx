import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoModalProps {
  photoUrl: string
  onClose: () => void
}

export default function PhotoModal({ photoUrl, onClose }: PhotoModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setIsLoading(false)
    img.src = photoUrl
  }, [photoUrl])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg overflow-hidden max-w-2xl max-h-[90vh] w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 bg-emerald-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <img src={photoUrl} alt="Item" className="w-full h-auto" />
            )}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-800 hover:text-emerald-600 transition-colors duration-200 shadow-md"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-4 bg-emerald-50">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Item Photo</h3>
            <p className="text-sm text-emerald-600">Click outside the image to close</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

