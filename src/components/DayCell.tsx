'use client'

import { format } from 'date-fns'
import type { AvailEntry } from './DayModal'

interface DayCellProps {
  date:           Date
  isCurrentMonth: boolean
  entries:        AvailEntry[]   // all entries for this day
  currentUserId:  string
  isToday:        boolean
  onClick:        () => void
}

export default function DayCell({
  date,
  isCurrentMonth,
  entries,
  currentUserId,
  isToday,
  onClick,
}: DayCellProps) {
  const meEntry      = entries.find(e => e.user_id === currentUserId)
  const isMeIn       = !!meEntry
  const others       = entries.filter(e => e.user_id !== currentUserId)
  const visibleOthers = others.slice(0, 3)
  const hiddenCount  = others.length - visibleOthers.length
  const hasGames     = entries.some(e => e.games && e.games.trim().length > 0)

  return (
    <div
      onClick={isCurrentMonth ? onClick : undefined}
      className={[
        'cal-cell-border relative min-h-[100px] p-2 sm:p-3',
        'transition-colors duration-150 select-none',
        isCurrentMonth
          ? 'cursor-pointer hover:bg-[#1C1E20]'
          : 'opacity-30 cursor-default',
        isMeIn && isCurrentMonth
          ? 'bg-[#142019] ring-inset ring-1 ring-[#2D9D4B]/35'
          : '',
      ].join(' ')}
    >
      {/* Day number */}
      <div className={[
        'w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1',
        isToday
          ? 'bg-[#C45F3B] text-white'
          : isCurrentMonth
            ? 'text-[#EDEFF0]'
            : 'text-[#383B3D]',
      ].join(' ')}>
        {format(date, 'd')}
      </div>

      {/* Dice indicator — shown when any player listed games */}
      {hasGames && isCurrentMonth && (
        <div className="absolute top-2 right-2 text-[10px] opacity-50" title="Games listed">
          🎲
        </div>
      )}

      {/* Availability badges */}
      <div className="flex flex-col gap-1">
        {isMeIn && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold
                           bg-[#3BC45F] text-[#05250D]
                           rounded-full px-2 py-0.5 leading-tight w-fit">
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none" className="flex-shrink-0">
              <path d="M1 3.5L2.8 5.2L6 1.5" stroke="currentColor"
                    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            You
          </span>
        )}

        {visibleOthers.map(entry => (
          <span
            key={entry.user_id}
            className="inline-block text-[10px] bg-[#1A3020] text-[#4AF076]
                       border border-[#2D9D4B]/35 rounded-full px-2 py-0.5
                       leading-tight truncate max-w-full"
          >
            {entry.username}
          </span>
        ))}

        {hiddenCount > 0 && (
          <span className="text-[9px] text-[#595F61] pl-1">
            +{hiddenCount} more
          </span>
        )}
      </div>
    </div>
  )
}
