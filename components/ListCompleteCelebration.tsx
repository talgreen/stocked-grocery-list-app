'use client'

import { analyzeShoppingPersonality, ShoppingPersonality } from '@/lib/shopping-personality'
import { Category } from '@/types/categories'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

interface ListCompleteCelebrationProps {
  categories: Category[]
  totalItems: number
  onDismiss: () => void
}

export default function ListCompleteCelebration({
  categories,
  totalItems,
  onDismiss,
}: ListCompleteCelebrationProps) {
  const [phase, setPhase] = useState<'entrance' | 'personality' | 'stats'>('entrance')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confettiRef = useRef<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const personality = useMemo(
    () => analyzeShoppingPersonality(categories),
    [categories]
  )

  const stats = useMemo(() => {
    const categoriesUsed = categories.filter(c => c.items.some(i => i.purchased)).length
    const topCategories = categories
      .map(c => ({ emoji: c.emoji, name: c.name, count: c.items.filter(i => i.purchased).length }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return { categoriesUsed, topCategories }
  }, [categories])

  // Fire confetti on mount
  useEffect(() => {
    let cancelled = false

    import('canvas-confetti').then(mod => {
      if (cancelled || !canvasRef.current) return

      const myConfetti = mod.default.create(canvasRef.current, {
        resize: true,
        useWorker: true,
      })
      confettiRef.current = myConfetti

      // Initial burst
      const colors = ['#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#22c55e', '#fbbf24']

      myConfetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors,
        startVelocity: 45,
      })

      // Delayed side bursts
      setTimeout(() => {
        if (cancelled) return
        myConfetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        })
        myConfetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        })
      }, 400)

      // Another wave
      setTimeout(() => {
        if (cancelled) return
        myConfetti({
          particleCount: 60,
          spread: 120,
          origin: { y: 0.4 },
          colors,
          startVelocity: 35,
        })
      }, 900)
    })

    return () => {
      cancelled = true
      try { confettiRef.current?.reset() } catch { /* noop in test env */ }
    }
  }, [])

  // Phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('personality'), 600)
    const t2 = setTimeout(() => setPhase('stats'), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 20, stiffness: 250, delay: 0.15 }}
        className="relative z-10 bg-white rounded-3xl shadow-2xl mx-6 max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top decoration bar */}
        <div className="h-2 bg-gradient-to-l from-[#FFB74D] via-[#FFA726] to-[#FF9800]" />

        <div className="p-6 text-center" dir="rtl">
          {/* Trophy / celebration icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.3 }}
            className="text-6xl mb-3"
          >
            🎉
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-800 mb-1"
          >
            כל הכבוד!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-500 mb-5"
          >
            סיימת את כל {totalItems} הפריטים ברשימה
          </motion.p>

          {/* Personality reveal */}
          <AnimatePresence>
            {(phase === 'personality' || phase === 'stats') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 200 }}
                className="bg-gradient-to-bl from-[#FFF8F0] to-[#FDF6ED] rounded-2xl p-4 mb-4 border border-[#FFB74D]/20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.15 }}
                  className="text-4xl mb-2"
                >
                  {personality.emoji}
                </motion.div>
                <p className="text-xs text-[#FF9800] font-semibold uppercase tracking-wider mb-1">
                  הטיפוס שלך
                </p>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {personality.titleHe}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {personality.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <AnimatePresence>
            {phase === 'stats' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                {/* Category breakdown */}
                <div className="flex justify-center gap-3 flex-wrap">
                  {stats.topCategories.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-1.5"
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm font-medium text-gray-700">{cat.count}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Summary stat */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-gray-400"
                >
                  {totalItems} פריטים מ-{stats.categoriesUsed} קטגוריות
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={onDismiss}
            className="mt-5 bg-[#FFB74D] hover:bg-[#FFA726] text-white font-medium px-8 py-2.5 rounded-full transition-colors duration-200 text-sm"
          >
            יאללה, סיימנו! ✓
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
