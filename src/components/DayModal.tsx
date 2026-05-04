'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

export interface AvailEntry {
  user_id:  string
  username: string
  date:     string
  games:    string
}

interface DayModalProps {
  date:         Date
  entries:      AvailEntry[]   // all entries for this specific date
  userId:       string
  username:     string
  onClose:      () => void
  onDataChange: () => Promise<void>
}

export default function DayModal({
  date, entries, userId, username, onClose, onDataChange,
}: DayModalProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const myEntry = entries.find(e => e.user_id === userId)
  const isAvail = !!myEntry

  const [games,  setGames]  = useState(myEntry?.games ?? '')
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)
  const [saved,  setSaved]  = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync games text when myEntry changes (e.g. real-time update from another device)
  useEffect(() => {
    setGames(myEntry?.games ?? '')
    setDirty(false)
  }, [myEntry])

  // Escape key closes the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const toggleAvail = async () => {
    setSaving(true)
    if (isAvail) {
      await supabase.from('availability').delete()
        .eq('user_id', userId).eq('date', dateStr)
    } else {
      await supabase.from('availability')
        .insert({ user_id: userId, username, date: dateStr, games: '' })
    }
    await onDataChange()
    setSaving(false)
  }

  const saveGames = useCallback(async () => {
    if (!isAvail || !dirty) return
    setSaving(true)
    await supabase.from('availability')
      .update({ games })
      .eq('user_id', userId)
      .eq('date', dateStr)
    await onDataChange()
    setDirty(false)
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1800)
    setSaving(false)
  }, [isAvail, dirty, games, userId, dateStr, onDataChange])

  // Sort: current user first, then alphabetical
  const sorted = [...entries].sort((a, b) => {
    if (a.user_id === userId) return -1
    if (b.user_id === userId) return 1
    return a.username.localeCompare(b.username)
  })

  const dayOfWeek = format(date, 'EEEE')
  const fullDate  = format(date, 'MMMM d, yyyy')

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,11,12,0.72)', backdropFilter: 'blur(5px)' }}
    >
      <div className="modal-card w-full max-w-md bg-[#1C1E1F] border border-[#383B3D]
                      rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5
                        border-b border-[#2A2C2D] bg-[#191B1C]">
          <div>
            <h3 className="font-cinzel text-2xl font-bold text-[#EDEFF0] leading-tight">
              {dayOfWeek}
            </h3>
            <p className="text-[#9BA3A8] text-sm mt-0.5">{fullDate}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-lg
                       text-[#595F61] hover:text-[#EDEFF0] hover:bg-[#2A2C2D]
                       transition-all flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>

          {/* Your availability */}
          <section>
            <p className="text-[#595F61] text-[10px] uppercase tracking-widest mb-3 font-medium">
              Your Availability
            </p>
            <button
              onClick={toggleAvail}
              disabled={saving}
              className={[
                'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 border',
                saving ? 'opacity-60 cursor-wait' : '',
                isAvail
                  ? 'bg-[#172B1E] border-[#2D9D4B]/50 text-[#3BC45F] hover:bg-[#1D3424]'
                  : 'bg-transparent border-[#595F61] text-[#9BA3A8] hover:border-[#3BC45F]/60 hover:text-[#3BC45F]',
              ].join(' ')}
            >
              {saving
                ? '…'
                : isAvail
                  ? "✓  I'm free this day"
                  : '+  Mark myself as free'}
            </button>
          </section>

          {/* Games input — only when available */}
          {isAvail && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#595F61] text-[10px] uppercase tracking-widest font-medium">
                  Games You Want to Play
                </p>
                {saved && (
                  <span className="text-[#3BC45F] text-[10px] font-medium">Saved ✓</span>
                )}
              </div>
              <input
                type="text"
                value={games}
                onChange={e => { setGames(e.target.value); setDirty(true); setSaved(false) }}
                onBlur={saveGames}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="e.g. Catan, Wingspan, Ticket to Ride"
                className="input-field text-sm"
              />
              <p className="text-[#595F61] text-[10px] mt-1.5">
                Press Enter or click away to save
              </p>
            </section>
          )}

          {/* Divider */}
          <div className="h-px bg-[#2A2C2D]" />

          {/* Who's free */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[#595F61] text-[10px] uppercase tracking-widest font-medium">
                Who&apos;s Free
              </p>
              {entries.length > 0 && (
                <span className="bg-[#1A3020] text-[#3BC45F] text-[10px] font-semibold
                                 rounded-full px-2 py-0.5 border border-[#2D9D4B]/30">
                  {entries.length}
                </span>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3 opacity-40">🌙</div>
                <p className="text-[#595F61] text-sm">No one&apos;s free yet</p>
                <p className="text-[#383B3D] text-xs mt-1">
                  Be the first to mark yourself available!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map(entry => (
                  <div
                    key={entry.user_id}
                    className={[
                      'rounded-xl px-4 py-3 border transition-colors',
                      entry.user_id === userId
                        ? 'bg-[#172B1E] border-[#2D9D4B]/30'
                        : 'bg-[#191B1C] border-[#2A2C2D]',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3BC45F] flex-shrink-0" />
                      <span className={[
                        'text-sm font-medium',
                        entry.user_id === userId
                          ? 'text-[#3BC45F]'
                          : 'text-[#EDEFF0]',
                      ].join(' ')}>
                        {entry.username}
                      </span>
                      {entry.user_id === userId && (
                        <span className="text-[#595F61] text-xs">(you)</span>
                      )}
                    </div>

                    {entry.games ? (
                      <p className="text-[#9BA3A8] text-xs mt-1.5 pl-4 leading-relaxed">
                        <span className="text-[#595F61] mr-1">🎲</span>
                        {entry.games}
                      </p>
                    ) : (
                      <p className="text-[#383B3D] text-[11px] mt-1 pl-4 italic">
                        No games listed
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
