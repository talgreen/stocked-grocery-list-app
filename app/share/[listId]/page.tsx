'use client'

import HomeScreen from '@/components/HomeScreen'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TabViewProvider } from '@/contexts/TabViewContext'

export default function SharedListPage() {
  return (
    <SettingsProvider>
      <TabViewProvider>
        <HomeScreen />
      </TabViewProvider>
    </SettingsProvider>
  )
} 