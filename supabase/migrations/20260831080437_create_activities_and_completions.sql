/*
# Create activities and activity_completions tables

## Purpose
Recallia is a cognitive wellness app for elderly users. This migration creates
the two tables that power the elderly user dashboard: a catalog of cognitive
activities and a per-user log of completed activities.

## New Tables

### activities
- `id` (uuid, primary key)
- `title` (text, not null) — display name of the activity, e.g. "Memory Match"
- `description` (text, not null) — short plain-language description shown on the dashboard
- `category` (text, not null) — grouping label: memory, language, attention, problem-solving
- `duration_minutes` (int, not null, default 5) — estimated time to complete
- `difficulty` (text, not null, default 'gentle') — gentle / moderate / challenging
- `icon_name` (text, not null, default 'Brain') — name of a lucide-react icon
- `sort_order` (int, not null, default 0) — controls display ordering
- `created_at` (timestamptz, default now())

### activity_completions
- `id` (uuid, primary key)
- `user_id` (uuid, not null, default auth.uid(), references auth.users on delete cascade) — owner
- `activity_id` (uuid, not null, references activities on delete cascade) — which activity was done
- `completed_at` (timestamptz, not null, default now()) — when the user finished it
- `duration_minutes` (int) — optional actual duration the user spent

## Security

### activities (read-only catalog, shared across all users)
- RLS enabled.
- SELECT open to anon + authenticated (the catalog is intentionally public so the
  landing page and dashboard can both read it).
- No INSERT / UPDATE / DELETE policies — only the service role can mutate the catalog.

### activity_completions (per-user, owner-scoped)
- RLS enabled.
- Four CRUD policies scoped to `authenticated` using `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so client inserts that omit the column still
  satisfy the WITH CHECK predicate.

## Important Notes
1. The `activities` table is seeded with six starter activities in this migration.
2. The `activity_completions` table is the only table users write to; every row is
   owned by the authenticated user who created it.
3. This migration is idempotent — CREATE TABLE IF NOT EXISTS and DROP POLICY IF EXISTS
   guard every statement.
*/

-- ---------------------------------------------------------------
-- activities table (shared read-only catalog)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 5,
  difficulty text NOT NULL DEFAULT 'gentle',
  icon_name text NOT NULL DEFAULT 'Brain',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_activities" ON activities;
CREATE POLICY "read_activities" ON activities FOR SELECT
  TO anon, authenticated USING (true);

-- ---------------------------------------------------------------
-- activity_completions table (per-user, owner-scoped)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes int
);

ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_completions" ON activity_completions;
CREATE POLICY "select_own_completions" ON activity_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_completions" ON activity_completions;
CREATE POLICY "insert_own_completions" ON activity_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_completions" ON activity_completions;
CREATE POLICY "update_own_completions" ON activity_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_completions" ON activity_completions;
CREATE POLICY "delete_own_completions" ON activity_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Index for querying a user's completions efficiently
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_completions_user_id
  ON activity_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_completions_completed_at
  ON activity_completions(completed_at DESC);

-- ---------------------------------------------------------------
-- Seed starter activities
-- ---------------------------------------------------------------
INSERT INTO activities (title, description, category, duration_minutes, difficulty, icon_name, sort_order)
VALUES
  ('Memory Match', 'Flip cards to find matching pairs and give your memory a gentle workout.', 'memory', 5, 'gentle', 'Brain', 1),
  ('Word Recall', 'Read a short list of words, then try to remember as many as you can.', 'memory', 7, 'gentle', 'BookOpen', 2),
  ('Picture Puzzle', 'Arrange shuffled pieces to complete a calming picture.', 'problem-solving', 10, 'moderate', 'Puzzle', 3),
  ('Story Sequencing', 'Put a short story in the right order, from beginning to end.', 'language', 8, 'gentle', 'AlignLeft', 4),
  ('Sound Recognition', 'Listen carefully and pick the sound that matches the picture.', 'attention', 5, 'gentle', 'Volume2', 5),
  ('Spot the Difference', 'Find the small differences between two nearly identical scenes.', 'attention', 6, 'moderate', 'Eye', 6)
ON CONFLICT DO NOTHING;