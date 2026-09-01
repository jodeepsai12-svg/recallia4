/*
# Create game_sessions table for cognitive game results

## Purpose
Stores the results of every cognitive game a user plays — score, accuracy,
mistakes, response time, difficulty, game type, and timestamp.

## New Tables

### game_sessions
- `id` (uuid, primary key)
- `user_id` (uuid, not null, default auth.uid(), references auth.users on delete cascade)
- `game_type` (text, not null) — picture_recall | sequence_memory | object_association | story_recall
- `score` (int, not null, default 0)
- `accuracy` (numeric, not null, default 0) — percentage 0–100
- `mistakes` (int, not null, default 0)
- `response_time_ms` (int, not null, default 0)
- `difficulty` (text, not null, default 'gentle')
- `created_at` (timestamptz, not null, default now())

## Security
- RLS enabled with four owner-scoped CRUD policies using auth.uid() = user_id.
- user_id defaults to auth.uid() for safe client inserts.

## Important Notes
1. Idempotent — safe to re-run.
2. game_type is validated at the application layer.
*/

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  score int NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0,
  mistakes int NOT NULL DEFAULT 0,
  response_time_ms int NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'gentle',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_game_sessions" ON game_sessions;
CREATE POLICY "select_own_game_sessions" ON game_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_game_sessions" ON game_sessions;
CREATE POLICY "insert_own_game_sessions" ON game_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_game_sessions" ON game_sessions;
CREATE POLICY "update_own_game_sessions" ON game_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_game_sessions" ON game_sessions;
CREATE POLICY "delete_own_game_sessions" ON game_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);