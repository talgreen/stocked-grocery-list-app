import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { CheckSquare, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Item } from '../types/item'
import PhotoModal from './PhotoModal'

interface GroceryItemProps {
  item: Item
  onToggle: () => void
  onDelete: () => void
  onEdit: (newComment: string) => void
}

export default function GroceryItem({ item, onToggle, onDelete, onEdit }: GroceryItemProps) {
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [editedComment, setEditedComment] = useState(item.comment || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const x = useMotionValue(0)

  const handleDelete = () => {
    if (isDeleting) {
      onDelete()
    } else {
      setIsDeleting(true)
      setTimeout(() => setIsDeleting(false), 3000)
    }
  }

  const handleCommentBlur = () => {
    setIsEditingComment(false)
    if (editedComment !== item.comment) {
      onEdit(editedComment)
    }
  }

  const handleDragEnd = () => {
    const threshold = 50
    const currentX = x.get()

    if (currentX <= -threshold) {
      onToggle()
    } else if (currentX >= threshold) {
      onDelete()
    }
    setIsDragging(false)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background layers - only show when dragging */}
      {isDragging && (
        <div className="absolute inset-0 flex">
          {/* Toggle background */}
          <div className="w-1/2 bg-[#FFB74D] flex items-center justify-start pl-4">
            <CheckSquare className="text-white h-5 w-5" />
          </div>
          {/* Delete background */}
          <div className="w-1/2 bg-red-500 flex items-center justify-end pr-4">
            <Trash2 className="text-white h-5 w-5" />
          </div>
        </div>
      )}

      <motion.li
        layout
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onDragStart={() => setIsDragging(true)}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`px-4 py-1.5 relative touch-pan-x bg-white ${
          item.purchased ? 'opacity-50' : ''
        }`}
      >
        <div className="flex flex-col min-h-8 group">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              className={`flex-shrink-0 transition-colors duration-200 ${
                item.purchased ? 'text-[#FFB74D]' : 'text-black/20 hover:text-[#FFB74D]'
              }`}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              key={`checkbox-${item.id}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${item.id}-${item.purchased}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.purchased ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
            
            <span className={`text-sm truncate leading-tight flex-1 ${
              item.purchased ? 'line-through text-black/40' : 'text-black/80'
            }`}>
              {item.name}
            </span>

            <motion.button
              onClick={handleDelete}
              className={`flex-shrink-0 text-black/40 hover:text-red-500 transition-colors duration-200 h-5 w-5 flex items-center justify-center ${
                isDeleting ? 'bg-red-50 text-red-500 !w-auto px-2' : ''
              }`}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              {isDeleting ? (
                <span className="text-xs whitespace-nowrap">למחוק?</span>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </motion.button>
          </div>

          {item.comment && (
            <div className="pr-8 text-xs text-black/40 truncate leading-tight min-h-4">
              {item.comment}
            </div>
          )}
        </div>
        {item.photo && showPhotoModal && (
          <PhotoModal photoUrl={item.photo} onClose={() => setShowPhotoModal(false)} />
        )}
      </motion.li>
    </div>
  )
}

