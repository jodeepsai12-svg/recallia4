import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LogOut,
  Check,
  Clock,
  Sparkles,
  Calendar,
  Gamepad2,
  ArrowRight,
  Globe,
  Users,
  Settings,
  Brain,
  TrendingUp,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Heart,
  Sun,
  Droplets,
  Coffee,
  Wind,
  Volume2,
  Award,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { EmergencyButton } from '@/components/EmergencyButton';
import { EmergencyModal } from '@/components/EmergencyModal';
import { PeacefulBreathingModal } from '@/components/PeacefulBreathingModal';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';
import {
  fetchGameSessions,
  saveGameSession,
  generateCaregiverLinkingCode,
} from '@/lib/firebaseService';
import { getActivityIcon } from '@/lib/icons';
import { GAMES } from '@/lib/games';
import type { Activity, GameType, GameSession } from '@/types';

interface DashboardProps {
  onPlayGame?: (gameType: GameType) => void;
  onOpenSettings?: () => void;
  onOpenCaregiver?: () => void;
}

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    title: 'Picture Recall',
    description: 'A gentle memory exercise looking at pleasant familiar objects.',
    category: 'Memory',
    duration_minutes: 5,
    difficulty: 'gentle',
    icon_name: 'Eye',
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act_2',
    title: 'Sequence Memory',
    description: 'Watch gentle patterns and repeat them at your own comfortable pace.',
    category: 'Focus',
    duration_minutes: 4,
    difficulty: 'gentle',
    icon_name: 'Brain',
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act_3',
    title: 'Object Association',
    description: 'Pair everyday objects that naturally go together.',
    category: 'Language',
    duration_minutes: 5,
    difficulty: 'gentle',
    icon_name: 'Link2',
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act_4',
    title: 'Story Recall',
    description: 'Enjoy a short comforting story and answer simple questions.',
    category: 'Comprehension',
    duration_minutes: 6,
    difficulty: 'gentle',
    icon_name: 'BookOpen',
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
];

export function Dashboard({ onPlayGame, onOpenSettings, onOpenCaregiver }: DashboardProps = {}) {
  const { user, userProfile, signOut } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { announce, speak } = useVoice();
  const [activities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [linkingCode, setLinkingCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const announcedGreetingRef = useRef(false);

  const firstName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Friend';

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
    setLoading(true);
    try {
      const sessions = await fetchGameSessions(user?.uid || 'participant_mary');
      setGameSessions(sessions);

      // Handle caregiver linking code
      if (userProfile?.caregiver?.linkingCode) {
        setLinkingCode(userProfile.caregiver.linkingCode);
      } else if (user?.uid) {
        const code = await generateCaregiverLinkingCode(
          user.uid,
          firstName,
          userProfile?.caregiver?.phoneNumber || ''
        );
        setLinkingCode(code);
      }
    } catch (err) {
      console.warn('Error loading dashboard data from Firestore:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, userProfile?.caregiver?.linkingCode, userProfile?.caregiver?.phoneNumber, firstName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading && !announcedGreetingRef.current) {
      announcedGreetingRef.current = true;
      announce('welcome_home');
    }
  }, [loading, announce]);

  // Determine which activities were completed today from gameSessions
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todaysCompletedSessions = gameSessions.filter(
    (s) => new Date(s.created_at) >= startOfToday
  );

  const completedTodayGameTypes = new Set(
    todaysCompletedSessions.map((s) => s.game_type)
  );

  // Recommended activity: first activity not yet completed today (by sort order)
  const recommendedActivity =
    activities.find((a) => {
      const matchedGame = GAMES.find((g) => g.title.toLowerCase().includes(a.title.toLowerCase()));
      return matchedGame ? !completedTodayGameTypes.has(matchedGame.type) : true;
    }) ?? activities[0];

  const totalActivities = activities.length || 4;
  const completedTodayCount = Math.min(todaysCompletedSessions.length, totalActivities);
  const progressPercent =
    totalActivities > 0
      ? Math.round((completedTodayCount / totalActivities) * 100)
      : 0;

  // Weekly streak: count distinct days in the last 7 days with at least one completion
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const activeDays = new Set(
    gameSessions
      .filter((s) => new Date(s.created_at) >= sevenDaysAgo)
      .map((s) => new Date(s.created_at).toDateString())
  );
  const weeklyActiveDays = Math.max(activeDays.size, todaysCompletedSessions.length > 0 ? 1 : 0);

  const handleCopyCode = () => {
    if (!linkingCode) return;
    navigator.clipboard.writeText(linkingCode);
    setCopiedCode(true);
    speak(`Copied linking code ${linkingCode} to clipboard.`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleMarkComplete = async () => {
    if (!recommendedActivity) return;
    setMarkingDone(true);
    try {
      const matchedGame = GAMES.find((g) => g.title.toLowerCase().includes(recommendedActivity.title.toLowerCase())) || GAMES[0];
      await saveGameSession({
        user_id: user?.uid,
        participant_id: user?.uid || 'participant_mary',
        game_type: matchedGame.type,
        game_category: matchedGame.category,
        score: 100,
        accuracy: 100,
        mistakes: 0,
        response_time_ms: 3200,
        difficulty: 'gentle',
      });
      announce('game_completed');
      await loadData();
    } catch (err) {
      console.warn('Error saving activity completion:', err);
    } finally {
      setMarkingDone(false);
    }
  };

  const handleSignOut = async () => {
    announce('signout_success');
    await signOut();
  };

  const formatSessionTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return 'Earlier today';
    }
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
        {/* Warm Elderly-Friendly Greeting Card & Today's Comfort Corner */}
        <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/90 via-white to-sand-100 p-6 sm:p-8 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
            {/* Left side: Greeting & Personal Welcome */}
            <div className="lg:col-span-2">
              <p className="text-xs sm:text-sm font-bold text-teal-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span>{todayStr}</span>
              </p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-teal-950">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-teal-800 font-medium">
                Take your time today.
              </p>
            </div>

            {/* Right side: Today's Comfort Corner - Large, elder-friendly reminders */}
            <div className="rounded-2xl border-2 border-teal-200/80 bg-white/95 p-4 sm:p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-teal-950 font-bold text-base sm:text-lg">
                <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Daily Reminders</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-50 shrink-0">
                    <Heart className="h-4 w-4 text-coral-500" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-teal-950">Relax & enjoy</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 shrink-0">
                    <Droplets className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-teal-950">Drink water</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 shrink-0">
                    <Clock className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-teal-950">1–2 activities</span>
                </div>
              </div>
            </div>
          </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Activity details */}
                <div className="lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-teal-100 text-teal-700 shadow-inner">
                    <RecommendedIcon className="h-10 w-10" strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-teal-950 leading-tight">
                      {recommendedActivity.title}
                    </h3>

                    <p className="mt-2 text-base text-teal-800 font-medium">
                      {recommendedActivity.description || 'A gentle memory and focus exercise designed to keep your mind sharp.'}
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

                {/* Quick Guide */}
                <div className="rounded-2xl border border-teal-100 bg-sand-50/70 p-4 sm:p-5 flex flex-col justify-center gap-2.5 text-xs text-teal-800">
                  <p className="font-bold text-teal-950 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    Quick Guide
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🌿</span>
                    <p><strong>No Timers:</strong> Move at your own comfortable pace.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🔊</span>
                    <p><strong>Voice Audio:</strong> Reads questions aloud anytime.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🌟</span>
                    <p><strong>Gentle Hints:</strong> Always available if you pause.</p>
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
        <section className="animate-fade-in-up space-y-4">
          <div className="flex items-center gap-2">
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
                  ? 'Completed today'
                  : 'No activities yet today'}
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
                  ? 'Daily goal reached'
                  : 'Toward your daily goal'}
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
                Active days this week
              </p>
            </div>
          </div>

          {/* Daily Tip */}
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3.5 sm:px-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-teal-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                <strong className="text-teal-950">Daily Tip:</strong> Regular gentle practice supports mental clarity and focus.
              </span>
            </div>
            <span className="hidden sm:inline-block font-semibold text-teal-700 shrink-0">Every session counts</span>
          </div>

          {/* Today's Activity Log */}
          <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold text-teal-950 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-700" />
              <span>{t.dashboard?.todaysCompleted || "Today's Completed Activities"}</span>
            </h3>

            {todaysCompletedSessions.length > 0 ? (
              <div className="space-y-2.5">
                {todaysCompletedSessions.map((session, idx) => {
                  const matchedGame = GAMES.find((g) => g.type === session.game_type) || GAMES[0];
                  return (
                    <div
                      key={session.id || idx}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-sand-50/50 p-3.5 sm:px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shrink-0">
                          <matchedGame.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-teal-950 text-sm sm:text-base">
                            {matchedGame.title}
                          </p>
                          <p className="text-xs text-teal-700">
                            Completed at {formatSessionTime(session.created_at)} &bull; {matchedGame.categoryLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="rounded-xl bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                          ⭐ {session.accuracy || 100}% Accuracy
                        </span>
                        <span className="rounded-xl bg-sand-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          Gentle session
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-teal-200 bg-sand-50/60 p-5 text-center">
                <Heart className="mx-auto h-7 w-7 text-coral-400 mb-1.5" />
                <p className="font-bold text-teal-900 text-sm sm:text-base">
                  {t.dashboard?.noCompletedTitle || 'No activities completed yet today'}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-teal-700 max-w-md mx-auto font-medium">
                  Select any exercise below to begin when you are ready.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Cognitive Games Grid — Balanced 6-card symmetrical grid */}
        <section className="animate-fade-in-up">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-teal-700" />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
                {t.dashboard?.cognitiveActivities || 'Brain Exercises & Games'}
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-teal-700">
              Tap any card to begin
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* The 5 Core Cognitive Games */}
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
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-bold text-teal-900">
                          {game.categoryLabel}
                        </span>
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-100">
                          #{index + 1}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display text-xl font-bold text-teal-950 group-hover:text-teal-700 transition-colors">
                      {translatedTitle}
                    </h3>

                    <p className="mt-2 text-sm text-teal-800 leading-relaxed font-medium">
                      {translatedTagline}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-teal-700">
                    <span>
                      {hasHistory
                        ? `${gameSessionsForType.length} completed`
                        : '5 min session'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-teal-800 group-hover:translate-x-1 transition-transform">
                      Play Now <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}

            {/* 6th Card: Peaceful Breathing & Reminiscence */}
            <button
              onClick={() => setShowBreathingModal(true)}
              className="group flex flex-col justify-between rounded-3xl border-2 border-teal-200/90 bg-gradient-to-br from-teal-50/50 via-white to-sand-50/60 p-6 text-left shadow-soft transition-all hover:border-teal-400 hover:shadow-soft-lg active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Wind className="h-7 w-7" strokeWidth={2.5} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                      Daily Calm
                    </span>
                    <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      2 mins
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-xl font-bold text-teal-950 group-hover:text-teal-700 transition-colors">
                  Peaceful Breathing
                </h3>

                <p className="mt-2 text-sm text-teal-800 leading-relaxed font-medium">
                  A gentle 2-minute guided breathing and relaxation pause.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-teal-100 flex items-center justify-between text-sm font-bold text-teal-700">
                <span>Self-guided relaxation</span>
                <span className="inline-flex items-center gap-1 text-teal-800 group-hover:translate-x-1 transition-transform">
                  Take a Breath <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Daily Comfort & Wellness Guidance */}
        <section className="animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-coral-500" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
              Comfort Tips
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-3">
                <Sun className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-teal-950 text-sm">Gentle Light</h4>
              <p className="mt-1 text-xs text-teal-800 leading-relaxed">
                Use soft, clear lighting to keep your eyes comfortable.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-3">
                <Coffee className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-teal-950 text-sm">Warm Beverage</h4>
              <p className="mt-1 text-xs text-teal-800 leading-relaxed">
                Keep water or tea nearby for easy hydration.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-100 text-sand-700 mb-3">
                <Volume2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-teal-950 text-sm">Spoken Audio</h4>
              <p className="mt-1 text-xs text-teal-800 leading-relaxed">
                Tap Voice Guide to hear questions read out loud.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 text-coral-600 mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-teal-950 text-sm">Family Connection</h4>
              <p className="mt-1 text-xs text-teal-800 leading-relaxed">
                Caregivers can view your milestones and progress.
              </p>
            </div>
          </div>
        </section>

        {/* Family & Caregiver Connection Card (Discreet, Reassuring) */}
        <section className="animate-fade-in-up">
          <div className="rounded-3xl border border-teal-200/90 bg-gradient-to-br from-white via-sand-50/50 to-teal-50/40 p-5 sm:p-6 shadow-soft">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-teal-950">
                    Caregiver Link
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-800 font-medium">
                    Share code to connect
                  </p>
                </div>
              </div>

              {linkingCode && (
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-teal-200 shadow-xs">
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-teal-600 uppercase tracking-wider">Code</span>
                    <span className="font-mono text-base font-bold text-teal-950 tracking-widest">{linkingCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="ml-1.5 inline-flex items-center justify-center h-8 w-8 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode ? <CheckCircle2 className="h-4 w-4 text-teal-700" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Ultra-concise status points */}
            <div className="mt-3.5 pt-3.5 border-t border-teal-100/70 flex flex-wrap items-center justify-between gap-2.5 text-xs text-teal-800">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                Private
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                Family updates
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                Easy link
              </span>
            </div>

            {userProfile?.caregiver?.phoneNumber && (
              <div className="mt-3 pt-2.5 border-t border-teal-100/70 flex items-center justify-between text-xs text-teal-700 font-medium">
                <span>
                  Emergency: <strong className="text-teal-950 font-bold">{userProfile.caregiver.name || 'Caregiver'} ({userProfile.caregiver.phoneNumber})</strong>
                </span>
                <span className="text-teal-600 font-semibold">Active</span>
              </div>
            )}
          </div>
        </section>

        {/* Clean, Reassuring Footer */}
        <div className="rounded-2xl border border-teal-100 bg-sand-100/80 px-6 py-4 text-center">
          <p className="text-sm font-medium text-teal-900">
            {t.dashboard?.disclaimer || 'Recallia provides gentle daily exercises. Practice at your own comfortable pace.'}
          </p>
        </div>
      </main>

      {/* Emergency Assistance Voice Memo Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      {/* Peaceful Breathing & Reminiscence Modal */}
      <PeacefulBreathingModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
    </div>
  );
}
