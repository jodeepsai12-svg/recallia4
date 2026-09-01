import { useEffect, useState, useCallback, useRef } from 'react';
import { LogOut, Check, Clock, Sparkles, TrendingUp, Calendar, Brain, Gamepad2, ArrowRight, Info, TrendingDown, Minus, Globe, Settings, Users } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { EmergencyButton } from '@/components/EmergencyButton';
import { EmergencyModal } from '@/components/EmergencyModal';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';
import { supabase } from '@/lib/supabase';
import { getActivityIcon } from '@/lib/icons';
import { GAMES } from '@/lib/games';
import { getRecommendedGame, type GameRecommendation } from '@/lib/difficultyEngine';
import type { Activity, ActivityCompletion, GameType, GameSession } from '@/types';

interface DashboardProps {
  onPlayGame?: (gameType: GameType) => void;
  onOpenSettings?: () => void;
  onOpenCaregiver?: () => void;
}

export function Dashboard({ onPlayGame, onOpenSettings, onOpenCaregiver }: DashboardProps = {}) {
  const { user, signOut } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { announce } = useVoice();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completions, setCompletions] = useState<ActivityCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [recommendation, setRecommendation] = useState<GameRecommendation | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const announcedGreetingRef = useRef(false);

  const firstName = user?.email?.split('@')[0] ?? 'Friend';

  const today = new Date();
  const todayStr = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const greeting = (() => {
    const hour = today.getHours();
    if (hour < 12) return t.dashboard?.greetingMorning || 'Good morning';
    if (hour < 18) return t.dashboard?.greetingAfternoon || 'Good afternoon';
    return t.dashboard?.greetingEvening || 'Good evening';
  })();

  const loadData = useCallback(async () => {
    const [{ data: actData }, { data: compData }, { data: sessData }] = await Promise.all([
      supabase.from('activities').select('*').order('sort_order'),
      supabase
        .from('activity_completions')
        .select('*, activity:activities(*)')
        .order('completed_at', { ascending: false }),
      supabase
        .from('game_sessions')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    setActivities(actData ?? []);
    setCompletions((compData ?? []) as ActivityCompletion[]);
    const sessions = (sessData ?? []) as GameSession[];
    setGameSessions(sessions);
    setRecommendation(getRecommendedGame(sessions));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading && !announcedGreetingRef.current) {
      announcedGreetingRef.current = true;
      announce('welcome_home');
    }
  }, [loading, announce]);

  // Determine which activities were completed today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const completedTodayActivityIds = new Set(
    completions
      .filter((c) => new Date(c.completed_at) >= startOfToday)
      .map((c) => c.activity_id),
  );

  const todaysCompleted = completions.filter(
    (c) => new Date(c.completed_at) >= startOfToday,
  );

  // Recommended activity: first activity not yet completed today (by sort order)
  const recommendedActivity =
    activities.find((a) => !completedTodayActivityIds.has(a.id)) ?? activities[0];

  const totalActivities = activities.length || 4;
  const completedTodayCount = todaysCompleted.length;
  const progressPercent =
    totalActivities > 0
      ? Math.round((completedTodayCount / totalActivities) * 100)
      : 0;

  // Weekly streak: count distinct days in the last 7 days with at least one completion
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const activeDays = new Set(
    completions
      .filter((c) => new Date(c.completed_at) >= sevenDaysAgo)
      .map((c) => new Date(c.completed_at).toDateString()),
  );
  const weeklyActiveDays = activeDays.size;

  const handleMarkComplete = async () => {
    if (!recommendedActivity) return;
    setMarkingDone(true);
    await supabase.from('activity_completions').insert({
      activity_id: recommendedActivity.id,
    });
    setMarkingDone(false);
    announce('game_completed');
    loadData();
  };

  const handleSignOut = async () => {
    announce('signout_success');
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="text-center p-6">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-xl font-bold text-teal-800">
            {t.dashboard?.loadingActivities || 'Loading your activities...'}
          </p>
          <p className="mt-1 text-sm text-teal-600">Please relax while we prepare your session.</p>
        </div>
      </div>
    );
  }

  const RecommendedIcon = recommendedActivity
    ? getActivityIcon(recommendedActivity.icon_name)
    : Brain;

  const screenInstruction = recommendedActivity
    ? `${greeting}, ${firstName}. Today's recommended activity is ${recommendedActivity.title}.`
    : `${greeting}, ${firstName}. Welcome to Recallia.`;

  return (
    <div className="min-h-screen bg-sand-50 text-slate-800">
      {/* Top Header with Clear Text Buttons for Elderly Users */}
      <header className="sticky top-0 z-50 border-b border-teal-100 bg-sand-50/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Logo />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Discreet Emergency Assistance Button with clear text */}
            <EmergencyButton onTrigger={() => setShowEmergencyModal(true)} variant="header" />

            {/* Caregiver Portal Button with Clear Text */}
            {onOpenCaregiver && (
              <button
                onClick={onOpenCaregiver}
                className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-900 transition-colors hover:bg-teal-50 shadow-soft active:scale-95"
                title="Caregiver Portal"
              >
                <Users className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Caregiver View</span>
              </button>
            )}

            {/* Language Selector Button with Clear Text */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/80 px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-900 transition-colors hover:bg-teal-100 shadow-soft active:scale-95"
                title={t.dashboard?.changeLanguage || 'Change Language'}
              >
                <Globe className="h-4 w-4 text-teal-600 shrink-0" />
                <span className="max-w-[130px] truncate">{currentLanguageMeta.nativeName}</span>
                <Settings className="h-3.5 w-3.5 text-teal-500 hidden sm:inline" />
              </button>
            )}

            {/* Sign Out Button with Clear Text */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 shadow-soft active:scale-95"
              title={t.dashboard?.signOut || 'Sign out'}
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <span>{t.dashboard?.signOut || 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Voice Guide Bar */}
      <VoiceGuideControlBar currentScreenInstruction={screenInstruction} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {/* Warm Elderly-Friendly Greeting Card */}
        <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/90 via-white to-sand-100 p-6 sm:p-8 shadow-soft">
          <p className="text-sm sm:text-base font-bold text-teal-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" />
            <span>{todayStr}</span>
          </p>
          <h1 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-teal-950">
            {greeting}, {firstName}!
          </h1>
          <p className="mt-2 text-base sm:text-lg text-teal-800 leading-relaxed max-w-2xl font-medium">
            {t.dashboard?.greetingSubtitle || "Let's keep your mind active with simple, pleasant exercises today."}
          </p>
        </div>

        {/* Today's Recommended Cognitive Activity Card (High Contrast, Senior-Centric) */}
        <section className="animate-fade-in-up">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-coral-500" />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
                {t.dashboard?.todaysActivity || "Today's Recommended Activity"}
              </h2>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
              Daily Focus
            </span>
          </div>

          {recommendedActivity && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-teal-300 bg-white p-6 sm:p-8 shadow-soft-lg transition-all hover:border-teal-400">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-teal-100 text-teal-700 shadow-inner">
                  <RecommendedIcon className="h-10 w-10" strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-teal-950 leading-tight">
                    {recommendedActivity.title}
                  </h3>

                  <p className="mt-2 text-base sm:text-lg text-teal-800 leading-relaxed font-medium">
                    {recommendedActivity.description || 'A gentle memory and focus exercise designed to keep your mind sharp and relaxed.'}
                  </p>

                  {/* Clean, short metadata badges with clear words */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-teal-800 border border-teal-200">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span>{recommendedActivity.duration_minutes || 5} {t.dashboard?.minutes || 'Minutes'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-sand-100 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-sand-800 border border-sand-200">
                      <span>🌱 {t.difficulty?.gentle || 'Gentle Pace'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-coral-50 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-coral-800 border border-coral-200">
                      <span>🧠 {recommendedActivity.category || 'Memory'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Senior-Friendly Action Button */}
              <div className="mt-6 pt-5 border-t border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm font-semibold text-teal-700 text-center sm:text-left">
                  {t.dashboard?.recommendedNote || 'Recommended for your daily mental routine.'}
                </p>

                <button
                  onClick={() => {
                    const matchedGame = GAMES.find((g) => g.title.toLowerCase().includes(recommendedActivity.title.toLowerCase())) || GAMES[0];
                    if (onPlayGame) {
                      onPlayGame(matchedGame.type);
                    } else {
                      handleMarkComplete();
                    }
                  }}
                  disabled={markingDone}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-700 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-teal-800/20 transition-all hover:bg-teal-800 hover:scale-[1.02] active:scale-95"
                >
                  <Gamepad2 className="h-6 w-6" />
                  <span>
                    {markingDone
                      ? t.dashboard?.saving || 'Saving...'
                      : t.dashboard?.startActivity || 'Start This Activity'}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Today's Daily Progress (Concise, Reassuring, Clear Sentences) */}
        <section className="animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-teal-700" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
              {t.dashboard?.yourProgress || 'Your Daily Progress'}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Activities Completed */}
            <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-teal-700 uppercase tracking-wide">Completed</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Check className="h-5 w-5" strokeWidth={3} />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-teal-950">
                {completedTodayCount} of {totalActivities}
              </p>
              <p className="mt-1 text-sm font-medium text-teal-800">
                {completedTodayCount > 0
                  ? 'Activities done today. Wonderful job!'
                  : 'Start your first activity today.'}
              </p>
            </div>

            {/* Progress Percentage */}
            <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-teal-700 uppercase tracking-wide">Daily Goal</span>
                <span className="text-sm font-bold text-teal-900">{progressPercent}%</span>
              </div>
              <div className="my-2 h-4 w-full overflow-hidden rounded-full bg-teal-100">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm font-medium text-teal-800">
                {progressPercent >= 100
                  ? 'All daily exercises finished for today!'
                  : 'Keep going at your own comfortable pace.'}
              </p>
            </div>

            {/* Active Days Streak */}
            <div className="rounded-3xl border border-coral-100 bg-white p-6 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-coral-700 uppercase tracking-wide">Weekly Active</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-100 text-coral-700">
                  <Calendar className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-teal-950">
                {weeklyActiveDays} Days
              </p>
              <p className="mt-1 text-sm font-medium text-teal-800">
                Active this week. Consistency keeps your mind sharp.
              </p>
            </div>
          </div>
        </section>

        {/* Cognitive Games Grid — Senior Friendly with 1-Sentence Descriptions */}
        <section className="animate-fade-in-up">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-teal-700" />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
                {t.dashboard?.cognitiveActivities || 'Brain Exercises & Games'}
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-teal-700">
              Tap any game to play
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {GAMES.map((game, index) => {
              const gameSessionsForType = gameSessions.filter((s) => s.game_type === game.type);
              const hasHistory = gameSessionsForType.length > 0;
              const translatedTitle = t[game.type]?.title || game.title;
              const translatedTagline = t[game.type]?.tagline || game.tagline;

              return (
                <button
                  key={game.type}
                  onClick={() => onPlayGame?.(game.type)}
                  className="group flex flex-col justify-between rounded-3xl border border-teal-200/90 bg-white p-6 text-left shadow-soft transition-all hover:border-teal-400 hover:shadow-soft-lg active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <game.icon className="h-7 w-7" strokeWidth={2.5} />
                      </div>
                      <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-bold text-teal-900">
                        Game {index + 1}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-teal-950 group-hover:text-teal-700 transition-colors">
                      {translatedTitle}
                    </h3>

                    <p className="mt-2 text-base text-teal-800 leading-relaxed font-medium">
                      {translatedTagline}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-teal-700">
                    <span>
                      {hasHistory
                        ? `${gameSessionsForType.length} ${gameSessionsForType.length === 1 ? 'Session completed' : 'Sessions completed'}`
                        : 'Ready to play (5 mins)'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-teal-800 group-hover:translate-x-1 transition-transform">
                      Play Now <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Calming, Reassuring Disclaimer for Seniors & Families */}
        <div className="rounded-2xl border border-teal-100 bg-sand-100/90 px-6 py-4 text-center">
          <p className="text-sm font-semibold text-teal-900 leading-relaxed">
            {t.dashboard?.disclaimer || 'Recallia provides gentle daily exercises for mental wellness. Take your time, enjoy every moment, and practice at your own peaceful pace.'}
          </p>
        </div>
      </main>

      {/* Emergency Assistance Voice Memo Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />
    </div>
  );
}
