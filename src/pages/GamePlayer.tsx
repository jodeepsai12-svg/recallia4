import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, Target, AlertCircle, Timer, Trophy, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AudioButton } from '@/components/AudioButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getGame, type GameMeta } from '@/lib/games';
import { calculateRecommendedDifficulty, type DifficultyRecommendation } from '@/lib/difficultyEngine';
import { PictureRecall } from '@/games/PictureRecall';
import { SequenceMemory } from '@/games/SequenceMemory';
import { ObjectAssociation } from '@/games/ObjectAssociation';
import { StoryRecall } from '@/games/StoryRecall';
import type { GameType, GameResult, GameSession, GameDifficulty } from '@/types';

type Phase = 'start' | 'instructions' | 'playing' | 'result';

interface GamePlayerProps {
  gameType: GameType;
  onExit: () => void;
}

export function GamePlayer({ gameType, onExit }: GamePlayerProps) {
  const { user, signOut } = useAuth();
  const game = getGame(gameType)!;
  const [phase, setPhase] = useState<Phase>('start');
  const [result, setResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [diffRec, setDiffRec] = useState<DifficultyRecommendation | null>(null);

  const firstName = user?.email?.split('@')[0] ?? 'there';

  const instructions = getInstructions(gameType);

  // Load user's game sessions and calculate recommended difficulty
  useEffect(() => {
    const loadSessions = async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      const userSessions = (data ?? []) as GameSession[];
      setSessions(userSessions);
      setDiffRec(calculateRecommendedDifficulty(gameType, userSessions));
    };
    loadSessions();
  }, [gameType]);

  // Use the recommended difficulty (fallback to game default)
  const activeDifficulty: GameDifficulty = diffRec?.difficulty ?? game.difficulty;

  const handleStart = () => setPhase('instructions');
  const handleBeginGame = () => setPhase('playing');

  const handleGameComplete = useCallback(async (res: GameResult) => {
    setResult(res);
    setSaving(true);
    await supabase.from('game_sessions').insert({
      game_type: res.game_type,
      game_category: game.category,
      score: res.score,
      accuracy: res.accuracy,
      mistakes: res.mistakes,
      response_time_ms: res.response_time_ms,
      difficulty: res.difficulty,
    });
    setSaving(false);
    setPhase('result');
  }, [game.category]);

  const handlePlayAgain = () => {
    setResult(null);
    setPhase('instructions');
  };

  const handleNextActivity = () => {
    onExit();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const GameComponent = getGameComponent(gameType);

  // Trend icon for difficulty change
  const TrendIcon = diffRec?.trend === 'increase' ? TrendingUp
    : diffRec?.trend === 'decrease' ? TrendingDown
    : Minus;

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-teal-50 bg-sand-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Activities</span>
          </button>
          <Logo />
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-bold text-teal-600 transition-colors hover:bg-teal-50"
          >
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 md:py-12">
        {phase === 'start' && (
          <div className="animate-fade-in-up text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100">
              <game.icon className="h-10 w-10 text-teal-600" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-teal-900 md:text-4xl">
              {game.title}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-lg text-teal-600">
              {game.description}
            </p>

            <div className="mx-auto mt-6 flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                <Clock className="h-4 w-4" />
                {game.durationMinutes} minutes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold capitalize text-sand-500">
                {activeDifficulty}
              </span>
              {diffRec && diffRec.trend !== 'initial' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-600">
                  <TrendIcon className="h-4 w-4" />
                  {diffRec.trend === 'increase' ? 'Stepping up' : diffRec.trend === 'decrease' ? 'Easing back' : 'Steady'}
                </span>
              )}
            </div>

            {/* Why this difficulty explanation */}
            {diffRec && diffRec.trend !== 'initial' && (
              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-sand-100 px-5 py-4 text-left">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />
                  <p className="text-sm font-semibold text-teal-600">
                    {diffRec.reason}
                  </p>
                </div>
              </div>
            )}

            <button onClick={handleStart} className="btn-primary mt-8">
              Start
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {phase === 'instructions' && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-100">
                <game.icon className="h-8 w-8 text-teal-600" strokeWidth={2.5} />
              </div>
              <h2 className="font-display text-2xl font-semibold text-teal-900">
                How to play
              </h2>
            </div>

            <div className="card mx-auto max-w-2xl !p-8">
              <ul className="space-y-4">
                {instructions.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 font-display text-base font-bold text-white">
                      {i + 1}
                    </div>
                    <p className="pt-1 text-lg text-teal-700">{step}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl bg-sand-100 px-5 py-4">
                <p className="text-sm font-semibold text-teal-600">
                  {instructions.tip}
                </p>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <AudioButton text={instructions.audioText} />
                <button onClick={handleBeginGame} className="btn-primary">
                  Begin
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'playing' && GameComponent && (
          <div className="animate-fade-in">
            <GameComponent
              difficulty={activeDifficulty}
              onComplete={handleGameComplete}
            />
          </div>
        )}

        {phase === 'result' && result && (
          <div className="animate-fade-in-up text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
              <Trophy className="h-10 w-10 text-teal-600" strokeWidth={2.5} />
            </div>

            <h2 className="font-display text-3xl font-semibold text-teal-900">
              Well done, {firstName}!
            </h2>
            <p className="mt-2 text-lg text-teal-600">
              You completed {game.title}.
            </p>

            {/* Result stats */}
            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
                  <Trophy className="h-6 w-6 text-teal-600" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {result.score}
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">Score</p>
              </div>

              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
                  <Target className="h-6 w-6 text-teal-600" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {result.accuracy}%
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">Accuracy</p>
              </div>

              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100">
                  <AlertCircle className="h-6 w-6 text-coral-600" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {result.mistakes}
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">Mistakes</p>
              </div>

              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-200">
                  <Timer className="h-6 w-6 text-sand-500" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {(result.response_time_ms / 1000).toFixed(1)}s
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">Response time</p>
              </div>
            </div>

            {/* Difficulty tag */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold capitalize text-sand-500">
                {result.difficulty} level
              </span>
            </div>

            {saving && (
              <p className="mt-4 text-sm font-semibold text-teal-500">Saving your results...</p>
            )}

            {/* Next steps */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button onClick={handlePlayAgain} className="btn-secondary">
                Play again
              </button>
              <button onClick={handleNextActivity} className="btn-primary">
                Next activity
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getGameComponent(type: GameType) {
  switch (type) {
    case 'picture_recall':
      return PictureRecall;
    case 'sequence_memory':
      return SequenceMemory;
    case 'object_association':
      return ObjectAssociation;
    case 'story_recall':
      return StoryRecall;
    default:
      return null;
  }
}

function getInstructions(type: GameType) {
  switch (type) {
    case 'picture_recall':
      return {
        steps: [
          'You will see a few everyday objects on the screen.',
          'Take a moment to look at them and remember each one.',
          'The objects will be hidden. Then you will see a larger set of objects.',
          'Tap the ones you remember seeing. When you are done, press Done.',
        ],
        tip: 'There is no timer. Take as long as you need to look and choose.',
        audioText: 'You will see a few everyday objects. Look at them carefully and try to remember each one. Then the objects will be hidden and you will see a larger set. Tap the ones you remember seeing, and press Done when you are finished. Take your time, there is no timer.',
      };
    case 'sequence_memory':
      return {
        steps: [
          'You will see a set of colored tiles.',
          'Watch carefully as some tiles light up in a sequence.',
          'When it is your turn, tap the tiles in the same order they lit up.',
          'If you tap the wrong tile, do not worry — just keep going.',
        ],
        tip: 'Watch the full sequence before you start tapping. There is no time limit.',
        audioText: 'You will see colored tiles on the screen. Watch carefully as some tiles light up in a sequence. When it is your turn, tap the tiles in the same order they lit up. If you make a mistake, just keep going. Take your time.',
      };
    case 'object_association':
      return {
        steps: [
          'You will see a picture of an everyday object.',
          'Below it, you will see three answer choices.',
          'Tap the one that goes together with the picture.',
          'Answer each question at your own pace.',
        ],
        tip: 'Think about which items you would use together in daily life.',
        audioText: 'You will see a picture of an everyday object with a question. Below it are three answer choices. Tap the one that goes together with the picture. Answer each question at your own pace.',
      };
    case 'story_recall':
      return {
        steps: [
          'You will read a short, simple story.',
          'Take your time reading it. You can read it more than once.',
          'When you are ready, press the button to see the questions.',
          'Answer each question about the story by tapping your choice.',
        ],
        tip: 'Pay attention to names, colors, and the order of events in the story.',
        audioText: 'You will read a short, simple story. Take your time reading it. When you are ready, press the button to see the questions. Answer each question about the story by tapping your choice.',
      };
    default:
      return { steps: [], tip: '', audioText: '' };
  }
}
