import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import GroceryItem from './GroceryItem'

interface Item {
  id: number
  name: string
  purchased: boolean
  comment?: string
  photo?: string
}

interface Category {
  id: number
  name: string
  items: Item[]
}

interface CategoryListProps {
  categories: Category[]
  onToggleItem: (categoryId: number, itemId: number) => void
  onDeleteItem: (categoryId: number, itemId: number) => void
  onEditItem: (categoryId: number, itemId: number, newComment: string) => void
  onCategoryChange: (categoryId: number) => void
}

export default function CategoryList({ categories, onToggleItem, onDeleteItem, onEditItem, onCategoryChange }: CategoryListProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>(categories.map(c => c.id))
  const prevItemsRef = useRef<{ [key: number]: number }>({})
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    const newExpandedCategories = [...expandedCategories]
    
    categories.forEach(category => {
      const prevItemCount = prevItemsRef.current[category.id] || 0
      const currentItemCount = category.items.length
      
      // If all items are checked, collapse the category
      const allChecked = category.items.length > 0 && category.items.every(item => item.purchased)
      
      // If new items were added, expand the category
      const itemsAdded = currentItemCount > prevItemCount
      
      if (allChecked && !itemsAdded) {
        const index = newExpandedCategories.indexOf(category.id)
        if (index !== -1) {
          newExpandedCategories.splice(index, 1)
        }
      } else if (itemsAdded) {
        if (!newExpandedCategories.includes(category.id)) {
          newExpandedCategories.push(category.id)
        }
      }
      
      // Update the previous items count
      prevItemsRef.current[category.id] = currentItemCount
    })
    
    setExpandedCategories(newExpandedCategories)
  }, [categories])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const uncheckedCount = category.items.filter(item => !item.purchased).length;
        const totalCount = category.items.length;
        const allChecked = totalCount > 0 && uncheckedCount === 0;
        const isExpanded = expandedCategories.includes(category.id);
        
        return (
          <motion.div
            key={category.id}
            id={`category-${category.id}`}
            ref={(el) => categoryRefs.current[category.id] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm
              ${allChecked ? 'bg-opacity-50' : ''}`}
          >
            <div className={`${allChecked ? 'bg-opacity-50' : ''}`}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-black/5 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{category.name.split(' ')[0]}</span>
                  <h2 className="text-base font-semibold text-black/80">{category.name.split(' ')[1]}</h2>
                  <span className="text-sm text-black/40 font-medium">
                    ({uncheckedCount}/{totalCount})
                  </span>
                  {allChecked && <Check className="h-4 w-4 text-[#FFB74D]" />}
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-black/40" />
                </motion.div>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.ul
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="py-2">
                    {category.items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GroceryItem
                          item={item}
                          onToggle={() => onToggleItem(category.id, item.id)}
                          onDelete={() => onDeleteItem(category.id, item.id)}
                          onEdit={(newComment) => onEditItem(category.id, item.id, newComment)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  )
}

