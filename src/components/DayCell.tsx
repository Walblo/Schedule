'use client'

import { format } from 'date-fns'

interface DayCellProps {
  date: Date
  isCurrentMonth: boolean
  availableUsers: string[]
  currentUsername: string
  isToday: boolean
  isToggling: boolean
  onToggle: () => void
}

export default function DayCell({
  date,
  isCurrentMonth,
  availableUsers,
  currentUsername,
  isToday,
  isToggling,
  onToggle,
}: DayCellProps) {
  const isMeAvailable  = availableUsers.includes(currentUsername)
  const others         = availableUsers.filter(u => u !== currentUsername)
  const visibleOthers  = others.slice(0, 4)
  const hiddenCount    = others.length - visibleOthers.length

  const handleClick = () => {
    if (isCurrentMonth && !isToggling) onToggle()
  }

  // Cell background
  let cellBg = 'bg-transparent'
  if (isCurrentMonth && isMeAvailable) cellBg = 'bg-[#142019]'

  // Hover only on current-month cells
  const hoverClass = isCurrentMonth
    ? isMeAvailable
      ? 'hover:bg-[#1A2B1F]'
      : 'hover:bg-[#1C1E1F]'
    : ''

  return (
    <div
      onClick={handleClick}
      className={[
        'cal-cell-border relative min-h-[100px] p-2 sm:p-3',
        'transition-colors duration-150 select-none',
        isCurrentMonth ? 'cursor-pointer' : 'opacity-35 cursor-default',
        cellBg,
        hoverClass,
        isToggling ? 'opacity-60' : '',
        isMeAvailable && isCurrentMonth
          ? 'ring-inset ring-1 ring-[#2D9D4B]/40'
          : '',
      ].join(' ')}
    >
      {/* Day number */}
      <div
        className={[
          'w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1',
          isToday
            ? 'bg-[#C45F3B] text-white'
            : isCurrentMonth
              ? 'text-[#EDEFF0]'
              : 'text-[#383B3D]',
        ].join(' ')}
      >
        {format(date, 'd')}
      </div>

      {/* Availability badges */}
      <div className="flex flex-col gap-1">
        {isMeAvailable && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold
                           bg-[#3BC45F] text-[#05250D]
                           rounded-full px-2 py-0.5 leading-tight w-fit">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0">
              <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            You
          </span>
        )}

        {visibleOthers.map(user => (
          <span
            key={user}
            className="inline-block text-[10px] bg-[#1A3020] text-[#4AF076]
                       border border-[#2D9D4B]/35 rounded-full px-2 py-0.5
                       leading-tight truncate max-w-full"
          >
            {user}
          </span>
        ))}

        {hiddenCount > 0 && (
          <span className="text-[9px] text-[#595F61] pl-1">
            +{hiddenCount} more
          </span>
        )}
      </div>

      {/* Toggling spinner */}
      {isToggling && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
          <div className="w-4 h-4 border-2 border-[#3BC45F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
