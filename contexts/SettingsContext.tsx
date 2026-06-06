'use client'

import { isDemoList } from '@/lib/demo'
import { useParams } from 'next/navigation'
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

interface FeatureFlags {
  enableRecipes: boolean
  enableMostPurchased: boolean
  enableShoppingMode: boolean
  enableInsights: boolean
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableRecipes: false,
  enableMostPurchased: false,
  enableShoppingMode: false,
  enableInsights: false,
}

// In the demo/sandbox list every experimental feature is on by default so a
// tester sees everything at once (toggles still work for checking the gating).
const ALL_FLAGS_ENABLED: FeatureFlags = {
  enableRecipes: true,
  enableMostPurchased: true,
  enableShoppingMode: true,
  enableInsights: true,
}

interface SettingsContextType {
  flags: FeatureFlags
  setFlag: (key: keyof FeatureFlags, value: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'stocked-feature-flags'

function loadFlags(): FeatureFlags {
  if (typeof window === 'undefined') return DEFAULT_FLAGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_FLAGS, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_FLAGS
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const params = useParams()
  const isDemo = isDemoList(params?.listId as string | undefined)
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setFlags(isDemo ? ALL_FLAGS_ENABLED : loadFlags())
    setIsHydrated(true)
  }, [isDemo])

  useEffect(() => {
    // Never persist demo overrides onto the user's real settings.
    if (isHydrated && !isDemo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    }
  }, [flags, isHydrated, isDemo])

  const setFlag = useCallback((key: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <SettingsContext.Provider value={{ flags, setFlag }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
