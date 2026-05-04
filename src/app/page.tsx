'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/calendar' : '/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-game-bg">
      <div className="flex items-center gap-3 text-game-text-dim animate-pulse">
        <span className="text-4xl">🎲</span>
        <span className="font-cinzel text-xl tracking-wide">Loading…</span>
      </div>
    </div>
  )
}
