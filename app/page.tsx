'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Resume the last opened list for returning users; otherwise mint a fresh one.
    let lastList: string | null = null
    try {
      lastList = localStorage.getItem('stocked-last-list')
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    const listId = lastList || uuidv4()
    router.replace(`/share/${listId}`)
  }, [router])

  return null
}

