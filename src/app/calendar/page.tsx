'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Calendar from '@/components/Calendar'

export default function CalendarPage() {
  const router   = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      setUser(session.user)

      // Fetch display username from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single()

      const name =
        profile?.username ||
        (session.user.user_metadata?.username as string | undefined) ||
        session.user.email?.split('@')[0] ||
        'Unknown'

      setUsername(name)
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login')
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-game-bg">
        <div className="flex items-center gap-3 text-game-text-dim animate-pulse">
          <span className="text-4xl">🎲</span>
          <span className="font-cinzel text-xl tracking-wide">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user || !username) return null

  return (
    <div className="calendar-bg">
      <Navbar username={username} onLogout={handleLogout} />
      <main className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <Calendar userId={user.id} username={username} />
      </main>
    </div>
  )
}
