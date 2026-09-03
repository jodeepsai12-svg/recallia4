import { Printer, X, ShieldCheck, Activity, Sparkles, Siren } from 'lucide-react';
import type { LinkedParticipant, CategorySummary, RecalliaInsight } from '@/lib/caregiverData';
import type { GameSession, CognitiveDeclineAlert } from '@/types';

interface CaregiverReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: LinkedParticipant;
  totalSessions: number;
  weeklySessions: number;
  averageAccuracy: number;
  averageResponseTimeSec: number;
  categories: CategorySummary[];
  insights: RecalliaInsight[];
  recentSessions: GameSession[];
  activeDeclineAlert?: CognitiveDeclineAlert | null;
}

export function CaregiverReportModal({
  isOpen,
  onClose,
  participant,
  totalSessions,
  weeklySessions,
  averageAccuracy,
  averageResponseTimeSec,
  categories,
  insights,
  recentSessions,
  activeDeclineAlert,
}: CaregiverReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-soft-lg sm:p-10 print:max-h-none print:shadow-none print:p-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Actions header (hidden when printing) */}
        <div className="flex items-center justify-between border-b border-teal-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <span className="font-display text-lg font-semibold text-teal-900">
              Caregiver Summary Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 sm:text-sm"
            >
              <Printer className="h-4 w-4 text-teal-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-teal-400 hover:bg-teal-50 hover:text-teal-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="mt-6 space-y-6">
          {/* Report Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-teal-100 pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{participant.avatarEmoji}</span>
                <h1 className="font-display text-2xl font-semibold text-teal-900 sm:text-3xl">
                  {participant.name}
                </h1>
              </div>
              <p className="text-sm font-semibold text-teal-600">
                {participant.relationship} · Age {participant.age} · Recallia ID: {participant.accessCode}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold text-teal-500">Report Date</p>
              <p className="text-sm font-bold text-teal-900">{todayFormatted}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Consent active
              </span>
            </div>
          </div>

          {/* Progressive Cognitive Decline Alarm Documentation */}
          {activeDeclineAlert && (
            <div className="rounded-2xl border-2 border-rose-500 bg-rose-50/80 p-5 print:border-rose-600 print:bg-rose-50">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                  <Siren className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-black uppercase text-white">
                      🚨 Clinical Alarm: Progressive Cognitive Decline
                    </span>
                    <span className="text-xs font-bold text-rose-800">
                      Level: {activeDeclineAlert.alarm_level.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-rose-950">
                    {activeDeclineAlert.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-rose-900 leading-relaxed">
                    {activeDeclineAlert.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="bg-white/90 p-2 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] font-bold text-gray-500">Decline Trajectory</span>
                      <p className="font-bold text-rose-600 text-sm">-{activeDeclineAlert.decline_percentage}%</p>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] font-bold text-gray-500">Accuracy Drop</span>
                      <p className="font-bold text-gray-900 text-sm">{activeDeclineAlert.baseline_accuracy}% → {activeDeclineAlert.current_accuracy}%</p>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] font-bold text-gray-500">Response Latency</span>
                      <p className="font-bold text-amber-700 text-sm">{(activeDeclineAlert.current_response_time_ms / 1000).toFixed(1)}s</p>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] font-bold text-gray-500">Affected Domains</span>
                      <p className="font-bold text-gray-900 text-xs truncate">{activeDeclineAlert.affected_areas?.join(', ') || 'Recall'}</p>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-rose-800 bg-white/70 p-2.5 rounded-xl border border-rose-200">
                    <span className="font-bold">Physician Notes:</span> Acute performance drop of &gt;15% observed across consecutive sessions. Recommended clinical screening includes evaluating reversible secondary causes (UTI, hydration, electrolyte panel, medication interactions/compliance, and sleep quality).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Summary Metrics Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">
              Activity Overview
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-sand-50 p-4 text-center">
                <p className="font-display text-2xl font-bold text-teal-900">{totalSessions}</p>
                <p className="text-xs font-bold text-teal-600">Total Sessions</p>
              </div>
              <div className="rounded-2xl bg-sand-50 p-4 text-center">
                <p className="font-display text-2xl font-bold text-teal-900">{weeklySessions}</p>
                <p className="text-xs font-bold text-teal-600">Past 7 Days</p>
              </div>
              <div className="rounded-2xl bg-sand-50 p-4 text-center">
                <p className="font-display text-2xl font-bold text-teal-900">{averageAccuracy}%</p>
                <p className="text-xs font-bold text-teal-600">Average Accuracy</p>
              </div>
              <div className="rounded-2xl bg-sand-50 p-4 text-center">
                <p className="font-display text-2xl font-bold text-teal-900">{averageResponseTimeSec}s</p>
                <p className="text-xs font-bold text-teal-600">Avg Response Time</p>
              </div>
            </div>
          </div>

          {/* Recallia Insights */}
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-coral-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">
                Recallia Engagement Insights (Non-Diagnostic)
              </h3>
            </div>
            <div className="mt-3 space-y-2.5">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-2xl border border-teal-100 bg-teal-50/40 p-3.5">
                  <p className="text-sm font-bold text-teal-900">{ins.title}</p>
                  <p className="mt-0.5 text-xs text-teal-700">{ins.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">
              Cognitive Domain Engagement
            </h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-teal-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-100 font-bold text-teal-900">
                  <tr>
                    <th className="px-4 py-2.5">Domain</th>
                    <th className="px-4 py-2.5">Sessions</th>
                    <th className="px-4 py-2.5">Avg Accuracy</th>
                    <th className="px-4 py-2.5">Avg Response</th>
                    <th className="px-4 py-2.5">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50 bg-white">
                  {categories.map((cat) => (
                    <tr key={cat.categoryKey}>
                      <td className="px-4 py-2.5 font-bold text-teal-900">{cat.name}</td>
                      <td className="px-4 py-2.5 text-teal-700">{cat.sessionsCount}</td>
                      <td className="px-4 py-2.5 font-semibold text-teal-700">{cat.averageAccuracy}%</td>
                      <td className="px-4 py-2.5 text-teal-700">{cat.averageResponseTimeSec}s</td>
                      <td className="px-4 py-2.5 capitalize text-teal-700">{cat.preferredDifficulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Log Snapshot */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">
              Recent Activity Log (Last 5 Sessions)
            </h3>
            <div className="mt-3 space-y-2">
              {recentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl bg-sand-50 px-3.5 py-2 text-xs"
                >
                  <div>
                    <span className="font-bold capitalize text-teal-900">
                      {session.game_type.replace('_', ' ')}
                    </span>
                    <span className="ml-2 text-teal-500">
                      {new Date(session.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-teal-700">{session.accuracy}% Accuracy</span>
                    <span className="text-teal-500">{(session.response_time_ms / 1000).toFixed(1)}s</span>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 font-bold capitalize text-teal-800">
                      {session.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strict Non-Diagnostic Medical Disclaimer */}
          <div className="rounded-2xl bg-sand-100 p-4 text-center">
            <p className="text-xs leading-relaxed text-teal-600">
              <strong>Medical Disclaimer:</strong> This summary is an observational record of app engagement and cognitive exercise participation. Recallia is not a medical device or diagnostic tool and does not provide clinical diagnoses of dementia, Alzheimer&apos;s, or any neurological condition. Consult qualified medical specialists for clinical evaluations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
