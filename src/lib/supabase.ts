import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

/** Converts a display username to the synthetic email used for Supabase auth */
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@gamenight.local`
}

/** Validates a username: 3–20 chars, alphanumeric + underscore + hyphen */
export function validateUsername(username: string): string | null {
  if (username.length < 3)  return 'Username must be at least 3 characters'
  if (username.length > 20) return 'Username must be 20 characters or fewer'
  if (!/^[a-zA-Z0-9_-]+$/.test(username))
    return 'Only letters, numbers, underscores, and hyphens are allowed'
  return null
}
