'use client'

import { Category } from '@/types/categories'
import { Recipe, RecipeIngredient } from '@/types/recipe'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChefHat,
  ChevronDown,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const RECIPES_STORAGE_KEY = 'stocked-recipes'

function loadRecipes(listId: string): Recipe[] {
  try {
    const stored = localStorage.getItem(`${RECIPES_STORAGE_KEY}-${listId}`)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return []
}

function saveRecipes(listId: string, recipes: Recipe[]) {
  localStorage.setItem(`${RECIPES_STORAGE_KEY}-${listId}`, JSON.stringify(recipes))
}

interface RecipesTabProps {
  listId: string
  categories: Category[]
  onAddIngredients: (ingredients: Array<{ name: string; comment: string }>) => void
}

export default function RecipesTab({ listId, categories, onAddIngredients }: RecipesTabProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isAddingRecipe, setIsAddingRecipe] = useState(false)
  const [newRecipeName, setNewRecipeName] = useState('')
  const [newIngredientName, setNewIngredientName] = useState('')
  const [newIngredientComment, setNewIngredientComment] = useState('')
  const [pendingIngredients, setPendingIngredients] = useState<RecipeIngredient[]>([])
  const [expandedRecipes, setExpandedRecipes] = useState<number[]>([])

  useEffect(() => {
    setRecipes(loadRecipes(listId))
  }, [listId])

  const persist = (updated: Recipe[]) => {
    setRecipes(updated)
    saveRecipes(listId, updated)
  }

  const handleAddIngredient = () => {
    if (!newIngredientName.trim()) return
    setPendingIngredients(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newIngredientName.trim(),
        comment: newIngredientComment.trim() || undefined,
      },
    ])
    setNewIngredientName('')
    setNewIngredientComment('')
  }

  const handleRemovePendingIngredient = (id: number) => {
    setPendingIngredients(prev => prev.filter(i => i.id !== id))
  }

  const handleSaveRecipe = () => {
    if (!newRecipeName.trim()) {
      toast.error('יש להזין שם למתכון')
      return
    }
    if (pendingIngredients.length === 0) {
      toast.error('יש להוסיף לפחות מרכיב אחד')
      return
    }

    const recipe: Recipe = {
      id: Date.now(),
      name: newRecipeName.trim(),
      ingredients: pendingIngredients,
      createdAt: new Date().toISOString(),
    }

    persist([recipe, ...recipes])
    setNewRecipeName('')
    setPendingIngredients([])
    setIsAddingRecipe(false)
    toast.success(`המתכון "${recipe.name}" נוסף`)
  }

  const handleDeleteRecipe = (recipeId: number) => {
    persist(recipes.filter(r => r.id !== recipeId))
    toast.success('המתכון נמחק')
  }

  const handleAddToList = (recipe: Recipe) => {
    // Check which ingredients are already in the list
    const existingItems = new Set<string>()
    categories.forEach(cat =>
      cat.items.forEach(item => existingItems.add(item.name.trim().toLowerCase()))
    )

    const newIngredients = recipe.ingredients.filter(
      ing => !existingItems.has(ing.name.trim().toLowerCase())
    )

    if (newIngredients.length === 0) {
      toast.info('כל המרכיבים כבר ברשימה')
      return
    }

    onAddIngredients(
      newIngredients.map(ing => ({
        name: ing.name,
        comment: ing.comment || '',
      }))
    )

    // Mark ingredients as added
    const updated = recipes.map(r => {
      if (r.id !== recipe.id) return r
      return {
        ...r,
        ingredients: r.ingredients.map(ing => ({
          ...ing,
          addedToList: true,
        })),
      }
    })
    persist(updated)

    toast.success(`${newIngredients.length} מרכיבים נוספו לרשימה`)
  }

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    )
  }

  return (
    <div className="space-y-4">
      {/* Add Recipe Button */}
      {!isAddingRecipe && (
        <motion.button
          onClick={() => setIsAddingRecipe(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl border border-dashed border-[#FFB74D]/40 p-4 flex items-center justify-center gap-2 text-[#FFB74D] hover:bg-[#FFB74D]/5 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">מתכון חדש</span>
        </motion.button>
      )}

      {/* Add Recipe Form */}
      <AnimatePresence>
        {isAddingRecipe && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black/80 flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-[#FFB74D]" />
                  מתכון חדש
                </h3>
                <button
                  onClick={() => {
                    setIsAddingRecipe(false)
                    setNewRecipeName('')
                    setPendingIngredients([])
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4 text-black/40" />
                </button>
              </div>

              {/* Recipe name */}
              <input
                type="text"
                value={newRecipeName}
                onChange={e => setNewRecipeName(e.target.value)}
                placeholder="שם המתכון..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]"
                autoFocus
              />

              {/* Pending ingredients */}
              {pendingIngredients.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-black/40 font-medium">מרכיבים:</p>
                  {pendingIngredients.map(ing => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-black/70 truncate">{ing.name}</span>
                        {ing.comment && (
                          <span className="text-xs text-black/40 truncate">({ing.comment})</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePendingIngredient(ing.id)}
                        className="text-black/30 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add ingredient inputs */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIngredientName}
                    onChange={e => setNewIngredientName(e.target.value)}
                    placeholder="שם מרכיב..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddIngredient()
                    }}
                  />
                  <input
                    type="text"
                    value={newIngredientComment}
                    onChange={e => setNewIngredientComment(e.target.value)}
                    placeholder="כמות..."
                    className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/50 focus:border-[#FFB74D]"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddIngredient()
                    }}
                  />
                </div>
                <button
                  onClick={handleAddIngredient}
                  disabled={!newIngredientName.trim()}
                  className="w-full py-2.5 bg-[#FFB74D]/10 border border-[#FFB74D]/50 text-[#E6901E] rounded-xl text-sm font-semibold hover:bg-[#FFB74D]/20 disabled:opacity-30 disabled:hover:bg-[#FFB74D]/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  הוסף מרכיב
                </button>
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveRecipe}
                disabled={!newRecipeName.trim() || pendingIngredients.length === 0}
                className="w-full bg-[#F59E0B] text-white font-bold py-3 px-4 rounded-xl shadow-md disabled:bg-[#F59E0B]/40 transition-colors text-sm"
              >
                שמור מתכון
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe List */}
      {recipes.length > 0 ? (
        recipes.map(recipe => {
          const isExpanded = expandedRecipes.includes(recipe.id)
          return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm"
            >
              <button
                onClick={() => toggleRecipe(recipe.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-black/5 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <ChefHat className="h-5 w-5 text-[#FFB74D]" />
                  <h3 className="text-sm font-semibold text-black/80">{recipe.name}</h3>
                  <span className="text-xs text-black/40">
                    ({recipe.ingredients.length} מרכיבים)
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-black/40" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-black/5">
                      <ul className="divide-y divide-black/5">
                        {recipe.ingredients.map(ing => (
                          <li
                            key={ing.id}
                            className="px-4 py-2 flex items-center gap-3"
                          >
                            {ing.addedToList ? (
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 border border-gray-300 rounded flex-shrink-0" />
                            )}
                            <span className="text-sm text-black/70 flex-1 truncate">
                              {ing.name}
                            </span>
                            {ing.comment && (
                              <span className="text-xs text-black/40 truncate">
                                {ing.comment}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Action buttons */}
                      <div className="p-3 flex gap-2 border-t border-black/5">
                        <button
                          onClick={() => handleAddToList(recipe)}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#FFB74D]/10 hover:bg-[#FFB74D]/20 text-[#FFB74D] font-medium py-2 px-3 rounded-xl text-sm transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          הוסף לרשימה
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 py-2 px-3 rounded-xl text-sm transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })
      ) : (
        !isAddingRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm p-8 text-center"
          >
            <div className="text-4xl mb-4">👨‍🍳</div>
            <h3 className="text-lg font-semibold text-black/80 mb-2">אין מתכונים עדיין</h3>
            <p className="text-sm text-black/60">
              הוסיפו מתכון והמרכיבים שלו יתווספו ישירות לרשימת הקניות
            </p>
          </motion.div>
        )
      )}
    </div>
  )
}
