'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Category } from '@/types/categories'
import { Sparkles } from 'lucide-react'
import { forwardRef } from 'react'

interface ItemFormFieldsProps {
  itemName: string
  onItemNameChange: (value: string) => void
  comment: string
  onCommentChange: (value: string) => void
  quantity: string
  onQuantityChange: (value: string) => void
  categoryId: string
  onCategoryChange: (value: string) => void
  categories: Category[]
  showCategorySelector: boolean
  showSmartOption?: boolean
  itemNameRef?: React.RefObject<HTMLInputElement>
}

const ItemFormFields = forwardRef<HTMLInputElement, ItemFormFieldsProps>(({
  itemName,
  onItemNameChange,
  comment,
  onCommentChange,
  quantity,
  onQuantityChange,
  categoryId,
  onCategoryChange,
  categories,
  showCategorySelector,
  showSmartOption = false,
}, ref) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Item Name + Category Row */}
      <div className="flex gap-2">
        {/* Item Name */}
        <input
          ref={ref}
          type="text"
          value={itemName}
          onChange={(e) => onItemNameChange(e.target.value)}
          className="flex-[2] bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-right text-sm transition-all"
          placeholder="שם הפריט"
          required
        />

        {/* Category */}
        {showCategorySelector && (
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger className="flex-1 flex-row-reverse justify-between items-center text-sm py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]">
              <SelectValue>
                {showSmartOption && categoryId === 'auto' ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#FFB74D]" />
                    <span className="text-xs">חכם</span>
                  </span>
                ) : (
                  <span className="text-sm">
                    {categories.find(c => c.id.toString() === categoryId)?.emoji}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {showSmartOption && (
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFB74D]" />
                    זיהוי חכם
                  </span>
                </SelectItem>
              )}
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.emoji} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Quantity + Comment Row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          className="flex-[2] bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-right text-sm transition-all"
          placeholder="הערה (אופציונלי)"
        />
        <input
          type="number"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          min="1"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D] px-3 py-2.5 text-center text-sm transition-all"
          placeholder="כמות"
        />
      </div>
    </div>
  )
})

ItemFormFields.displayName = 'ItemFormFields'

export default ItemFormFields
