-- ============================================================
-- Tabletop Game Night Scheduler — Supabase Schema
-- Run this in your Supabase SQL editor before using the app.
-- Also: Auth > Settings > disable "Enable email confirmations"
-- ============================================================

-- Profiles: maps auth.users → display username
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Availability: one row per (user, date)
CREATE TABLE IF NOT EXISTS availability (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username   TEXT NOT NULL,
  date       DATE NOT NULL,
  games      TEXT DEFAULT '',
  time_start TIME,
  time_end   TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_select_all"  ON availability FOR SELECT  USING (true);
CREATE POLICY "availability_insert_own"  ON availability FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "availability_update_own"  ON availability FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "availability_delete_own"  ON availability FOR DELETE  USING (auth.uid() = user_id);

-- ── If you already ran the schema above, run just this migration instead ──
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS games TEXT DEFAULT '';
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS time_start TIME;
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS time_end   TIME;
-- CREATE POLICY "availability_update_own" ON availability FOR UPDATE USING (auth.uid() = user_id);

-- Enable real-time for availability
ALTER PUBLICATION supabase_realtime ADD TABLE availability;
