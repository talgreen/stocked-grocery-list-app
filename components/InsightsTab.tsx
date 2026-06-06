'use client'

import { computeInsights, type CategoryInsight, type ItemInsight } from '@/lib/insights'
import { Category } from '@/types/categories'
import { motion } from 'framer-motion'
import { BarChart3, Repeat, ShoppingBag, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

interface InsightsTabProps {
  categories: Category[]
}

const formatInterval = (days: number | null) => {
  if (days === null || !Number.isFinite(days) || days <= 0) return ''
  if (days < 1.5) return 'כל יום'
  if (days < 14) return `כל ${Math.round(days)} ימים`
  if (days < 60) return `כל ${Math.round(days / 7)} שבועות`
  if (days < 365) return `כל ${Math.round(days / 30)} חודשים`
  return `כל ${Math.round(days / 365)} שנים`
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-black/5 bg-white p-3 text-center shadow-sm">
      <div className="mb-1 flex justify-center text-[#FFB74D]">{icon}</div>
      <div className="text-2xl font-bold text-black/80">{value}</div>
      <div className="text-[11px] leading-tight text-black/50">{label}</div>
    </div>
  )
}

function BarRow({
  label,
  emoji,
  value,
  max,
  caption,
}: {
  label: string
  emoji?: string
  value: number
  max: number
  caption?: string
}) {
  const widthPercent = max > 0 ? Math.max((value / max) * 100, 6) : 0

  return (
    <div className="flex items-center gap-3">
      {emoji && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-base">
          {emoji}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-neutral-800">{label}</span>
          <span className="shrink-0 text-xs font-semibold text-neutral-500">
            {caption ?? value}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${widthPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-l from-[#FFB74D] to-[#FFA726]"
          />
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[#FFB74D]">{icon}</span>
        <h3 className="text-sm font-bold text-black/80">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function InsightsTab({ categories }: InsightsTabProps) {
  const insights = useMemo(() => computeInsights(categories), [categories])

  if (insights.totalPurchases === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="flex flex-col items-center justify-center rounded-2xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <BarChart3 className="h-8 w-8 text-[#FFB74D]" />
        </div>
        <h3 className="text-base font-bold text-black/80">עדיין אין תובנות</h3>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-black/50">
          ככל שתסמנו פריטים שנקנו, נלמד את הרגלי הקנייה שלכם ונציג כאן סטטיסטיקות מעניינות.
        </p>
      </motion.div>
    )
  }

  const maxItemCount = insights.topItems[0]?.purchaseCount ?? 0
  const maxCategoryCount = insights.categoryBreakdown[0]?.purchaseCount ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      dir="rtl"
      className="space-y-4"
    >
      {/* Summary stats */}
      <div className="flex gap-3">
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          value={insights.totalPurchases}
          label="סך הכל קניות"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          value={insights.trackedItems}
          label="פריטים במעקב"
        />
        <StatCard
          icon={<Repeat className="h-5 w-5" />}
          value={insights.activeStaples}
          label="מצרכים קבועים"
        />
      </div>

      {/* Top purchased items */}
      {insights.topItems.length > 0 && (
        <SectionCard title="הפריטים הנקנים ביותר" icon={<ShoppingBag className="h-4 w-4" />}>
          <div className="space-y-3">
            {insights.topItems.map((item: ItemInsight) => (
              <BarRow
                key={`${item.categoryId}-${item.name}`}
                label={item.name}
                emoji={item.categoryEmoji}
                value={item.purchaseCount}
                max={maxItemCount}
                caption={`${item.purchaseCount} פעמים`}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Purchases by category */}
      {insights.categoryBreakdown.length > 0 && (
        <SectionCard title="קניות לפי קטגוריה" icon={<BarChart3 className="h-4 w-4" />}>
          <div className="space-y-3">
            {insights.categoryBreakdown.map((cat: CategoryInsight) => (
              <BarRow
                key={cat.categoryId}
                label={cat.name}
                emoji={cat.emoji}
                value={cat.purchaseCount}
                max={maxCategoryCount}
                caption={`${cat.purchaseCount}`}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Most regular staples */}
      {insights.mostRegular.length > 0 && (
        <SectionCard title="המצרכים הכי קבועים" icon={<Repeat className="h-4 w-4" />}>
          <div className="space-y-2">
            {insights.mostRegular.map((item: ItemInsight) => (
              <div
                key={`${item.categoryId}-${item.name}`}
                className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                  {item.categoryEmoji}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                  {item.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-[#FFA726]">
                  {formatInterval(item.expectedGapDays)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <p className="pb-2 text-center text-[11px] text-neutral-400">
        מבוסס על היסטוריית הקניות שלך
      </p>
    </motion.div>
  )
}
