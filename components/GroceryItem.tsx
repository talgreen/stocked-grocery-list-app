import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { CheckSquare, MoreVertical, Square, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Item } from '../types/item'
import PhotoModal from './PhotoModal'

interface GroceryItemProps {
  item: Item
  categories: Category[]
  onToggle: () => void
  onDelete: () => void
  onEdit: (newComment: string) => void
  onUpdateCategory: (newCategoryId: number) => void
}

export default function GroceryItem({ item, categories, onToggle, onDelete, onEdit, onUpdateCategory }: GroceryItemProps) {
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [editedComment, setEditedComment] = useState(item.comment || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const x = useMotionValue(0)
  const itemRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (item.isNew && itemRef.current) {
      itemRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [item.isNew])

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
            <CheckSquare className="text-white h-5 w-5 absolute right-6 top-1/2 -translate-y-1/2" />
          </div>
          {/* Delete background */}
          <div className="w-1/2 bg-red-500 flex items-center justify-end pr-4">
            <Trash2 className="text-white h-5 w-5 absolute left-6 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      <motion.li
        ref={itemRef}
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
        className={`px-4 py-2 relative touch-pan-x bg-white ${
          item.purchased ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className={`flex-shrink-0 transition-colors duration-200 mt-0.5 ${
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
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className={`text-sm truncate ${
              item.purchased ? 'line-through text-black/40' : 'text-black/80'
            }`}>
              {item.name}
            </span>
            {item.comment && (
              <span className="text-xs text-black/40 truncate">
                ({item.comment})
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg">
                <MoreVertical className="h-4 w-4 text-black/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium text-black/40 text-right">
                העבר ל-
              </div>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => onUpdateCategory(category.id)}
                  className="text-right"
                >
                  {category.emoji} {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <motion.button
            onClick={handleDelete}
            className={`flex-shrink-0 text-black/40 hover:text-red-500 transition-colors duration-200 mt-0.5 ${
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
        {item.photo && showPhotoModal && (
          <PhotoModal photoUrl={item.photo} onClose={() => setShowPhotoModal(false)} />
        )}
      </motion.li>
    </div>
  )
}

