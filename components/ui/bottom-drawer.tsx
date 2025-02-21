import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface BottomDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  /** Height of the drawer as a percentage of screen height (0-100) */
  heightPercentage?: number
}

export function BottomDrawer({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  heightPercentage = 95
}: BottomDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0])

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
      // Add viewport meta tag for mobile
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      document.head.appendChild(meta)
      return () => {
        document.body.style.overflow = ''
        document.head.removeChild(meta)
      }
    }
  }, [isOpen])

  const drawerStyle = {
    y,
    '--drawer-height': `${heightPercentage}vh`
  } as React.CSSProperties

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 touch-none"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose()
              }
            }}
            style={drawerStyle}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-white rounded-t-[20px] shadow-xl',
              'flex flex-col',
              'h-[var(--drawer-height)]',
              'safe-area-inset-bottom',
              className
            )}
          >
            {/* Drag handle */}
            <div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto my-3" />

            {/* Close button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            )}

            {/* Content */}
            <motion.div 
              className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
              style={{ opacity }}
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 