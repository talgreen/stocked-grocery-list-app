'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type TabView = 'grocery' | 'pharmacy'

interface TabViewContextType {
  activeTab: TabView
  setActiveTab: (tab: TabView) => void
}

const TabViewContext = createContext<TabViewContextType | undefined>(undefined)

interface TabViewProviderProps {
  children: ReactNode
}

export function TabViewProvider({ children }: TabViewProviderProps) {
  const [activeTab, setActiveTab] = useState<TabView>('grocery')

  return (
    <TabViewContext.Provider value={{ activeTab, setActiveTab }}>
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