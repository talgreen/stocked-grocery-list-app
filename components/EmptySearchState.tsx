'use client'

import { motion } from 'framer-motion'
import { Sparkles, Plus, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'

interface EmptySearchStateProps {
  searchQuery: string
  onQuickAdd: () => void
  onOpenAddForm: () => void
  isLoading?: boolean
}

export function EmptySearchState({
  searchQuery,
  onQuickAdd,
  onOpenAddForm,
  isLoading = false
}: EmptySearchStateProps) {

  // Handle Enter key to quick add
  // Only trigger if the search input (or no input) is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no text input is currently focused
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

      if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isInputFocused) {
        e.preventDefault()
        onQuickAdd()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onQuickAdd, isLoading])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative overflow-hidden"
    >
      {/* Main Card */}
      <div className="bg-gradient-to-br from-white via-white to-orange-50/50 rounded-3xl p-8 border border-orange-100/50 shadow-lg shadow-orange-100/20">
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Sparkles className="w-8 h-8 text-[#FFB74D]" />
          </motion.div>
        </div>
        <div className="absolute bottom-6 left-6 opacity-10">
          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          >
            <Sparkles className="w-12 h-12 text-[#FFB74D]" />
          </motion.div>
        </div>

        {/* Animated Shopping Bag Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFB74D]/30 to-[#FFA726]/30 rounded-full blur-2xl scale-150" />

            {/* Icon container */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative bg-gradient-to-br from-[#FFB74D] to-[#FFA726] w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50"
            >
              {/* Shopping bag SVG */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-10 h-10 text-white"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              {/* Plus badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md"
              >
                <Plus className="w-4 h-4 text-[#FFB74D]" />
              </motion.div>
            </motion.div>

            {/* Floating sparkles */}
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
                y: [-2, -8, -2]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              className="absolute -top-2 -right-2 text-[#FFB74D]"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <motion.div
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.9, 1.1, 0.9],
                y: [-1, -6, -1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
              className="absolute -top-1 -left-3 text-[#FFA726]"
            >
              <Sparkles className="w-3 h-3" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3 mb-6"
        >
          <h3 className="text-xl font-bold text-gray-800">
            לא מצאנו את &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            נראה שהפריט הזה עדיין לא ברשימה.
            <br />
            <span className="text-[#FFB74D] font-medium">הוסף אותו בלחיצה אחת!</span>
          </p>
        </motion.div>

        {/* Quick Add Button */}
        <motion.button
          onClick={onQuickAdd}
          disabled={isLoading}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-[#FFB74D] to-[#FFA726] text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/60 transition-shadow duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#FFB74D]/30"
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut'
            }}
          />

          <span className="relative flex items-center justify-center gap-3">
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>הוסף &ldquo;{searchQuery}&rdquo;</span>
              </span>
            )}
          </span>

          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-medium"
          >
            AI
          </motion.div>
        </motion.button>

        {/* Keyboard Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-400 mt-3"
        >
          לחץ <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> להוספה מהירה
        </motion.p>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-gradient-to-br from-white via-white to-orange-50/50 text-gray-400">או</span>
          </div>
        </div>

        {/* Secondary Action */}
        <motion.button
          onClick={onOpenAddForm}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ x: -4 }}
          className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-[#FFB74D] text-sm font-medium py-2 transition-colors duration-200"
        >
          <span>הוסף עם פרטים נוספים</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default EmptySearchState
