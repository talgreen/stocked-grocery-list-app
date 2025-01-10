import { AnimatePresence, motion } from 'framer-motion'
import { CheckSquare, Square, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
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
  const commentInputRef = useRef<HTMLInputElement>(null)

  const handleCommentBlur = () => {
    setIsEditingComment(false)
    if (editedComment !== item.comment) {
      onEdit(editedComment)
    }
  }

  const handleDelete = () => {
    if (isDeleting) {
      onDelete()
    } else {
      setIsDeleting(true)
      setTimeout(() => setIsDeleting(false), 3000)
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`px-4 py-1.5 ${item.purchased ? 'opacity-50' : ''}`}
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
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={item.purchased ? 'checked' : 'unchecked'}
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
            className={`flex-shrink-0 text-black/40 hover:text-red-500 transition-colors duration-200 ${
              isDeleting ? 'bg-red-50 text-red-500 px-2 py-1 rounded-lg' : ''
            }`}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
          >
            {isDeleting ? (
              <span className="text-xs">בטוח?</span>
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
  )
}

