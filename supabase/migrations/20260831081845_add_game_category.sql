/*
# Add game_category column to game_sessions

## Purpose
The adaptive difficulty engine needs to track which cognitive category each
game session belongs to, so it can identify which categories the user may benefit
from practicing more.

## Changes
- Adds `game_category` (text, nullable) to the `game_sessions` table.
  Values: visual_recall | sequential_memory | verbal_association | reading_comprehension

## Security
- No RLS policy changes needed — existing policies already cover the new column
  since they operate at the row level.

## Important Notes
1. Uses DO $$ ... END $$ to conditionally add the column only if it does not exist,
   making the migration idempotent.
2. Does NOT drop or modify any existing columns — no data loss risk.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'game_category'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN game_category text;
  END IF;
END $$;