'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const listId = uuidv4()
    router.replace(`/share/${listId}`)
  }, [router])

  return null
}

