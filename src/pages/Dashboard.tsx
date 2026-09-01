import { useEffect, useState, useCallback } from 'react';
import { LogOut, Check, Clock, Sparkles, TrendingUp, Calendar, Brain, Gamepad2, ArrowRight, Info, TrendingDown, Minus } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getActivityIcon } from '@/lib/icons';
import { GAMES } from '@/lib/games';
import { getRecommendedGame, type GameRecommendation } from '@/lib/difficultyEngine';
import type { Activity, ActivityCompletion, GameType, GameSession, GameDifficulty } from '@/types';

interface DashboardProps {
  onPlayGame?: (gameType: GameType) => void;
}

export function Dashboard({ onPlayGame }: DashboardProps = {}) {
  const { user, signOut } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completions, setCompletions] = useState<ActivityCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [recommendation, setRecommendation] = useState<GameRecommendation | null>(null);

  const firstName = user?.email?.split('@')[0] ?? 'there';

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const greeting = (() => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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

  const totalActivities = activities.length;
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
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-lg font-semibold text-teal-600">Loading your activities...</p>
        </div>
      </div>
    );
  }

  const RecommendedIcon = recommendedActivity
    ? getActivityIcon(recommendedActivity.icon_name)
    : Brain;

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-teal-50 bg-sand-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo />
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-bold text-teal-600 transition-colors hover:bg-teal-50"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 md:py-12">
        {/* Greeting */}
        <div className="animate-fade-in-up">
          <p className="text-base font-bold text-teal-500">{todayStr}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-teal-900 md:text-4xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-lg text-teal-600">
            Here is your gentle cognitive activity for today.
          </p>
        </div>

        {/* Today's Cognitive Activity */}
        <section className="mt-8 animate-fade-in-up [animation-delay:100ms]">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-coral-500" />
            <h2 className="font-display text-xl font-semibold text-teal-900">
              Today's Cognitive Activity
            </h2>
          </div>

          {recommendedActivity && (
            <div className="card relative overflow-hidden border-2 border-teal-200 bg-white p-8 shadow-soft-lg">
              {/* Decorative accent */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-50" />

              <div className="relative">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
                  <RecommendedIcon className="h-8 w-8 text-teal-600" strokeWidth={2.5} />
                </div>

                <h3 className="font-display text-2xl font-semibold text-teal-900 md:text-3xl">
                  {recommendedActivity.title}
                </h3>

                <p className="mt-3 text-lg leading-relaxed text-teal-700">
                  {recommendedActivity.description}
                </p>

                {/* Meta tags */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                    <Clock className="h-4 w-4" />
                    {recommendedActivity.duration_minutes} minutes
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold capitalize text-sand-500">
                    {recommendedActivity.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-4 py-2 text-sm font-bold capitalize text-coral-600">
                    {recommendedActivity.category}
                  </span>
                </div>

                {/* Recommendation explanation */}
                <div className="mt-6 rounded-2xl bg-sand-100 px-5 py-4">
                  <p className="text-sm font-semibold text-teal-600">
                    Recommended based on your recent activity.
                  </p>
                </div>

                {/* CTA button */}
                <button
                  onClick={handleMarkComplete}
                  disabled={markingDone}
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  {markingDone ? (
                    'Saving...'
                  ) : completedTodayActivityIds.size > 0 &&
                    completedTodayActivityIds.has(recommendedActivity.id) ? (
                    <>
                      <Check className="h-6 w-6" strokeWidth={3} />
                      Done — try another
                    </>
                  ) : (
                    <>
                      {completedTodayCount > 0 ? 'Continue' : 'Start activity'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Progress summary */}
        <section className="mt-8 animate-fade-in-up [animation-delay:200ms]">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-xl font-semibold text-teal-900">
              Your Progress
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Today's progress */}
            <div className="card text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
                <Check className="h-7 w-7 text-teal-600" strokeWidth={3} />
              </div>
              <p className="font-display text-3xl font-bold text-teal-900">
                {completedTodayCount}
                <span className="text-lg font-semibold text-teal-400">
                  {' '}/ {totalActivities}
                </span>
              </p>
              <p className="mt-1 text-sm font-bold text-teal-600">Done today</p>
            </div>

            {/* Progress bar card */}
            <div className="card flex flex-col justify-center">
              <p className="mb-3 text-sm font-bold text-teal-600">Today's completion</p>
              <div className="h-6 w-full overflow-hidden rounded-full bg-teal-50">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-teal-900">
                {progressPercent}%
              </p>
            </div>

            {/* Weekly active days */}
            <div className="card text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-coral-100">
                <Calendar className="h-7 w-7 text-coral-600" strokeWidth={2.5} />
              </div>
              <p className="font-display text-3xl font-bold text-teal-900">
                {weeklyActiveDays}
              </p>
              <p className="mt-1 text-sm font-bold text-teal-600">Active days this week</p>
            </div>
          </div>
        </section>

        {/* Today's completed activities */}
        <section className="mt-8 animate-fade-in-up [animation-delay:300ms]">
          <div className="mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-xl font-semibold text-teal-900">
              Today's Completed Activities
            </h2>
          </div>

          {todaysCompleted.length === 0 ? (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100">
                <Sparkles className="h-8 w-8 text-sand-500" strokeWidth={2} />
              </div>
              <p className="text-lg font-bold text-teal-700">
                No activities completed yet today
              </p>
              <p className="mt-1 text-base text-teal-500">
                That is perfectly fine. Start whenever you feel ready.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysCompleted.map((completion) => {
                const activity = completion.activity;
                const Icon = activity ? getActivityIcon(activity.icon_name) : Brain;
                const time = new Date(completion.completed_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={completion.id}
                    className="card flex items-center gap-4 !py-4 transition-shadow hover:shadow-soft-lg"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
                      <Icon className="h-6 w-6 text-teal-600" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold text-teal-900">
                        {activity?.title ?? 'Activity'}
                      </p>
                      <p className="text-sm font-semibold text-teal-500">
                        Completed at {time}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Cognitive Activity */}
        {recommendation && (
          <section className="mt-10 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-coral-500" />
              <h2 className="font-display text-xl font-semibold text-teal-900">
                Recommended for You
              </h2>
            </div>

            <div className="card relative overflow-hidden border-2 border-teal-200 bg-white p-8 shadow-soft-lg">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-50" />
              <div className="relative">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
                  <recommendation.game.icon className="h-8 w-8 text-teal-600" strokeWidth={2.5} />
                </div>

                <h3 className="font-display text-2xl font-semibold text-teal-900">
                  {recommendation.game.title}
                </h3>

                <p className="mt-2 text-lg leading-relaxed text-teal-700">
                  {recommendation.game.description}
                </p>

                {/* Meta tags */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                    <Clock className="h-4 w-4" />
                    {recommendation.game.durationMinutes} minutes
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold capitalize text-sand-500">
                    {recommendation.difficulty}
                  </span>
                  {recommendation.trend !== 'initial' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-600">
                      {recommendation.trend === 'increase' ? <TrendingUp className="h-4 w-4" /> : recommendation.trend === 'decrease' ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      {recommendation.trend === 'increase' ? 'Stepping up' : recommendation.trend === 'decrease' ? 'Easing back' : 'Steady'}
                    </span>
                  )}
                </div>

                {/* Why this activity explanation */}
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-sand-100 px-5 py-4">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />
                      <p className="text-sm font-semibold text-teal-600">
                        {recommendation.whyThisActivity}
                      </p>
                    </div>
                  </div>
                  {recommendation.trend !== 'initial' && (
                    <div className="rounded-2xl bg-teal-50 px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />
                        <p className="text-sm font-semibold text-teal-600">
                          {recommendation.whyThisDifficulty}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onPlayGame?.(recommendation.gameType)}
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  Start activity
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Cognitive Activities — Game Center */}
        <section className="mt-10 animate-fade-in-up">
          <div className="mb-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-xl font-semibold text-teal-900">
              Cognitive Activities
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {GAMES.map((game) => {
              const gameSessionsForType = gameSessions.filter((s) => s.game_type === game.type);
              const lastSession = gameSessionsForType[0];
              const hasHistory = gameSessionsForType.length > 0;

              return (
                <button
                  key={game.type}
                  onClick={() => onPlayGame?.(game.type)}
                  className="card group flex items-center gap-4 !p-5 text-left transition-all hover:shadow-soft-lg active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
                    <game.icon className="h-7 w-7 text-teal-600" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-teal-900">
                      {game.title}
                    </p>
                    <p className="text-sm font-semibold text-teal-500">
                      {hasHistory
                        ? `${gameSessionsForType.length} ${gameSessionsForType.length === 1 ? 'session' : 'sessions'} · ${Math.round(gameSessionsForType.reduce((sum, s) => sum + s.accuracy, 0) / gameSessionsForType.length)}% avg`
                        : game.tagline
                      }
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-10 rounded-2xl bg-sand-100 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-teal-500">
            Recallia provides gentle cognitive activities for daily engagement.
            It does not diagnose dementia or measure medical cognitive decline.
          </p>
        </div>
      </main>
    </div>
  );
}
