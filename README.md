# 🎲 Game Night — Tabletop Scheduler

A shared availability calendar for tabletop game groups. Sign up with a username and password, then click days on the calendar to mark yourself as free. See in real time who else is available.

## Tech Stack
- **Next.js 14** (App Router) + **TypeScript**
- **Supabase** — auth (username-only) + Postgres database + real-time subscriptions
- **Tailwind CSS** with custom game-night color palette

---

## Supabase Setup (required before first run)

### 1. Disable email confirmation
Go to **Authentication → Settings** in your Supabase dashboard and turn off **"Enable email confirmations"**. The app uses synthetic emails (`username@gamenight.local`) internally; no real email is ever sent.

### 2. Run the database schema
Open the **SQL Editor** in your Supabase dashboard and paste + run the contents of [`supabase/schema.sql`](supabase/schema.sql).

This creates:
- `profiles` — maps auth users to their display usernames
- `availability` — one row per (user × date)

Both tables use Row Level Security (RLS) policies.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and add your Supabase credentials
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |

Both are safe to expose in client-side code — access is controlled by RLS policies.

---

## How it works

- **Auth**: Supabase auth with a synthetic email (`username@gamenight.local`) so users only ever see/type a username and password.
- **Calendar**: Monthly grid — click any day to toggle your availability on/off.
- **Real-time**: Supabase Postgres Change subscriptions keep every connected client in sync instantly.
- **Stats**: The bottom row shows your availability count, active players, and the top upcoming game nights for the month.
