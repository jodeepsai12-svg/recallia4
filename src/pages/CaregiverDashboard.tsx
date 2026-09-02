import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  Calendar,
  Clock,
  Target,
  ShieldCheck,
  Printer,
  ChevronDown,
  ArrowLeft,
  AlertCircle,
  Eye,
  Link2,
  BookOpen,
  Globe,
  Settings,
  LogOut,
  UserPlus,
  Lock,
  Search,
  ShieldAlert,
  PhoneCall,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import {
  fetchEmergencyAlerts,
  resolveEmergencyAlert,
  fetchGameSessions,
  verifyAndRedeemCaregiverCode,
  fetchLinkedPatientsForCaregiver,
} from '@/lib/firebaseService';
import {
  DEFAULT_PARTICIPANTS,
  SAMPLE_HISTORICAL_SESSIONS,
  computeCaregiverMetrics,
  type LinkedParticipant,
} from '@/lib/caregiverData';
import { CaregiverTrendsChart } from '@/components/CaregiverTrendsChart';
import { CaregiverPrivacyModal } from '@/components/CaregiverPrivacyModal';
import { CaregiverReportModal } from '@/components/CaregiverReportModal';
import { MyMemoriesCaregiverTab } from '@/components/MyMemoriesCaregiverTab';
import { MyMemoriesRecall } from '@/games/MyMemoriesRecall';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';
import { useVoice } from '@/context/VoiceContext';
import type { GameSession, GameType, EmergencyAlert } from '@/types';

interface CaregiverDashboardProps {
  onBackToActivities: () => void;
  onOpenSettings?: () => void;
}

export function CaregiverDashboard({ onBackToActivities, onOpenSettings }: CaregiverDashboardProps) {
  const { user, signOut } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { speak } = useVoice();

  const [participants, setParticipants] = useState<LinkedParticipant[]>(() => {
    try {
      const saved = localStorage.getItem('recallia_caregiver_participants');
      return saved ? JSON.parse(saved) : DEFAULT_PARTICIPANTS;
    } catch {
      return DEFAULT_PARTICIPANTS;
    }
  });

  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id ?? 'participant_mary');
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [playingAlertId, setPlayingAlertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMemoryPreviewModal, setShowMemoryPreviewModal] = useState(false);
  const [filterGameType, setFilterGameType] = useState<GameType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');

  const [linkTab, setLinkTab] = useState<'code' | 'create'>('code');
  const [linkingCodeInput, setLinkingCodeInput] = useState('');
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [linkingLoading, setLinkingLoading] = useState(false);

  const currentParticipant = participants.find((p) => p.id === selectedParticipantId) ?? participants[0];

  // Save participants state
  const handleUpdateParticipant = (updated: LinkedParticipant) => {
    const next = participants.map((p) => (p.id === updated.id ? updated : p));
    setParticipants(next);
    localStorage.setItem('recallia_caregiver_participants', JSON.stringify(next));
  };

  const handleRedeemLinkingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkingError(null);
    if (!linkingCodeInput.trim()) {
      setLinkingError('Please enter a linking code.');
      return;
    }

    setLinkingLoading(true);
    try {
      const res = await verifyAndRedeemCaregiverCode(
        user?.uid || 'caregiver_demo',
        user?.displayName || user?.email?.split('@')[0] || 'Caregiver',
        linkingCodeInput.trim()
      );

      setLinkingLoading(false);
      if (!res.success || !res.linkedUser) {
        setLinkingError(res.error || 'Failed to verify linking code.');
        return;
      }

      const patient = res.linkedUser;
      const newLinked: LinkedParticipant = {
        id: patient.uid,
        name: patient.name,
        relationship: patient.caregiver?.relationship || 'Family Member',
        age: 75,
        avatarEmoji: '👤',
        consentDate: new Date().toISOString().split('T')[0],
        accessLevel: 'full',
        primaryCaregiverName: user?.displayName || user?.email?.split('@')[0] || 'Caregiver',
        accessCode: patient.caregiver?.linkingCode || linkingCodeInput.toUpperCase(),
        weeklyGoalSessions: 5,
        emailAlerts: true,
        inactivityAlerts: true,
        milestoneAlerts: true,
      };

      const next = [newLinked, ...participants.filter((p) => p.id !== newLinked.id)];
      setParticipants(next);
      localStorage.setItem('recallia_caregiver_participants', JSON.stringify(next));
      setSelectedParticipantId(newLinked.id);
      setLinkingCodeInput('');
      setShowNewMemberModal(false);
      speak(`Linked account for ${newLinked.name} successfully.`);
    } catch (err) {
      setLinkingLoading(false);
      setLinkingError(err instanceof Error ? err.message : 'Error linking account.');
    }
  };

  const handleAddNewParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newId = 'participant_' + Math.random().toString(36).substring(2, 8);
    const codePrefix = newMemberName.slice(0, 2).toUpperCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    const newEntry: LinkedParticipant = {
      id: newId,
      name: newMemberName.trim(),
      relationship: newMemberRelation.trim() || 'Family Member',
      age: Number(newMemberAge) || 75,
      avatarEmoji: '👤',
      consentDate: new Date().toISOString().split('T')[0],
      accessLevel: 'full',
      primaryCaregiverName: user?.email?.split('@')[0] ?? 'Caregiver',
      accessCode: `${codePrefix}-${randomDigits}-CARE`,
      weeklyGoalSessions: 4,
      emailAlerts: true,
      inactivityAlerts: true,
      milestoneAlerts: true,
    };

    const next = [...participants, newEntry];
    setParticipants(next);
    localStorage.setItem('recallia_caregiver_participants', JSON.stringify(next));
    setSelectedParticipantId(newId);
    setNewMemberName('');
    setNewMemberRelation('');
    setNewMemberAge('');
    setShowNewMemberModal(false);
    speak(`Linked profile for ${newEntry.name} successfully.`);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [fetchedAlerts, fetchedSessions] = await Promise.all([
        fetchEmergencyAlerts(),
        fetchGameSessions(selectedParticipantId || 'participant_mary'),
      ]);

      setEmergencyAlerts(fetchedAlerts);

      // If user has linked participants in Firestore, load them
      if (user?.uid) {
        const cloudPatients = await fetchLinkedPatientsForCaregiver(user.uid);
        if (cloudPatients && cloudPatients.length > 0) {
          const mapped: LinkedParticipant[] = cloudPatients.map((cp) => ({
            id: cp.uid,
            name: cp.name,
            relationship: cp.caregiver?.relationship || 'Family Member',
            age: 75,
            avatarEmoji: '👤',
            consentDate: cp.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            accessLevel: 'full',
            primaryCaregiverName: user?.displayName || user?.email?.split('@')[0] || 'Caregiver',
            accessCode: cp.caregiver?.linkingCode || `${cp.name.slice(0, 2).toUpperCase()}-CARE`,
            weeklyGoalSessions: 5,
            emailAlerts: true,
            inactivityAlerts: true,
            milestoneAlerts: true,
          }));

          setParticipants((prev) => {
            const existingIds = new Set(mapped.map((m) => m.id));
            const merged = [...mapped, ...prev.filter((p) => !existingIds.has(p.id))];
            localStorage.setItem('recallia_caregiver_participants', JSON.stringify(merged));
            return merged;
          });
        }
      }

      if (fetchedSessions.length > 0) {
        const existingIds = new Set(fetchedSessions.map((s) => s.id));
        const combined = [
          ...fetchedSessions,
          ...SAMPLE_HISTORICAL_SESSIONS.filter((s) => !existingIds.has(s.id)),
        ];
        setGameSessions(combined);
      } else {
        setGameSessions(SAMPLE_HISTORICAL_SESSIONS);
      }
    } catch (err) {
      console.warn('Error loading caregiver data from Firestore:', err);
      setGameSessions(SAMPLE_HISTORICAL_SESSIONS);
    } finally {
      setLoading(false);
    }
  }, [selectedParticipantId, user?.uid, user?.displayName, user?.email]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveEmergencyAlert(alertId, user?.email || 'Caregiver');
      setEmergencyAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a
        )
      );
      speak('Emergency alert marked as resolved.');
    } catch (err) {
      console.warn('Error resolving alert in Firestore:', err);
    }
  };

  const handleToggleAlertAudio = (alert: EmergencyAlert) => {
    if (!alert.audio_url) return;
    if (playingAlertId === alert.id) {
      setPlayingAlertId(null);
    } else {
      setPlayingAlertId(alert.id);
      const audio = new Audio(alert.audio_url);
      audio.onended = () => setPlayingAlertId(null);
      audio.play().catch(() => setPlayingAlertId(null));
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Metrics computation
  const metrics = computeCaregiverMetrics(gameSessions);

  // Filtered recent activity sessions
  const filteredSessions = gameSessions.filter((s) => {
    if (filterGameType !== 'all' && s.game_type !== filterGameType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchGame = s.game_type.toLowerCase().includes(q);
      const matchDiff = s.difficulty.toLowerCase().includes(q);
      return matchGame || matchDiff;
    }
    return true;
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Eye':
        return Eye;
      case 'Brain':
        return Brain;
      case 'Link2':
        return Link2;
      case 'BookOpen':
        return BookOpen;
      default:
        return Brain;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-lg font-semibold text-teal-600">Loading Caregiver Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-teal-50 bg-sand-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToActivities}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
              title="Return to user activities"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Participant View</span>
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Print / Report Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-50 shadow-soft sm:text-sm"
              title="Print Caregiver Summary Report"
            >
              <Printer className="h-4 w-4 text-teal-600" />
              <span className="hidden md:inline">Print Report</span>
            </button>

            {/* Privacy Controls Button */}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-50 shadow-soft sm:text-sm"
              title="Manage Privacy & Access"
            >
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span className="hidden md:inline">Privacy Controls</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-100/90 bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 sm:text-sm"
                title={t.settings.title}
              >
                <Globe className="h-4 w-4 text-teal-600" />
                <span className="max-w-[100px] truncate hidden sm:inline">{currentLanguageMeta.nativeName}</span>
                <Settings className="h-3.5 w-3.5 text-teal-500" />
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-teal-600 transition-colors hover:bg-teal-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Voice Guide Banner Bar */}
      <VoiceGuideControlBar
        currentScreenInstruction={`Viewing caregiver overview and cognitive trends for ${currentParticipant.name}.`}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        {/* Profile & Participant Switcher Header */}
        <section className="card !p-6 sm:!p-8 animate-fade-in-up">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-teal-100 text-3xl">
                {currentParticipant.avatarEmoji}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl font-semibold text-teal-900 sm:text-3xl">
                    {currentParticipant.name}
                  </h1>
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                    {currentParticipant.relationship} · Age {currentParticipant.age}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-3 py-1 text-xs font-bold text-teal-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                    Consent Active
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-teal-600">
                  Caregiver Portal · Viewing cognitive activity & engagement summaries
                </p>
              </div>
            </div>

            {/* Participant Dropdown / Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="rounded-2xl border-2 border-teal-200 bg-white py-2.5 pl-4 pr-10 text-sm font-bold text-teal-900 transition-colors hover:border-teal-300 focus:border-teal-500 focus:outline-none"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.relationship})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-teal-500" />
              </div>

              <button
                onClick={() => setShowNewMemberModal(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-100"
                title="Link another family member"
              >
                <UserPlus className="h-4 w-4 text-teal-600" />
                <span className="hidden sm:inline">Link Loved One</span>
              </button>
            </div>
          </div>
        </section>

        {/* Emergency Voice Alerts Section (Real-time caregiver alerts) */}
        {emergencyAlerts.length > 0 && (
          <section className="mt-6 animate-fade-in-up">
            <div className="card !p-6 border-2 border-rose-200 bg-rose-50/40 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-rose-950">
                      Emergency Voice Messages ({emergencyAlerts.filter((a) => a.status === 'pending').length} Active)
                    </h2>
                    <p className="text-xs text-rose-800/80 font-medium">
                      Triggered via the participant dashboard emergency assistance button
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {emergencyAlerts.map((alert) => {
                  const isPending = alert.status === 'pending';
                  const dateStr = new Date(alert.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-white border-rose-300 shadow-sm'
                          : 'bg-white/60 border-gray-200 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isPending
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isPending ? '🚨 Urgent Alert' : '✓ Resolved'}
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {alert.participant_name}
                            </span>
                            <span className="text-xs text-gray-500">· {dateStr}</span>
                          </div>

                          <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                            "{alert.message_text}"
                          </p>

                          {alert.tags && alert.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {alert.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200/60"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions: Audio Listen & Resolve */}
                        <div className="flex items-center gap-2 shrink-0">
                          {alert.audio_url && (
                            <button
                              type="button"
                              onClick={() => handleToggleAlertAudio(alert)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold rounded-xl transition-colors"
                            >
                              {playingAlertId === alert.id ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 text-rose-700" />
                                  Pause Audio
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 text-rose-700" />
                                  Play Voice ({alert.audio_duration_seconds || 5}s)
                                </>
                              )}
                            </button>
                          )}

                          <a
                            href="tel:+919876543210"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden md:inline">Call</span>
                          </a>

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Mark Handled
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Top Summary Metrics Grid */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up [animation-delay:100ms]">
          {/* Sessions Completed */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-teal-600">Sessions Completed</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 font-display text-4xl font-bold text-teal-900">
                {metrics.totalSessions}
              </p>
            </div>
            <div className="mt-3 border-t border-teal-50 pt-2 text-xs font-semibold text-teal-500">
              <span className="font-bold text-teal-700">{metrics.weeklySessions} completed</span> in past 7 days
            </div>
          </div>

          {/* Games Played */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-teal-600">Games Played</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-100 text-coral-700">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 font-display text-4xl font-bold text-teal-900">
                {metrics.totalSessions}
              </p>
            </div>
            <div className="mt-3 border-t border-teal-50 pt-2 text-xs font-semibold text-teal-500">
              Across 4 cognitive categories
            </div>
          </div>

          {/* Average Accuracy */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-teal-600">Average Accuracy</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 font-display text-4xl font-bold text-teal-900">
                {metrics.averageAccuracy}%
              </p>
            </div>
            <div className="mt-3 border-t border-teal-50 pt-2 text-xs font-semibold text-teal-500">
              <span className="font-bold text-teal-700">Steady engagement</span> with tasks
            </div>
          </div>

          {/* Average Response Time */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-teal-600">Avg. Response Time</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-sand-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 font-display text-4xl font-bold text-teal-900">
                {metrics.averageResponseTimeSec}s
              </p>
            </div>
            <div className="mt-3 border-t border-teal-50 pt-2 text-xs font-semibold text-teal-500">
              Calm, unhurried pacing
            </div>
          </div>
        </section>

        {/* Recallia Insights Section (Strictly Non-Diagnostic) */}
        <section className="mt-8 animate-fade-in-up [animation-delay:150ms]">
          <div className="card overflow-hidden border-2 border-teal-200 bg-white p-6 shadow-soft-lg sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-teal-900 sm:text-2xl">
                    Recallia Insights
                  </h2>
                  <p className="text-xs font-semibold text-teal-500">
                    Descriptive observations of activity and exercise engagement
                  </p>
                </div>
              </div>

              <span className="self-start rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-700 sm:self-auto">
                Descriptive & Non-Diagnostic
              </span>
            </div>

            {/* Insights Cards Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {metrics.insights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 transition-all hover:bg-teal-50/80"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-200/80 text-teal-800">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-teal-900">
                        {insight.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-teal-700">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strict Non-Diagnostic Safe Care Notice */}
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-sand-100 px-5 py-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
              <p className="text-xs leading-relaxed text-teal-600">
                <strong>Non-Diagnostic Commitment:</strong> Recallia insights summarize activity patterns and participation. Recallia never provides medical assessments or clinical diagnoses of cognitive decline or dementia. Please consult qualified healthcare providers for medical advice.
              </p>
            </div>
          </div>
        </section>

        {/* Weekly Performance Trends Charts */}
        <section className="mt-8 animate-fade-in-up [animation-delay:200ms]">
          <CaregiverTrendsChart
            dailyTrends={metrics.dailyTrends}
            categories={metrics.categories}
          />
        </section>

        {/* Activity Category Performance Breakdown */}
        <section className="mt-8 animate-fade-in-up [animation-delay:250ms]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              <h2 className="font-display text-xl font-semibold text-teal-900">
                Activity Category Performance
              </h2>
            </div>
            <span className="text-xs font-semibold text-teal-500">
              4 Cognitive Domains
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.categories.map((cat) => {
              const Icon = getCategoryIcon(cat.iconName);
              return (
                <div key={cat.categoryKey} className="card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
                        <Icon className="h-6 w-6 text-teal-600" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-teal-900">
                          {cat.name}
                        </h3>
                        <p className="text-xs font-semibold text-teal-500">
                          {cat.sessionsCount} {cat.sessionsCount === 1 ? 'session' : 'sessions'}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-teal-600">
                      {cat.description}
                    </p>

                    {/* Accuracy Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-bold text-teal-700">
                        <span>Accuracy</span>
                        <span>{cat.averageAccuracy}%</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-teal-50">
                        <div
                          className="h-full rounded-full bg-teal-500 transition-all duration-500"
                          style={{ width: `${cat.averageAccuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-teal-50 pt-3 text-xs">
                    <span className="text-teal-500">Avg Speed: {cat.averageResponseTimeSec}s</span>
                    <span className="rounded-full bg-sand-100 px-2.5 py-0.5 font-bold capitalize text-sand-600">
                      {cat.preferredDifficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity Log */}
        <section className="mt-8 animate-fade-in-up [animation-delay:300ms]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <h2 className="font-display text-xl font-semibold text-teal-900">
                Recent Activity Log
              </h2>
            </div>

            {/* Filter and search controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-teal-400" />
                <input
                  type="text"
                  placeholder="Filter sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-teal-200 bg-white py-1.5 pl-9 pr-3 text-xs font-bold text-teal-900 placeholder:text-teal-300 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <select
                value={filterGameType}
                onChange={(e) => setFilterGameType(e.target.value as GameType | 'all')}
                className="rounded-xl border border-teal-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-teal-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="all">All Activities</option>
                <option value="picture_recall">Picture Recall</option>
                <option value="sequence_memory">Sequence Memory</option>
                <option value="object_association">Object Association</option>
                <option value="story_recall">Story Recall</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden !p-0 shadow-soft">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base font-bold text-teal-700">No matching activity records found.</p>
                <p className="mt-1 text-sm text-teal-500">Completed cognitive sessions will be logged here automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-teal-100 bg-sand-50 text-xs font-bold uppercase tracking-wider text-teal-600">
                    <tr>
                      <th className="px-6 py-3.5">Activity</th>
                      <th className="px-6 py-3.5">Date & Time</th>
                      <th className="px-6 py-3.5">Difficulty</th>
                      <th className="px-6 py-3.5 text-center">Accuracy</th>
                      <th className="px-6 py-3.5 text-center">Mistakes</th>
                      <th className="px-6 py-3.5 text-right">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 bg-white">
                    {filteredSessions.map((session) => {
                      const dateObj = new Date(session.created_at);
                      const timeStr = dateObj.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const dateStr = dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      });

                      const gameTitleMap: Record<GameType, string> = {
                        picture_recall: 'Picture Recall',
                        sequence_memory: 'Sequence Memory',
                        object_association: 'Object Association',
                        story_recall: 'Story Recall',
                      };

                      return (
                        <tr key={session.id} className="transition-colors hover:bg-sand-50/70">
                          <td className="px-6 py-4 font-bold text-teal-900">
                            <div className="flex items-center gap-2">
                              <span className="capitalize">{gameTitleMap[session.game_type] || session.game_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-teal-600">
                            {dateStr} at {timeStr}
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-bold capitalize text-sand-600">
                              {session.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                session.accuracy >= 90
                                  ? 'text-teal-700'
                                  : session.accuracy >= 75
                                  ? 'text-teal-600'
                                  : 'text-sand-600'
                              }`}
                            >
                              {session.accuracy}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-teal-600">
                            {session.mistakes}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-teal-700">
                            {(session.response_time_ms / 1000).toFixed(1)}s
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* My Memories Personalized Recall Section */}
        <MyMemoriesCaregiverTab
          participant={currentParticipant}
          onPreviewActivity={() => setShowMemoryPreviewModal(true)}
        />

        {/* Privacy & Sharing Controls Summary Box */}
        <section className="mt-8 animate-fade-in-up [animation-delay:350ms]">
          <div className="card flex flex-col items-start justify-between gap-4 bg-teal-900 !p-6 text-white sm:flex-row sm:items-center sm:!p-8">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-teal-300" />
                <h3 className="font-display text-xl font-semibold text-white">
                  Privacy & Data Governance
                </h3>
              </div>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-teal-100">
                Participation in Recallia is private and user-authorized. Caregiver access is read-only and can be modified or disconnected at any time.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-teal-900 shadow-soft transition-transform hover:bg-sand-50 active:scale-95"
            >
              <Lock className="h-4 w-4 text-teal-600" />
              Manage Access
            </button>
          </div>
        </section>
      </main>

      {/* Privacy Modal */}
      <CaregiverPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        participant={currentParticipant}
        onUpdateParticipant={handleUpdateParticipant}
        onRevokeAccess={() => {
          const remaining = participants.filter((p) => p.id !== currentParticipant.id);
          if (remaining.length > 0) {
            setParticipants(remaining);
            setSelectedParticipantId(remaining[0].id);
            localStorage.setItem('recallia_caregiver_participants', JSON.stringify(remaining));
          } else {
            onBackToActivities();
          }
        }}
      />

      {/* Report Modal */}
      <CaregiverReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        participant={currentParticipant}
        totalSessions={metrics.totalSessions}
        weeklySessions={metrics.weeklySessions}
        averageAccuracy={metrics.averageAccuracy}
        averageResponseTimeSec={metrics.averageResponseTimeSec}
        categories={metrics.categories}
        insights={metrics.insights}
        recentSessions={gameSessions}
      />

      {/* Link New Family Member Modal */}
      {showNewMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-soft-lg sm:p-8">
            <h3 className="font-display text-2xl font-semibold text-teal-900">
              Link Loved One
            </h3>
            <p className="mt-1 text-sm text-teal-600">
              Connect to your family member's Recallia account
            </p>

            {/* Tab Selector */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-sand-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setLinkTab('code');
                  setLinkingError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  linkTab === 'code'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-teal-700 hover:text-teal-900'
                }`}
              >
                Enter Linking Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkTab('create');
                  setLinkingError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  linkTab === 'create'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-teal-700 hover:text-teal-900'
                }`}
              >
                Create Profile
              </button>
            </div>

            {linkTab === 'code' ? (
              <form onSubmit={handleRedeemLinkingCode} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-teal-800">
                    6-Digit Family Linking Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MA-4819-CARE"
                    value={linkingCodeInput}
                    onChange={(e) => setLinkingCodeInput(e.target.value.toUpperCase())}
                    className="input-field mt-1 !py-3 !text-base tracking-wider font-mono font-bold uppercase"
                  />
                  <p className="mt-1.5 text-xs text-teal-600 leading-relaxed">
                    Ask your loved one or look at their Recallia app under "Caregiver Linking Code" in their profile.
                  </p>
                </div>

                {linkingError && (
                  <div className="flex items-start gap-2 rounded-2xl bg-coral-50 p-3 text-xs font-semibold text-coral-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{linkingError}</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-teal-100">
                  <button
                    type="button"
                    onClick={() => setShowNewMemberModal(false)}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-teal-600 hover:bg-teal-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linkingLoading || !linkingCodeInput.trim()}
                    className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60"
                  >
                    {linkingLoading ? 'Verifying Code...' : 'Verify & Link Account'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddNewParticipant} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-teal-800">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="input-field mt-1 !py-3 !text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-teal-800">
                      Relationship
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aunt / Father"
                      value={newMemberRelation}
                      onChange={(e) => setNewMemberRelation(e.target.value)}
                      className="input-field mt-1 !py-3 !text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-teal-800">
                      Age (approx.)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 76"
                      value={newMemberAge}
                      onChange={(e) => setNewMemberAge(e.target.value)}
                      className="input-field mt-1 !py-3 !text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-teal-100">
                  <button
                    type="button"
                    onClick={() => setShowNewMemberModal(false)}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-teal-600 hover:bg-teal-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !px-5 !py-2.5 !text-sm"
                  >
                    Save & Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Test Memory Recall Activity Modal for Caregiver */}
      {showMemoryPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-sand-50 p-6 sm:p-8 shadow-soft-lg my-8 max-h-[92vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between border-b border-teal-100 pb-4">
              <div>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                  Caregiver Preview Mode
                </span>
                <h3 className="font-display text-2xl font-bold text-teal-950 mt-1">
                  Testing Personal Memory Recall for {currentParticipant.name}
                </h3>
              </div>
              <button
                onClick={() => setShowMemoryPreviewModal(false)}
                className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow-soft hover:bg-teal-50"
              >
                Close Preview
              </button>
            </div>

            <MyMemoriesRecall
              difficulty="gentle"
              participantId={currentParticipant.id}
              onComplete={() => {
                // Completed preview
              }}
              onOpenCaregiverMemories={() => setShowMemoryPreviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
