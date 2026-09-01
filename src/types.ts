export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  difficulty: string;
  icon_name: string;
  sort_order: number;
  created_at: string;
}

export interface ActivityCompletion {
  id: string;
  user_id: string;
  activity_id: string;
  completed_at: string;
  duration_minutes: number | null;
  activity?: Activity;
}

export type GameType =
  | 'picture_recall'
  | 'sequence_memory'
  | 'object_association'
  | 'story_recall';

export type GameDifficulty = 'gentle' | 'moderate' | 'challenging';

export type GameCategory =
  | 'visual_recall'
  | 'sequential_memory'
  | 'verbal_association'
  | 'reading_comprehension';

export interface GameResult {
  game_type: GameType;
  score: number;
  accuracy: number;
  mistakes: number;
  response_time_ms: number;
  difficulty: GameDifficulty;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  game_category: GameCategory | null;
  score: number;
  accuracy: number;
  mistakes: number;
  response_time_ms: number;
  difficulty: GameDifficulty;
  created_at: string;
}
