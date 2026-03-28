'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

interface FeatureFlags {
  enableRecipes: boolean
  enableMostPurchased: boolean
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableRecipes: false,
  enableMostPurchased: false,
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
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setFlags(loadFlags())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    }
  }, [flags, isHydrated])

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
