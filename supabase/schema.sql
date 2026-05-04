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

-- ── Groups ────────────────────────────────────────────────────────────────
-- A group is identified only by its passphrase.
-- Knowing the passphrase is sufficient to join.
CREATE TABLE IF NOT EXISTS groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passphrase  TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select_all"   ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_auth"  ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── Group members ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_own"  ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "members_insert_own"  ON group_members FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_delete_own"  ON group_members FOR DELETE  USING (auth.uid() = user_id);

-- ── Availability ──────────────────────────────────────────────────────────
-- One row per (user, date, group).
-- UNIQUE changed to include group_id so a user can be free on the same day
-- in multiple groups independently.
CREATE TABLE IF NOT EXISTS availability (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  date       DATE NOT NULL,
  games      TEXT DEFAULT '',
  time_start TIME,
  time_end   TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, group_id, date)
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_select_all"  ON availability FOR SELECT  USING (true);
CREATE POLICY "availability_insert_own"  ON availability FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "availability_update_own"  ON availability FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "availability_delete_own"  ON availability FOR DELETE  USING (auth.uid() = user_id);

-- Enable real-time for availability
ALTER PUBLICATION supabase_realtime ADD TABLE availability;


-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION — run only if you already created the tables in a previous step
-- ════════════════════════════════════════════════════════════════════════════
--
-- Step 1: add missing columns to availability
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS games      TEXT DEFAULT '';
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS time_start TIME;
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS time_end   TIME;
-- ALTER TABLE availability ADD COLUMN IF NOT EXISTS group_id   UUID REFERENCES groups(id) ON DELETE CASCADE;
--
-- Step 2: fix the unique constraint (drops the old one, adds the new one)
-- ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_user_id_date_key;
-- ALTER TABLE availability ADD  CONSTRAINT availability_user_group_date UNIQUE (user_id, group_id, date);
--
-- Step 3: add missing policies
-- CREATE POLICY "availability_update_own" ON availability FOR UPDATE USING (auth.uid() = user_id);
--
-- Step 4: create the groups and group_members tables (above) if not done yet
-- ════════════════════════════════════════════════════════════════════════════
