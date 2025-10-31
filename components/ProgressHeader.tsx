import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface ProgressHeaderProps {
  uncheckedItems: number
  totalItems: number
  isAllExpanded: boolean
  onToggleAll: () => void
  showEmptyCategories: boolean
  onToggleEmptyCategories: () => void
  stapleCount?: number
  onBulkUncheckStaples?: () => void
  isBulkUncheckingStaples?: boolean
}

export default function ProgressHeader({
  uncheckedItems,
  totalItems,
  isAllExpanded,
  onToggleAll,
  showEmptyCategories,
  onToggleEmptyCategories,
  stapleCount,
  onBulkUncheckStaples,
  isBulkUncheckingStaples
}: ProgressHeaderProps) {
  const progressPercentage = totalItems > 0
    ? Math.round(((totalItems - uncheckedItems) / totalItems) * 100)
    : 0

  return (
    <div>
      <div className="max-w-2xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground font-medium">
            {uncheckedItems} מתוך {totalItems} פריטים נותרו
          </span>
          <div className="flex items-center gap-2">
            {onBulkUncheckStaples && typeof stapleCount === 'number' && (
              <button
                onClick={onBulkUncheckStaples}
                disabled={stapleCount === 0 || isBulkUncheckingStaples}
                className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                  stapleCount === 0 || isBulkUncheckingStaples
                    ? 'border-black/10 text-black/30 bg-black/5 cursor-not-allowed'
                    : 'border-[#FFB74D] text-[#E65100] bg-[#FFF3E0] hover:bg-[#FFE0B2]'
                }`}
                title={
                  isBulkUncheckingStaples
                    ? 'מעדכן את הרשימה'
                    : stapleCount === 0
                      ? 'אין כרגע פריטים קבועים לסימון'
                      : 'הסר סימון מפריטים שנקנו בקביעות'
                }
              >
                {isBulkUncheckingStaples
                  ? 'מעדכן...'
                  : stapleCount === 0
                    ? 'אין קבועים'
                    : `הסר קבועים (${stapleCount})`}
              </button>
            )}
            <button
              onClick={onToggleEmptyCategories}
              className="bg-black/5 hover:bg-black/10 text-black/60 p-2 rounded-full transition-all duration-200"
              title={showEmptyCategories ? "הסתר קטגוריות ריקות" : "הצג קטגוריות ריקות"}
            >
              {showEmptyCategories ? 
                <Eye className="h-4 w-4" /> : 
                <EyeOff className="h-4 w-4" />
              }
            </button>
            <button
              onClick={onToggleAll}
              className="bg-black/5 hover:bg-black/10 text-black/60 p-2 rounded-full transition-all duration-200"
              title={isAllExpanded ? "כווץ הכל" : "הרחב הכל"}
            >
              {isAllExpanded ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-gray-200 [&>div]:bg-[#FFB74D]"
        />
      </div>
    </div>
  )
} 