import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Category {
  id: number
  name: string
  items: any[]
}

interface CategoryScrollerProps {
  categories: Category[]
  onCategoryChange: (categoryId: number) => void
  activeCategoryId: number
}

export default function CategoryScroller({ categories, onCategoryChange, activeCategoryId }: CategoryScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const dragDistance = useRef(0)
  const lastScrollPosition = useRef(0)
  const isManualScrolling = useRef(false)

  useEffect(() => {
    if (isDragging || isManualScrolling.current) return
    
    const activeElement = document.querySelector(`[data-category-id="${activeCategoryId}"]`)
    if (activeElement && scrollRef.current) {
      const container = scrollRef.current
      const scrollLeft = activeElement.offsetLeft - (container.offsetWidth / 2) + (activeElement.clientWidth / 2)
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [activeCategoryId, isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    isManualScrolling.current = true
    dragDistance.current = 0
    startX.current = e.clientX
    scrollLeft.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const dx = e.clientX - startX.current
    const newScrollLeft = scrollLeft.current - dx
    scrollRef.current.scrollLeft = newScrollLeft
    dragDistance.current = Math.abs(dx)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Keep manual scrolling true for a short period to prevent auto-scroll
    setTimeout(() => {
      isManualScrolling.current = false
    }, 100)
  }

  const handleClick = (e: React.MouseEvent, categoryId: number) => {
    if (dragDistance.current < 5) {
      onCategoryChange(categoryId)
      isManualScrolling.current = false
    }
    dragDistance.current = 0
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              data-category-id={category.id}
              onClick={(e) => handleClick(e, category.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200
                ${category.id === activeCategoryId 
                  ? 'border-[#FFB74D] text-black/90' 
                  : 'border-transparent text-black/60 hover:text-black/90'
                }`}
              animate={{
                opacity: category.id === activeCategoryId ? 1 : 0.7,
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-xl">
                {category.name.split(' ')[0]}
              </span>
              <span className="text-sm font-medium whitespace-nowrap">
                {category.name.split(' ').slice(1).join(' ')}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

