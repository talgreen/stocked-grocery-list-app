'use client'

import HomeScreen from '@/components/HomeScreen'
import { TabViewProvider } from '@/contexts/TabViewContext'

export default function SharedListPage() {
  return (
    <TabViewProvider>
      <HomeScreen />
    </TabViewProvider>
  )
} 