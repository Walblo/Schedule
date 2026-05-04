'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Calendar from '@/components/Calendar'
import GroupSelector, { type Group } from '@/components/GroupSelector'

export default function CalendarPage() {
  const router = useRouter()

  const [user,           setUser]           = useState<User | null>(null)
  const [username,       setUsername]       = useState('')
  const [groups,         setGroups]         = useState<Group[]>([])
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)
  const [loading,        setLoading]        = useState(true)

  const fetchGroups = useCallback(async (uid: string) => {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', uid)

    const ids = (memberships ?? []).map(m => m.group_id as string)
    if (ids.length === 0) { setGroups([]); return [] }

    const { data: groupData } = await supabase
      .from('groups')
      .select('id, passphrase')
      .in('id', ids)

    const parsed: Group[] = (groupData ?? []) as Group[]
    setGroups(parsed)
    return parsed
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const uid = session.user.id
      setUser(session.user)

      const { data: profile } = await supabase
        .from('profiles').select('username').eq('id', uid).single()

      const name =
        profile?.username ||
        (session.user.user_metadata?.username as string | undefined) ||
        session.user.email?.split('@')[0] || 'Unknown'
      setUsername(name)

      const loaded = await fetchGroups(uid)
      if (loaded.length > 0) setCurrentGroupId(loaded[0].id)

      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router, fetchGroups])

  const handleGroupsChange = useCallback(async () => {
    if (!user) return
    await fetchGroups(user.id)
  }, [user, fetchGroups])

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
        <GroupSelector
          userId={user.id}
          groups={groups}
          currentGroupId={currentGroupId}
          onSelectGroup={id => setCurrentGroupId(id)}
          onGroupsChange={handleGroupsChange}
        />

        {currentGroupId && (
          <Calendar
            userId={user.id}
            username={username}
            groupId={currentGroupId}
          />
        )}
      </main>
    </div>
  )
}
