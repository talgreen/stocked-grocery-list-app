import { AnimatePresence, motion } from 'framer-motion'
import { CheckSquare, Edit, Eye, Square, Trash2 } from 'lucide-react'
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
      className={`px-4 py-2 ${item.purchased ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-3 flex-grow">
          <motion.button
            onClick={onToggle}
            className={`transition-colors duration-200 ${
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
          <span className={`text-sm ${item.purchased ? 'line-through text-black/40' : 'text-black/80'}`}>
            {item.name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isEditingComment ? (
            <input
              ref={commentInputRef}
              type="text"
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              onBlur={handleCommentBlur}
              onKeyPress={(e) => e.key === 'Enter' && handleCommentBlur()}
              className="text-xs p-1 rounded-lg bg-black/5 focus:outline-none focus:ring-1 focus:ring-[#FFB74D]"
              placeholder="הוסף הערה..."
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingComment(true)}
              className="text-xs text-black/40 hover:text-black/60"
            >
              {item.comment ? item.comment : <Edit size={12} />}
            </button>
          )}
          {item.photo && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="text-[#FFB74D] hover:text-[#FFA726] transition-colors duration-200"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <motion.button
            onClick={handleDelete}
            className={`text-black/40 hover:text-red-500 transition-colors duration-200 ${
              isDeleting ? 'bg-red-50 text-red-500 px-2 py-1 rounded-lg' : ''
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isDeleting ? (
              <span className="text-xs">בטוח?</span>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>
      {item.photo && showPhotoModal && (
        <PhotoModal photoUrl={item.photo} onClose={() => setShowPhotoModal(false)} />
      )}
    </motion.li>
  )
}

