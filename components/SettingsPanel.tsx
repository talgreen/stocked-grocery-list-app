'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { DEMO_LIST_ID, isDemoList } from '@/lib/demo'
import { motion } from 'framer-motion'
import { BarChart3, ChefHat, FlaskConical, Star, Store, X } from 'lucide-react'
import { useParams } from 'next/navigation'

interface SettingsPanelProps {
  onClose: () => void
}

interface FeatureToggleProps {
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: (value: boolean) => void
}

function FeatureToggle({ icon, title, description, enabled, onToggle }: FeatureToggleProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-black/5">
      <div className="flex-shrink-0 mt-0.5 text-[#FFB74D]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-black/80">{title}</h3>
          <button
            onClick={() => onToggle(!enabled)}
            dir="ltr"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${
              enabled ? 'bg-[#FFB74D]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                enabled ? 'translate-x-[22px]' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-black/50 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { flags, setFlag } = useSettings()
  const params = useParams()
  const inDemo = isDemoList(params?.listId as string | undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden flex flex-col w-full max-h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5 flex-shrink-0">
        <h2 className="text-base font-bold text-black/80">הגדרות</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-black/40" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto overscroll-contain">
      {/* Feature Flags */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-black/40 font-medium mb-2">תכונות ניסיוניות</p>

        <FeatureToggle
          icon={<ChefHat className="h-5 w-5" />}
          title="מתכונים"
          description="הוסף מתכונים עם מרכיבים שמתחברים לרשימת הקניות שלך"
          enabled={flags.enableRecipes}
          onToggle={(v) => setFlag('enableRecipes', v)}
        />

        <FeatureToggle
          icon={<Star className="h-5 w-5" />}
          title="פריטים נפוצים"
          description="סמן פריטים שנקנים הכי הרבה ומיין לפיהם בכל קטגוריה"
          enabled={flags.enableMostPurchased}
          onToggle={(v) => setFlag('enableMostPurchased', v)}
        />

        <FeatureToggle
          icon={<Store className="h-5 w-5" />}
          title="מצב קנייה"
          description="תצוגה ממוקדת לסופר: היכנס לכל קטגוריה וסמן פריטים בקלות"
          enabled={flags.enableShoppingMode}
          onToggle={(v) => setFlag('enableShoppingMode', v)}
        />

        <FeatureToggle
          icon={<BarChart3 className="h-5 w-5" />}
          title="תובנות"
          description="סטטיסטיקות על הרגלי הקנייה: הפריטים הנקנים ביותר, קניות לפי קטגוריה ומצרכים קבועים"
          enabled={flags.enableInsights}
          onToggle={(v) => setFlag('enableInsights', v)}
        />
      </div>

      {/* Demo / sandbox section */}
      <div className="border-t border-black/5 p-4 space-y-3">
        <p className="text-xs text-black/40 font-medium mb-2">מצב הדגמה</p>

        <p className="text-xs leading-relaxed text-black/50">
          נסה את כל התכונות עם נתוני דמה עשירים — בלי להשפיע על הרשימה האמיתית שלך. כל שינוי מתאפס בריענון.
        </p>

        <a
          href={`/share/${DEMO_LIST_ID}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFB74D] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-300/40 transition-colors hover:bg-[#FFA726]"
        >
          <FlaskConical className="h-4 w-4" />
          <span>{inDemo ? 'אתה במצב הדגמה' : 'פתח מצב הדגמה'}</span>
        </a>
      </div>
      </div>
    </motion.div>
  )
}
