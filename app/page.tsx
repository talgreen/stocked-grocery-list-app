'use client'

import SparkleIcon from '@/components/SparkleIcon'
import { listTemplates } from '@/lib/templates'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface RecentList {
  id: string
  name: string
  lastOpened: string
  itemCount: number
}

export default function Home() {
  const router = useRouter()
  const [listName, setListName] = useState('')
  const [recentLists, setRecentLists] = useState<RecentList[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('stocked.recents')
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as RecentList[]
      setRecentLists(parsed)
    } catch (error) {
      console.error('Failed to parse recents', error)
    }
  }, [])

  const handleNavigateToList = (id: string, name: string, templateId?: string) => {
    const params = new URLSearchParams()
    const trimmedName = name.trim()
    if (trimmedName) {
      params.set('label', trimmedName)
    }
    if (templateId) {
      params.set('template', templateId)
    }

    if (typeof window !== 'undefined') {
      setRecentLists(prev => {
        const updated: RecentList[] = [
          {
            id,
            name: trimmedName || 'רשימת קניות חדשה',
            lastOpened: new Date().toISOString(),
            itemCount: 0
          },
          ...prev.filter(list => list.id !== id)
        ].slice(0, 10)

        localStorage.setItem('stocked.recents', JSON.stringify(updated))
        return updated
      })
    }

    router.push(`/share/${id}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleCreateList = (templateId?: string) => {
    const id = uuidv4()
    const name = listName.trim() || 'רשימת קניות חדשה'
    handleNavigateToList(id, name, templateId)
    setListName('')
  }

  const sortedRecents = useMemo(
    () =>
      [...recentLists].sort(
        (a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
      ),
    [recentLists]
  )

  return (
    <div className="min-h-screen bg-[#FDF6ED] text-right">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-3 bg-white border border-black/5 rounded-full px-4 py-2 shadow-sm">
            <span className="text-2xl font-semibold text-[#FFB74D]">Stocked</span>
            <SparkleIcon />
          </div>
          <h1 className="text-3xl font-bold text-black/80">התחילו רשימה משותפת בקלות</h1>
          <p className="text-black/60 max-w-xl">
            צרו רשימת קניות חדשה, בחרו תבנית מוכנה או המשיכו מאחת הרשימות האחרונות שלכם.
          </p>
        </header>

        <section className="bg-white rounded-3xl shadow-sm border border-black/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-black/80">רשימה חדשה</h2>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              type="text"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder="תנו שם לרשימה..."
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-[#FFB74D]/40"
            />
            <button
              onClick={() => handleCreateList()}
              className="bg-[#FFB74D] hover:bg-[#FFA726] text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              צור רשימה חדשה
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black/80">תבניות מוכנות</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {listTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-base font-semibold text-black/80">{template.title}</h3>
                  <p className="text-sm text-black/60 mt-1">{template.description}</p>
                </div>
                <button
                  onClick={() => handleCreateList(template.id)}
                  className="self-start bg-black/5 hover:bg-black/10 text-black/70 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  התחל מתבנית זו
                </button>
              </div>
            ))}
          </div>
        </section>

        {sortedRecents.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black/80">הרשימות האחרונות</h2>
              <span className="text-xs text-black/40">נשמרות מקומית במכשיר שלך</span>
            </div>
            <div className="bg-white border border-black/5 rounded-2xl divide-y divide-black/5 shadow-sm">
              {sortedRecents.map((list) => {
                const formattedDate = new Date(list.lastOpened).toLocaleString('he-IL', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })

                return (
                  <button
                    key={list.id}
                    onClick={() => handleNavigateToList(list.id, list.name)}
                    className="w-full text-right px-5 py-4 hover:bg-black/5 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-black/80">{list.name}</p>
                        <p className="text-xs text-black/50 mt-1">עודכנה לאחרונה: {formattedDate}</p>
                      </div>
                      <div className="text-xs text-black/50 bg-black/5 px-3 py-1 rounded-full self-start sm:self-auto">
                        {list.itemCount} פריטים ברשימה
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

