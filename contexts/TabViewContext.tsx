'use client'

import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

export type TabView = 'grocery' | 'pharmacy' | 'recipes' | 'purpose'

interface TabViewContextType {
  activeTab: TabView
  setActiveTab: (tab: TabView) => void
  // Which purpose list is selected when activeTab === 'purpose'
  activePurposeListId: string | null
  selectPurposeList: (id: string) => void
}

const TabViewContext = createContext<TabViewContextType | undefined>(undefined)

interface TabViewProviderProps {
  children: ReactNode
}

export function TabViewProvider({ children }: TabViewProviderProps) {
  const [activeTab, setActiveTabState] = useState<TabView>('grocery')
  const [activePurposeListId, setActivePurposeListId] = useState<string | null>(null)

  // Selecting any fixed tab clears the active purpose list selection.
  const setActiveTab = useCallback((tab: TabView) => {
    setActiveTabState(tab)
    if (tab !== 'purpose') {
      setActivePurposeListId(null)
    }
  }, [])

  // Switch to a specific purpose list tab.
  const selectPurposeList = useCallback((id: string) => {
    setActivePurposeListId(id)
    setActiveTabState('purpose')
  }, [])

  return (
    <TabViewContext.Provider value={{ activeTab, setActiveTab, activePurposeListId, selectPurposeList }}>
      {children}
    </TabViewContext.Provider>
  )
}

export function useTabView() {
  const context = useContext(TabViewContext)
  if (context === undefined) {
    throw new Error('useTabView must be used within a TabViewProvider')
  }
  return context
}
