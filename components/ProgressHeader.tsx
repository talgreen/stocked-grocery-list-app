import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ProgressHeaderProps {
  uncheckedItems: number
  totalItems: number
  isAllExpanded: boolean
  onToggleAll: () => void
}

export default function ProgressHeader({ 
  uncheckedItems, 
  totalItems, 
  isAllExpanded, 
  onToggleAll 
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
          <button
            onClick={onToggleAll}
            className="bg-black/5 hover:bg-black/10 text-black/60 p-2 rounded-full transition-all duration-200"
          >
            {isAllExpanded ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </button>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-gray-200 [&>div]:bg-[#FFB74D]"
        />
      </div>
    </div>
  )
} 