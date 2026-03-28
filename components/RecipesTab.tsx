'use client'

import { Category } from '@/types/categories'
import { Item } from '@/types/item'
import { Recipe, RecipeIngredient } from '@/types/recipe'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  CheckSquare,
  ChefHat,
  ChevronDown,
  Plus,
  ShoppingCart,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

interface IngredientStatus {
  inList: boolean
  purchased: boolean
  categoryEmoji?: string
  categoryName?: string
  item?: Item
}

function findIngredientInList(
  ingredientName: string,
  categories: Category[]
): IngredientStatus {
  const normalized = ingredientName.trim().toLowerCase()
  for (const cat of categories) {
    for (const item of cat.items) {
      if (item.name.trim().toLowerCase() === normalized) {
        return {
          inList: true,
          purchased: item.purchased,
          categoryEmoji: cat.emoji,
          categoryName: cat.name,
          item,
        }
      }
    }
  }
  return { inList: false, purchased: false }
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

  // Build a lookup map for all ingredients across all recipes
  const ingredientStatusMap = useMemo(() => {
    const map = new Map<string, IngredientStatus>()
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const key = ing.name.trim().toLowerCase()
        if (!map.has(key)) {
          map.set(key, findIngredientInList(ing.name, categories))
        }
      }
    }
    return map
  }, [recipes, categories])

  const getIngredientStatus = (name: string): IngredientStatus => {
    return ingredientStatusMap.get(name.trim().toLowerCase()) || { inList: false, purchased: false }
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

  const handleAddSingleIngredient = (ing: RecipeIngredient) => {
    const status = getIngredientStatus(ing.name)
    if (status.inList) {
      toast.info(`"${ing.name}" כבר ברשימה`)
      return
    }
    onAddIngredients([{ name: ing.name, comment: ing.comment || '' }])
    toast.success(`"${ing.name}" נוסף לרשימה`)
  }

  const handleAddAllToList = (recipe: Recipe) => {
    const missing = recipe.ingredients.filter(ing => {
      const status = getIngredientStatus(ing.name)
      return !status.inList
    })

    if (missing.length === 0) {
      toast.info('כל המרכיבים כבר ברשימה')
      return
    }

    onAddIngredients(
      missing.map(ing => ({
        name: ing.name,
        comment: ing.comment || '',
      }))
    )

    toast.success(`${missing.length} מרכיבים נוספו לרשימה`)
  }

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    )
  }

  const getRecipeProgress = (recipe: Recipe) => {
    let inList = 0
    let purchased = 0
    for (const ing of recipe.ingredients) {
      const status = getIngredientStatus(ing.name)
      if (status.inList) {
        inList++
        if (status.purchased) purchased++
      }
    }
    return { inList, purchased, total: recipe.ingredients.length }
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
          const progress = getRecipeProgress(recipe)
          const allInList = progress.inList === progress.total
          const missingCount = progress.total - progress.inList

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
                <div className="flex items-center gap-3 min-w-0">
                  <ChefHat className="h-5 w-5 text-[#FFB74D] flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-black/80 truncate">{recipe.name}</h3>
                  {/* Progress indicator */}
                  <span className={`text-xs flex-shrink-0 ${
                    progress.purchased === progress.total && progress.total > 0
                      ? 'text-green-500'
                      : allInList
                        ? 'text-[#FFB74D]'
                        : 'text-black/40'
                  }`}>
                    {progress.purchased}/{progress.total}
                    {progress.purchased === progress.total && progress.total > 0 && (
                      <Check className="inline h-3 w-3 mr-0.5" />
                    )}
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
                        {recipe.ingredients.map(ing => {
                          const status = getIngredientStatus(ing.name)
                          return (
                            <li
                              key={ing.id}
                              className={`px-4 py-2.5 flex items-center gap-3 ${
                                status.purchased ? 'bg-black/[0.02]' : ''
                              }`}
                            >
                              {/* Status icon */}
                              {status.inList ? (
                                status.purchased ? (
                                  <CheckSquare className="h-4.5 w-4.5 text-[#FFB74D] flex-shrink-0" />
                                ) : (
                                  <Square className="h-4.5 w-4.5 text-black/25 flex-shrink-0" />
                                )
                              ) : (
                                <div className="h-4 w-4 border-2 border-dashed border-gray-300 rounded flex-shrink-0" />
                              )}

                              {/* Ingredient name and info */}
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className={`text-sm truncate ${
                                  status.purchased
                                    ? 'line-through text-black/35'
                                    : status.inList
                                      ? 'text-black/70'
                                      : 'text-black/50'
                                }`}>
                                  {ing.name}
                                </span>
                                {ing.comment && (
                                  <span className="text-xs text-black/35 truncate flex-shrink-0">
                                    {ing.comment}
                                  </span>
                                )}
                              </div>

                              {/* Category badge or add button */}
                              {status.inList ? (
                                <span className="text-xs bg-gray-100 text-black/50 px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                                  <span>{status.categoryEmoji}</span>
                                  <span className="hidden sm:inline">{status.categoryName}</span>
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddSingleIngredient(ing)
                                  }}
                                  className="text-[#FFB74D] hover:bg-[#FFB74D]/10 p-1 rounded-lg flex-shrink-0 transition-colors"
                                  title="הוסף לרשימה"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </li>
                          )
                        })}
                      </ul>

                      {/* Action buttons */}
                      <div className="p-3 flex gap-2 border-t border-black/5">
                        <button
                          onClick={() => handleAddAllToList(recipe)}
                          disabled={allInList}
                          className={`flex-1 flex items-center justify-center gap-2 font-medium py-2 px-3 rounded-xl text-sm transition-colors ${
                            allInList
                              ? 'bg-gray-100 text-black/30 cursor-default'
                              : 'bg-[#FFB74D]/10 hover:bg-[#FFB74D]/20 text-[#E6901E]'
                          }`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {allInList
                            ? 'הכל ברשימה'
                            : `הוסף ${missingCount} חסרים לרשימה`
                          }
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 py-2 px-3 rounded-xl text-sm transition-colors"
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
