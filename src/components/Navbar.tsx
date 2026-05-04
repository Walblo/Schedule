'use client'

interface NavbarProps {
  username: string
  onLogout: () => void
}

export default function Navbar({ username, onLogout }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-[#191B1C]/90 backdrop-blur-md border-b border-[#2A2C2D]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A3020] border border-[#2D9D4B]/40
                          flex items-center justify-center text-xl select-none">
            🎲
          </div>
          <div>
            <h1 className="font-cinzel font-bold text-[#EDEFF0] text-base leading-none tracking-wide">
              Game Night
            </h1>
            <p className="text-[10px] text-[#595F61] tracking-widest uppercase leading-none mt-0.5">
              Tabletop Scheduler
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3BC45F] animate-pulse" />
            <span className="text-[#9BA3A8] text-sm">
              Playing as{' '}
              <span className="text-[#EDEFF0] font-medium">{username}</span>
            </span>
          </div>
          <button
            onClick={onLogout}
            className="btn-ghost text-xs sm:text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
