import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface ProgressHeaderProps {
  uncheckedItems: number
  totalItems: number
  isAllExpanded: boolean
  onToggleAll: () => void
  showEmptyCategories: boolean
  onToggleEmptyCategories: () => void
}

export default function ProgressHeader({ 
  uncheckedItems, 
  totalItems, 
  isAllExpanded, 
  onToggleAll,
  showEmptyCategories,
  onToggleEmptyCategories
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
          <div className="flex gap-2">
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