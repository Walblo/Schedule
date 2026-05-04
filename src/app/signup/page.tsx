'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, usernameToEmail, validateUsername } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/calendar')
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const usernameError = validateUsername(username)
    if (usernameError)   { setError(usernameError); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const email = usernameToEmail(username)

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })

      if (signupError) {
        if (signupError.message.toLowerCase().includes('already registered')) {
          setError('That username is already taken.')
        } else {
          setError(signupError.message)
        }
        return
      }

      if (!data.session) {
        setError(
          'Account created but email confirmation is required. ' +
          'Please disable "Enable email confirmations" in your Supabase Auth settings, then try again.'
        )
        return
      }

      // Persist display username in profiles
      await supabase.from('profiles').insert({ id: data.user!.id, username })

      router.push('/calendar')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const usernameHint = validateUsername(username)

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
          <p className="text-game-text-dim text-sm mt-1">Join your crew on the calendar</p>
        </div>

        {/* Card */}
        <div className="bg-[#1C1E1F]/90 border border-[#383B3D] rounded-2xl p-8 shadow-2xl shadow-black/60
                        backdrop-blur-sm">
          <h2 className="font-cinzel text-xl font-bold text-game-text mb-6 tracking-wide">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-game-text-dim text-xs uppercase tracking-widest mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="adventurer_42"
                required
                maxLength={20}
                autoComplete="username"
                className="input-field"
              />
              {username && usernameHint && (
                <p className="text-[#914529] text-xs mt-1.5">{usernameHint}</p>
              )}
              {username && !usernameHint && (
                <p className="text-game-green text-xs mt-1.5">✓ Username looks good</p>
              )}
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
                minLength={6}
                autoComplete="new-password"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-game-text-dim text-xs uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="input-field"
              />
              {confirm && password !== confirm && (
                <p className="text-[#914529] text-xs mt-1.5">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-4 py-3
                              text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!usernameHint || !username || !password || password !== confirm}
              className="btn-primary"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-game-text-dim text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-game-green hover:text-[#4AF076] transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
