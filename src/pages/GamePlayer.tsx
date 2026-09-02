import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, Target, AlertCircle, Timer, Trophy, TrendingUp, TrendingDown, Minus, Info, Globe } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AudioButton } from '@/components/AudioButton';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';
import { sounds } from '@/lib/soundEffects';
import { saveGameSession, fetchGameSessions } from '@/lib/firebaseService';
import { getGame } from '@/lib/games';
import { calculateRecommendedDifficulty, type DifficultyRecommendation } from '@/lib/difficultyEngine';
import { PictureRecall } from '@/games/PictureRecall';
import { SequenceMemory } from '@/games/SequenceMemory';
import { ObjectAssociation } from '@/games/ObjectAssociation';
import { StoryRecall } from '@/games/StoryRecall';
import { MyMemoriesRecall } from '@/games/MyMemoriesRecall';
import type { GameType, GameResult, GameDifficulty } from '@/types';

type Phase = 'start' | 'instructions' | 'playing' | 'result';

interface GamePlayerProps {
  gameType: GameType;
  onExit: () => void;
  onOpenSettings?: () => void;
}

export function GamePlayer({ gameType, onExit, onOpenSettings }: GamePlayerProps) {
  const { user, signOut } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { announce, speak } = useVoice();
  const game = getGame(gameType)!;
  const [phase, setPhase] = useState<Phase>('start');
  const [result, setResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [diffRec, setDiffRec] = useState<DifficultyRecommendation | null>(null);

  const firstName = user?.email?.split('@')[0] ?? 'there';

  const gameTranslations = (t as Record<string, { title?: string; description?: string; instructions?: { steps: string[]; tip: string; audioText: string } } | undefined>)[gameType];
  const translatedTitle = gameTranslations?.title || game.title;
  const translatedDesc = gameTranslations?.description || game.description;

  const instructions = gameTranslations?.instructions || (gameType === 'my_memories' ? {
    steps: [
      'Look at the familiar memory card and optional photo.',
      'Read or listen to the short personal story.',
      'Choose the familiar person, place, or object from the options.',
      'Take all the time you need — there is no rush.',
    ],
    tip: 'Cherish familiar memories at your own comfortable pace.',
    audioText: 'Look at the personal memory card and choose the matching person, place, or object from the choices.',
  } : {
    steps: [],
    tip: '',
    audioText: '',
  });

  // Load user's game sessions and calculate recommended difficulty
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const userSessions = await fetchGameSessions(user?.uid || 'participant_mary');
        setDiffRec(calculateRecommendedDifficulty(gameType, userSessions));
      } catch (err) {
        console.warn('Could not load sessions for difficulty calibration:', err);
      }
    };
    loadSessions();
  }, [gameType, user?.uid]);

  // Use the recommended difficulty (fallback to game default)
  const activeDifficulty: GameDifficulty = diffRec?.difficulty ?? game.difficulty;

  const handleStart = () => {
    setPhase('instructions');
    if (instructions.audioText) {
      speak(instructions.audioText);
    }
  };
  const handleBeginGame = () => setPhase('playing');

  const handleGameComplete = useCallback(async (res: GameResult) => {
    setResult(res);
    setSaving(true);
    sounds.playSuccessChime();
    announce('game_completed');
    try {
      await saveGameSession({
        user_id: user?.uid,
        participant_id: user?.uid || 'participant_mary',
        game_type: res.game_type,
        game_category: game.category,
        score: res.score,
        accuracy: res.accuracy,
        mistakes: res.mistakes,
        response_time_ms: res.response_time_ms,
        difficulty: res.difficulty,
      });
    } catch (err) {
      console.warn('Error saving game session to Firestore:', err);
    }
    setSaving(false);
    setPhase('result');
  }, [announce, game.category, user?.uid]);

  const handlePlayAgain = () => {
    setResult(null);
    setPhase('instructions');
  };

  const handleNextActivity = () => {
    onExit();
  };

  const handleSignOut = async () => {
    announce('signout_success');
    await signOut();
  };

  const GameComponent = getGameComponent(gameType);

  // Trend icon for difficulty change
  const TrendIcon = diffRec?.trend === 'increase' ? TrendingUp
    : diffRec?.trend === 'decrease' ? TrendingDown
    : Minus;

  const currentInstruction = phase === 'start'
    ? `${translatedTitle}. ${translatedDesc}`
    : phase === 'instructions'
    ? `${t.gamePlayer.howToPlay}. ${instructions.audioText || instructions.steps.join('. ')}`
    : phase === 'result' && result
    ? `${t.gamePlayer.congratulations}, ${firstName}! Score: ${result.score}. Accuracy: ${result.accuracy} percent.`
    : undefined;

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
            <span className="hidden sm:inline">{t.gamePlayer.backToActivities}</span>
          </button>
          <Logo />
          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50/70 px-2.5 py-1.5 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 sm:text-sm sm:px-3 sm:py-2"
                title="Change language"
              >
                <Globe className="h-4 w-4 text-teal-600" />
                <span className="hidden xs:inline sm:inline">{currentLanguageMeta.nativeName}</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-bold text-teal-600 transition-colors hover:bg-teal-50"
            >
              <span className="hidden sm:inline">{t.dashboard.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Voice Guide Control Bar */}
      <VoiceGuideControlBar currentScreenInstruction={currentInstruction} />

      <main className="mx-auto max-w-4xl px-6 py-8 md:py-12">
        {phase === 'start' && (
          <div className="animate-fade-in-up text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100">
              <game.icon className="h-10 w-10 text-teal-600" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-teal-900 md:text-4xl">
              {translatedTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-lg text-teal-600">
              {translatedDesc}
            </p>

            <div className="mx-auto mt-6 flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                <Clock className="h-4 w-4" />
                {game.durationMinutes} {t.dashboard.minutes}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold capitalize text-sand-500">
                {t.difficulty[activeDifficulty] || activeDifficulty}
              </span>
              {diffRec && diffRec.trend !== 'initial' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-600">
                  <TrendIcon className="h-4 w-4" />
                  {diffRec.trend === 'increase' ? t.difficulty.steppingUp : diffRec.trend === 'decrease' ? t.difficulty.easingBack : t.difficulty.steady}
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
              {t.gamePlayer.start}
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
                {t.gamePlayer.howToPlay}
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

              {instructions.tip && (
                <div className="mt-6 rounded-2xl bg-sand-100 px-5 py-4">
                  <p className="text-sm font-semibold text-teal-600">
                    {instructions.tip}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {instructions.audioText && (
                  <AudioButton text={instructions.audioText} />
                )}
                <button onClick={handleBeginGame} className="btn-primary">
                  {t.gamePlayer.begin}
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
              {t.gamePlayer.wellDone}, {firstName}!
            </h2>
            <p className="mt-2 text-lg text-teal-600">
              {t.gamePlayer.youCompleted} {translatedTitle}.
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
                <p className="mt-1 text-sm font-bold text-teal-600">{t.gamePlayer.score}</p>
              </div>

              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
                  <Target className="h-6 w-6 text-teal-600" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {result.accuracy}%
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">{t.gamePlayer.accuracy}</p>
              </div>

              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100">
                  <AlertCircle className="h-6 w-6 text-coral-600" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {result.mistakes}
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">{t.gamePlayer.mistakes}</p>
              </div>

              <div className="card">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-200">
                  <Timer className="h-6 w-6 text-sand-500" strokeWidth={2.5} />
                </div>
                <p className="font-display text-3xl font-bold text-teal-900">
                  {(result.response_time_ms / 1000).toFixed(1)}s
                </p>
                <p className="mt-1 text-sm font-bold text-teal-600">{t.gamePlayer.responseTime}</p>
              </div>
            </div>

            {/* Difficulty tag */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold capitalize text-sand-500">
                {t.difficulty[result.difficulty] || result.difficulty} {t.gamePlayer.level}
              </span>
            </div>

            {saving && (
              <p className="mt-4 text-sm font-semibold text-teal-500">{t.gamePlayer.savingResults}</p>
            )}

            {/* Next steps */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button onClick={handlePlayAgain} className="btn-secondary">
                {t.gamePlayer.playAgain}
              </button>
              <button onClick={handleNextActivity} className="btn-primary">
                {t.gamePlayer.nextActivity}
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
    case 'my_memories':
      return MyMemoriesRecall;
    default:
      return null;
  }
}
