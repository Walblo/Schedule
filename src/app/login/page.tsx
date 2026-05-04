'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, usernameToEmail } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/calendar')
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      })
      if (authError) {
        setError('Invalid username or password.')
      } else {
        router.push('/calendar')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-[#1A3020] border border-[#2D9D4B]/40 mb-4">
            <span className="text-3xl">🎲</span>
          </div>
          <h1 className="font-cinzel text-3xl font-bold text-game-text tracking-wide">Game Night</h1>
          <p className="text-game-text-dim text-sm mt-1">Your tabletop scheduling hub</p>
        </div>

        {/* Card */}
        <div className="bg-[#1C1E1F]/90 border border-[#383B3D] rounded-2xl p-8 shadow-2xl shadow-black/60
                        backdrop-blur-sm">
          <h2 className="font-cinzel text-xl font-bold text-game-text mb-6 tracking-wide">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-game-text-dim text-xs uppercase tracking-widest mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_username"
                required
                autoComplete="username"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-game-text-dim text-xs uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="input-field"
              />
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-4 py-3
                              text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="btn-primary"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-game-text-dim text-sm mt-6">
            No account?{' '}
            <Link href="/signup" className="text-game-green hover:text-[#4AF076] transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Divider line decoration */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#383B3D]/60" />
          <span className="text-[#595F61] text-xs">🎯 Click a day · Mark yourself free · Play</span>
          <div className="flex-1 h-px bg-[#383B3D]/60" />
        </div>
      </div>
    </div>
  )
}
