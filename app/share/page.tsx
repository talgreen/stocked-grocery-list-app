'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SharedList() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home if someone tries to access /share directly
    router.replace('/')
  }, [router])

  return null
}

