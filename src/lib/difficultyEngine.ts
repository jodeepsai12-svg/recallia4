import type { GameSession, GameDifficulty, GameCategory, GameType } from '@/types';
import { GAMES, getGame, type GameMeta } from '@/lib/games';

// ─── Difficulty ordering ───────────────────────────────────────────

const DIFFICULTY_ORDER: GameDifficulty[] = ['gentle', 'moderate', 'challenging'];

function difficultyRank(d: GameDifficulty): number {
  return DIFFICULTY_ORDER.indexOf(d);
}

function rankToDifficulty(rank: number): GameDifficulty {
  const clamped = Math.max(0, Math.min(DIFFICULTY_ORDER.length - 1, rank));
  return DIFFICULTY_ORDER[clamped];
}

// ─── Performance thresholds ─────────────────────────────────────────
//
// Accuracy and mistake count classify a single session into a performance band.
// These are intentionally conservative so difficulty changes are gradual.

const HIGH_ACCURACY = 85;        // % and above → high performance
const LOW_ACCURACY = 50;          // % and below → low performance
// Between 50 % and 85 % → medium performance

const MAX_MISTAKES_HIGH = 1;     // 0–1 mistakes with high accuracy → high
const MIN_MISTAKES_LOW = 4;      // 4+ mistakes → low

type PerformanceBand = 'high' | 'medium' | 'low';

function classifySession(session: GameSession): PerformanceBand {
  const { accuracy, mistakes } = session;

  if (accuracy >= HIGH_ACCURACY && mistakes <= MAX_MISTAKES_HIGH) return 'high';
  if (accuracy <= LOW_ACCURACY || mistakes >= MIN_MISTAKES_LOW) return 'low';
  return 'medium';
}

// ─── Core engine: recommended difficulty for a game type ─────────────
//
// Examines the user's recent history for a specific game type and decides
// whether to increase, maintain, or reduce difficulty.  Changes happen one
// step at a time — never jumping from gentle straight to challenging.

export interface DifficultyRecommendation {
  difficulty: GameDifficulty;
  previousDifficulty: GameDifficulty;
  trend: 'increase' | 'maintain' | 'decrease' | 'initial';
  reason: string;
}

export function calculateRecommendedDifficulty(
  gameType: GameType,
  sessions: GameSession[],
): DifficultyRecommendation {
  const game = getGame(gameType);
  if (!game) {
    return {
      difficulty: 'gentle',
      previousDifficulty: 'gentle',
      trend: 'initial',
      reason: 'Starting at a gentle level.',
    };
  }

  // Filter to sessions for this game type, most recent first
  const relevant = sessions
    .filter((s) => s.game_type === gameType)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // No history → start gentle
  if (relevant.length === 0) {
    return {
      difficulty: 'gentle',
      previousDifficulty: 'gentle',
      trend: 'initial',
      reason: `This is your first ${game.title} activity, so we are starting at a gentle level.`,
    };
  }

  const lastSession = relevant[0];
  const currentRank = difficultyRank(lastSession.difficulty);
  const previousDifficulty = lastSession.difficulty;

  // Look at the last 3 sessions for a stable signal
  const recent = relevant.slice(0, 3);
  const bands = recent.map(classifySession);
  const highCount = bands.filter((b) => b === 'high').length;
  const lowCount = bands.filter((b) => b === 'low').length;

  // Require at least 2 out of 3 sessions in a band to trigger a change.
  // This prevents abrupt shifts from a single good or bad session.
  let trend: 'increase' | 'maintain' | 'decrease';

  if (highCount >= 2) {
    trend = 'increase';
  } else if (lowCount >= 2) {
    trend = 'decrease';
  } else {
    trend = 'maintain';
  }

  let newRank = currentRank;
  if (trend === 'increase' && currentRank < DIFFICULTY_ORDER.length - 1) {
    newRank = currentRank + 1;
  } else if (trend === 'decrease' && currentRank > 0) {
    newRank = currentRank - 1;
  } else {
    trend = 'maintain';
  }

  const newDifficulty = rankToDifficulty(newRank);

  let reason: string;
  if (trend === 'increase') {
    reason = `You performed well in ${game.title} recently, so we selected a slightly more challenging activity.`;
  } else if (trend === 'decrease') {
    reason = `Your last few ${game.title} activities were a bit challenging, so we are easing back to a more comfortable level.`;
  } else {
    reason = `You are doing well at the ${previousDifficulty} level in ${game.title}, so we are keeping the same level.`;
  }

  return {
    difficulty: newDifficulty,
    previousDifficulty,
    trend,
    reason,
  };
}

// ─── Category analysis: which category needs more practice ───────────
//
// Compares average accuracy across categories the user has played.
// The category with the lowest average accuracy is the one that would
// benefit from more practice.  If the user has no history, returns null.

export interface CategoryAnalysis {
  category: GameCategory;
  categoryLabel: string;
  gameType: GameType;
  avgAccuracy: number;
  sessionCount: number;
  reason: string;
}

export function getWeakestCategory(sessions: GameSession[]): CategoryAnalysis | null {
  if (sessions.length === 0) return null;

  // Group sessions by game category
  const byCategory = new Map<GameCategory, GameSession[]>();

  for (const session of sessions) {
    const game = getGame(session.game_type);
    if (!game) continue;
    const cat = game.category;
    const existing = byCategory.get(cat) ?? [];
    existing.push(session);
    byCategory.set(cat, existing);
  }

  if (byCategory.size === 0) return null;

  // Calculate average accuracy per category
  let weakest: CategoryAnalysis | null = null;

  for (const [category, catSessions] of byCategory) {
    const game = getGame(catSessions[0].game_type);
    if (!game) continue;

    const avgAccuracy =
      catSessions.reduce((sum, s) => sum + s.accuracy, 0) / catSessions.length;

    const analysis: CategoryAnalysis = {
      category,
      categoryLabel: game.categoryLabel,
      gameType: game.type,
      avgAccuracy: Math.round(avgAccuracy),
      sessionCount: catSessions.length,
      reason: `You have had more difficulty with ${game.categoryLabel.toLowerCase()} activities, so a little extra practice here could help.`,
    };

    if (!weakest || analysis.avgAccuracy < weakest.avgAccuracy) {
      weakest = analysis;
    }
  }

  return weakest;
}

// ─── Top-level recommendation: which game to play and at what level ──
//
// Combines the difficulty engine and category analysis to recommend a
// specific game.  If the user has history, it prioritises the weakest
// category; otherwise it recommends the first game at gentle difficulty.

export interface GameRecommendation {
  gameType: GameType;
  game: GameMeta;
  difficulty: GameDifficulty;
  trend: 'increase' | 'maintain' | 'decrease' | 'initial';
  whyThisActivity: string;
  whyThisDifficulty: string;
}

export function getRecommendedGame(sessions: GameSession[]): GameRecommendation {
  // No history → recommend first game at gentle
  if (sessions.length === 0) {
    const game = GAMES[0];
    return {
      gameType: game.type,
      game,
      difficulty: 'gentle',
      trend: 'initial',
      whyThisActivity: `This is your first activity, so we recommend starting with ${game.title}.`,
      whyThisDifficulty: 'Starting at a gentle level.',
    };
  }

  // Find the weakest category
  const weakest = getWeakestCategory(sessions);

  // Determine which game to recommend
  let gameType: GameType;
  let whyThisActivity: string;

  if (weakest) {
    gameType = weakest.gameType;
    const game = getGame(gameType)!;
    whyThisActivity = weakest.reason;
  } else {
    gameType = GAMES[0].type;
    whyThisActivity = `This is a great activity to get started with.`;
  }

  const game = getGame(gameType)!;

  // Calculate the recommended difficulty for this game
  const diffRec = calculateRecommendedDifficulty(gameType, sessions);

  return {
    gameType,
    game,
    difficulty: diffRec.difficulty,
    trend: diffRec.trend,
    whyThisActivity,
    whyThisDifficulty: diffRec.reason,
  };
}
