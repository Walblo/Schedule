'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { generatePassphrase, normalizePassphrase } from '@/lib/wordlist'

export interface Group {
  id:         string
  passphrase: string
}

interface GroupSelectorProps {
  userId:          string
  groups:          Group[]
  currentGroupId:  string | null
  onSelectGroup:   (id: string) => void
  onGroupsChange:  () => Promise<void>
}

export default function GroupSelector({
  userId,
  groups,
  currentGroupId,
  onSelectGroup,
  onGroupsChange,
}: GroupSelectorProps) {
  const [showPanel,    setShowPanel]    = useState(groups.length === 0)
  const [generated,    setGenerated]    = useState('')
  const [friendPhrase, setFriendPhrase] = useState('')
  const [joining,      setJoining]      = useState(false)
  const [error,        setError]        = useState('')
  const [copied,       setCopied]       = useState(false)

  const refreshPhrase = useCallback(() => setGenerated(generatePassphrase()), [])

  useEffect(() => { refreshPhrase() }, [refreshPhrase])

  // ── Shared join-or-create logic ──────────────────────────────────────────
  const joinOrCreate = async (raw: string) => {
    const phrase = normalizePassphrase(raw)
    if (!phrase) { setError('Enter a passphrase first.'); return }
    if (phrase.split(' ').length !== 3) {
      setError('Passphrase must be three words.')
      return
    }
    setJoining(true)
    setError('')

    // Find or create the group
    let groupId: string | null = null

    const { data: existing } = await supabase
      .from('groups')
      .select('id')
      .eq('passphrase', phrase)
      .maybeSingle()

    if (existing) {
      groupId = existing.id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('groups')
        .insert({ passphrase: phrase })
        .select('id')
        .single()
      if (createErr || !created) {
        setError('Could not create group. Try again.')
        setJoining(false)
        return
      }
      groupId = created.id
    }

    // Join the group (upsert is safe if already a member)
    const { error: joinErr } = await supabase
      .from('group_members')
      .upsert({ group_id: groupId, user_id: userId }, { onConflict: 'group_id,user_id' })

    if (joinErr) {
      setError('Could not join group. Try again.')
      setJoining(false)
      return
    }

    await onGroupsChange()
    onSelectGroup(groupId!)
    setShowPanel(false)
    setFriendPhrase('')
    setJoining(false)
  }

  const leaveGroup = async (groupId: string) => {
    if (!window.confirm('Leave this group? Your availability entries for this group will be deleted.')) return
    await supabase.from('availability').delete()
      .eq('user_id', userId).eq('group_id', groupId)
    await supabase.from('group_members').delete()
      .eq('group_id', groupId).eq('user_id', userId)
    await onGroupsChange()
    // Switch to another group if available
    const remaining = groups.filter(g => g.id !== groupId)
    if (remaining.length > 0) onSelectGroup(remaining[0].id)
  }

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(generated)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available — silently ignore
    }
  }

  return (
    <div className="mb-6">
      {/* ── Tab strip ── */}
      <div className="flex items-end gap-0.5 border-b border-[#2A2C2D] overflow-x-auto">
        {groups.map(g => {
          const isActive = g.id === currentGroupId
          return (
            <div key={g.id} className="flex items-end flex-shrink-0">
              <button
                onClick={() => { onSelectGroup(g.id); setShowPanel(false) }}
                className={[
                  'flex items-center gap-2 px-3 py-2.5 text-xs font-mono rounded-t-lg',
                  'border-b-2 whitespace-nowrap transition-all duration-150',
                  isActive
                    ? 'text-[#3BC45F] border-[#3BC45F] bg-[#172B1E]/50'
                    : 'text-[#9BA3A8] border-transparent hover:text-[#EDEFF0] hover:border-[#595F61]',
                ].join(' ')}
              >
                {g.passphrase}
              </button>
              {/* Leave button */}
              <button
                onClick={() => leaveGroup(g.id)}
                title="Leave group"
                className="mb-2 -ml-1 text-[#595F61] hover:text-[#914529] text-xs px-1 transition-colors"
              >
                ×
              </button>
            </div>
          )
        })}

        {/* Add group tab */}
        <button
          onClick={() => setShowPanel(p => !p)}
          className={[
            'flex items-center gap-1.5 px-3 py-2.5 text-xs rounded-t-lg',
            'border-b-2 whitespace-nowrap transition-all duration-150 flex-shrink-0',
            showPanel
              ? 'text-[#3BC45F] border-[#3BC45F] bg-[#1A1C1D]'
              : 'text-[#595F61] border-transparent hover:text-[#9BA3A8] hover:border-[#595F61]',
          ].join(' ')}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {groups.length === 0 ? 'Join or Create Group' : 'Add Group'}
        </button>
      </div>

      {/* ── No groups prompt ── */}
      {groups.length === 0 && !showPanel && (
        <div className="py-16 text-center">
          <div className="text-4xl mb-3 opacity-30">🔑</div>
          <p className="text-[#9BA3A8] text-sm">Join or create a group to start scheduling.</p>
          <button onClick={() => setShowPanel(true)}
            className="mt-4 text-[#3BC45F] text-sm hover:underline">
            Get started
          </button>
        </div>
      )}

      {/* ── Panel ── */}
      {showPanel && (
        <div className="border border-[#2A2C2D] border-t-0 rounded-b-xl bg-[#1A1C1D]/90
                        backdrop-blur-sm p-5 space-y-5">

          {/* Generate section */}
          <div>
            <p className="text-[#595F61] text-[10px] uppercase tracking-widest mb-2 font-medium">
              Create a new group
            </p>
            <p className="text-[#9BA3A8] text-xs mb-3">
              Share this passphrase with friends so they can join the same calendar.
            </p>

            {/* Passphrase display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#141516] border border-[#595F61] rounded-lg
                              px-4 py-3 font-mono text-[#EDEFF0] text-sm tracking-wide
                              select-all">
                {generated}
              </div>
              <button
                onClick={refreshPhrase}
                title="Generate new passphrase"
                className="p-3 rounded-lg border border-[#383B3D] text-[#9BA3A8]
                           hover:border-[#595F61] hover:text-[#EDEFF0] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7A5 5 0 1 0 7 2" stroke="currentColor"
                        strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M2 3.5V7H5.5" stroke="currentColor"
                        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={copyPhrase}
                className="text-xs text-[#9BA3A8] hover:text-[#3BC45F] transition-colors"
              >
                {copied ? '✓ Copied!' : '⧉ Copy passphrase'}
              </button>
            </div>

            <button
              onClick={() => joinOrCreate(generated)}
              disabled={joining}
              className="mt-3 w-full bg-[#2D9D4B] hover:bg-[#3BC45F] active:bg-[#1F7436]
                         text-white font-semibold rounded-lg py-2.5 text-sm
                         transition-all duration-200 disabled:opacity-50"
            >
              {joining ? 'Creating…' : 'Create & Use This Group'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2A2C2D]" />
            <span className="text-[#595F61] text-xs">or</span>
            <div className="flex-1 h-px bg-[#2A2C2D]" />
          </div>

          {/* Friend's passphrase */}
          <div>
            <p className="text-[#595F61] text-[10px] uppercase tracking-widest mb-2 font-medium">
              Enter a friend&apos;s passphrase
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={friendPhrase}
                onChange={e => { setFriendPhrase(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') joinOrCreate(friendPhrase) }}
                placeholder="purple sheep sleeps"
                className="input-field text-sm font-mono flex-1"
                spellCheck={false}
                autoCapitalize="none"
              />
              <button
                onClick={() => joinOrCreate(friendPhrase)}
                disabled={joining || !friendPhrase.trim()}
                className="px-4 py-3 bg-[#1F4028] hover:bg-[#2D9D4B] text-[#3BC45F]
                           hover:text-white border border-[#2D9D4B]/40 rounded-lg text-sm
                           font-semibold transition-all duration-200 disabled:opacity-40
                           whitespace-nowrap"
              >
                Join
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
