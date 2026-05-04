'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import DayCell from './DayCell'
import DayModal, { type AvailEntry } from './DayModal'

interface CalendarProps {
  userId:   string
  username: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Calendar({ userId, username }: CalendarProps) {
  const [currentDate,   setCurrentDate]   = useState(new Date())
  const [availability,  setAvailability]  = useState<AvailEntry[]>([])
  const [fetching,      setFetching]      = useState(true)
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null)

  const monthStart   = startOfMonth(currentDate)
  const monthEnd     = endOfMonth(currentDate)
  const calStart     = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd       = endOfWeek(monthEnd,     { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const fetchAvailability = useCallback(async () => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const end   = format(endOfMonth(currentDate),   'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('availability')
      .select('user_id, username, date, games')
      .gte('date', start)
      .lte('date', end)
    if (!error && data) setAvailability(data as AvailEntry[])
    setFetching(false)
  }, [currentDate])

  useEffect(() => {
    setFetching(true)
    fetchAvailability()

    const channel = supabase
      .channel('avail-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'availability' },
        () => { fetchAvailability() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAvailability])

  // Returns all entries for a given date
  const entriesForDate = (date: Date): AvailEntry[] =>
    availability.filter(a => a.date === format(date, 'yyyy-MM-dd'))

  // Stats
  const dateCounts: Record<string, number> = {}
  availability.forEach(a => { dateCounts[a.date] = (dateCounts[a.date] ?? 0) + 1 })
  const topDays = Object.entries(dateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const myCount      = availability.filter(a => a.user_id === userId).length
  const uniquePlayers = new Set(availability.map(a => a.username)).size

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#EDEFF0] leading-none">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <p className="text-[#595F61] text-sm mt-1.5">
            Click any day to see details and toggle your availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(d => subMonths(d, 1))}
            aria-label="Previous month"
            className="p-2 rounded-lg border border-[#383B3D] hover:border-[#595F61]
                       text-[#9BA3A8] hover:text-[#EDEFF0] transition-all"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg border border-[#383B3D] hover:border-[#595F61]
                       text-[#9BA3A8] hover:text-[#EDEFF0] text-sm transition-all"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(d => addMonths(d, 1))}
            aria-label="Next month"
            className="p-2 rounded-lg border border-[#383B3D] hover:border-[#595F61]
                       text-[#9BA3A8] hover:text-[#EDEFF0] transition-all"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-[#1A1C1D]/80 border border-[#2A2C2D] rounded-2xl overflow-hidden
                      shadow-2xl shadow-black/60 backdrop-blur-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#2A2C2D] bg-[#191B1C]/60">
          {WEEKDAYS.map(day => (
            <div key={day}
              className="py-3 text-center text-[10px] sm:text-xs font-medium
                         text-[#595F61] uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {fetching ? (
          <div className="flex items-center justify-center h-64 text-[#595F61]">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-4 h-4 border-2 border-[#3BC45F] border-t-transparent
                              rounded-full animate-spin" />
              Loading availability…
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayEntries = entriesForDate(day)
              return (
                <DayCell
                  key={idx}
                  date={day}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  entries={dayEntries}
                  currentUserId={userId}
                  isToday={isToday(day)}
                  onClick={() => {
                    if (isSameMonth(day, currentDate)) setSelectedDate(day)
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1A1C1D]/70 border border-[#2A2C2D] rounded-xl p-4 backdrop-blur-sm">
          <p className="text-[#595F61] text-xs uppercase tracking-widest mb-1">Your availability</p>
          <p className="text-[#EDEFF0] text-2xl font-bold font-cinzel">
            {myCount}
            <span className="text-sm text-[#9BA3A8] font-normal ml-1">
              {myCount === 1 ? 'day' : 'days'} this month
            </span>
          </p>
        </div>

        <div className="bg-[#1A1C1D]/70 border border-[#2A2C2D] rounded-xl p-4 backdrop-blur-sm">
          <p className="text-[#595F61] text-xs uppercase tracking-widest mb-1">Players active</p>
          <p className="text-[#EDEFF0] text-2xl font-bold font-cinzel">
            {uniquePlayers}
            <span className="text-sm text-[#9BA3A8] font-normal ml-1">
              {uniquePlayers === 1 ? 'player' : 'players'} this month
            </span>
          </p>
        </div>

        <div className="bg-[#1A1C1D]/70 border border-[#2A2C2D] rounded-xl p-4 backdrop-blur-sm">
          <p className="text-[#595F61] text-xs uppercase tracking-widest mb-2">Best game nights</p>
          {topDays.length === 0 ? (
            <p className="text-[#595F61] text-sm">No availability yet</p>
          ) : (
            <div className="space-y-1">
              {topDays.map(([date, count]) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-[#9BA3A8] text-sm">
                    {format(new Date(date + 'T00:00:00'), 'MMM d')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-[#3BC45F] text-sm font-medium">{count}</span>
                    <span className="text-[#595F61] text-xs">
                      {count === 1 ? 'player' : 'players'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#595F61]">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#3BC45F]
                           text-[#05250D] text-[10px] font-bold">You</span>
          <span>You&apos;re available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1A3020]
                           text-[#4AF076] border border-[#2D9D4B]/35 text-[10px]">friend</span>
          <span>Another player is free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                           bg-[#C45F3B] text-white text-[10px] font-bold">7</span>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">🎲</span>
          <span>Games listed — click day to see</span>
        </div>
      </div>

      {/* ── Day detail modal ── */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          entries={entriesForDate(selectedDate)}
          userId={userId}
          username={username}
          onClose={() => setSelectedDate(null)}
          onDataChange={fetchAvailability}
        />
      )}
    </>
  )
}
