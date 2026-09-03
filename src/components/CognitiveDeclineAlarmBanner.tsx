import { useState, useEffect, useRef } from 'react';
import {
  Siren,
  Volume2,
  VolumeX,
  TrendingDown,
  CheckCircle2,
  PhoneCall,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import { useVoice } from '@/context/VoiceContext';
import type { CognitiveDeclineAlert } from '@/types';

interface CognitiveDeclineAlarmBannerProps {
  alert: CognitiveDeclineAlert;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onOpenReportModal?: () => void;
  contactPhone?: string;
}

export function CognitiveDeclineAlarmBanner({
  alert,
  onAcknowledge,
  onResolve,
  onOpenReportModal,
  contactPhone = '+919876543210',
}: CognitiveDeclineAlarmBannerProps) {
  const { speak } = useVoice();
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const stopSirenRef = useRef<(() => void) | null>(null);

  // Auto-play siren on initial mount if siren is active and unmuted
  useEffect(() => {
    if (alert.siren_active && !isMuted) {
      setIsPlayingSiren(true);
      const stopFn = sounds.playSirenAlarm(4);
      stopSirenRef.current = stopFn;

      const timer = setTimeout(() => {
        setIsPlayingSiren(false);
      }, 4000);

      return () => {
        clearTimeout(timer);
        if (stopSirenRef.current) {
          stopSirenRef.current();
        }
      };
    }
  }, [alert.id, alert.siren_active, isMuted]);

  const toggleSirenSound = () => {
    if (isPlayingSiren) {
      if (stopSirenRef.current) {
        stopSirenRef.current();
      }
      setIsPlayingSiren(false);
      setIsMuted(true);
    } else {
      setIsMuted(false);
      setIsPlayingSiren(true);
      const stopFn = sounds.playSirenAlarm(4.5);
      stopSirenRef.current = stopFn;
      setTimeout(() => setIsPlayingSiren(false), 4500);
    }
  };

  const handleReadAlertAloud = () => {
    const textToSpeak = `Progressive cognitive decline alarm for ${alert.participant_name}. ${alert.description}`;
    speak(textToSpeak);
  };

  const isCritical = alert.alarm_level === 'critical';
  const baselineTimeSec = (alert.baseline_response_time_ms / 1000).toFixed(1);
  const currentTimeSec = (alert.current_response_time_ms / 1000).toFixed(1);
  const latencyIncrease =
    alert.baseline_response_time_ms > 0
      ? Math.round(
          ((alert.current_response_time_ms - alert.baseline_response_time_ms) /
            alert.baseline_response_time_ms) *
            100
        )
      : 0;

  return (
    <section
      id="cognitive-decline-siren-alarm"
      className={`relative overflow-hidden rounded-3xl border-2 transition-all shadow-soft-lg animate-fade-in ${
        isCritical
          ? 'border-rose-500 bg-rose-50/95 text-rose-950'
          : 'border-amber-500 bg-amber-50/95 text-amber-950'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {/* Flashing Top Border Stripe */}
      <div
        className={`h-2 w-full ${
          isCritical
            ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse'
        }`}
      />

      <div className="p-5 sm:p-7">
        {/* Header with Siren Symbol & Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {/* Flashing / Pulsing Siren Symbol */}
            <div className="relative shrink-0">
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md ${
                  isCritical
                    ? 'bg-rose-600 ring-4 ring-rose-300 ring-offset-2 animate-bounce'
                    : 'bg-amber-600 ring-4 ring-amber-300 ring-offset-2 animate-pulse'
                }`}
                title="Siren Symbol: Progressive Cognitive Decline Alarm"
              >
                <Siren className="h-7 w-7 animate-spin [animation-duration:3s]" />
                {isPlayingSiren && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider ${
                    isCritical
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  <Siren className="h-3.5 w-3.5" />
                  {isCritical ? '🚨 Critical Siren Alarm' : '⚠️ Cognitive Decline Alarm'}
                </span>
                <span className="text-xs font-bold text-gray-600">
                  {new Date(alert.created_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {alert.status === 'acknowledged' && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                    Caregiver Acknowledged
                  </span>
                )}
              </div>

              <h2 className="font-display text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
                Progressive Cognitive Decline Alert · {alert.participant_name}
              </h2>
              <p className="text-sm font-semibold text-gray-800 sm:text-base">
                Immediate attention required: Continuous downward trajectory detected across recent cognitive sessions.
              </p>
            </div>
          </div>

          {/* Quick Sound & Expand Controls */}
          <div className="flex items-center gap-2 self-end sm:self-start">
            <button
              type="button"
              onClick={toggleSirenSound}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                isPlayingSiren
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400 animate-pulse'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              title={isPlayingSiren ? 'Mute siren alarm sound' : 'Sound siren alarm'}
            >
              {isPlayingSiren ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Siren Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>Sound Siren</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReadAlertAloud}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-300 px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors shadow-xs"
              title="Listen to verbal alert instructions"
            >
              <Activity className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden sm:inline">Listen</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-xl border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label={isExpanded ? 'Collapse alarm details' : 'Expand alarm details'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Primary Description Text */}
        <div className="mt-4 rounded-2xl bg-white/90 p-4 border border-rose-200/80 shadow-xs">
          <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
            {alert.description}
          </p>
        </div>

        {/* Expanded Detailed Breakdown */}
        {isExpanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Key Clinical Metric Indicators Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-rose-200 bg-white p-3.5 text-center shadow-xs">
                <span className="text-xs font-bold text-gray-600">Performance Drop</span>
                <p className="mt-1 font-display text-2xl font-black text-rose-600">
                  -{alert.decline_percentage}%
                </p>
                <span className="text-[11px] font-semibold text-rose-700">From baseline</span>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-white p-3.5 text-center shadow-xs">
                <span className="text-xs font-bold text-gray-600">Accuracy Shift</span>
                <p className="mt-1 font-display text-2xl font-black text-gray-900">
                  {alert.baseline_accuracy}% <span className="text-rose-600">→</span> {alert.current_accuracy}%
                </p>
                <span className="text-[11px] font-semibold text-gray-600">Baseline to Recent</span>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-white p-3.5 text-center shadow-xs">
                <span className="text-xs font-bold text-gray-600">Reaction Latency</span>
                <p className="mt-1 font-display text-2xl font-black text-amber-700">
                  +{currentTimeSec}s
                </p>
                <span className="text-[11px] font-semibold text-amber-800">Was {baselineTimeSec}s (+{latencyIncrease}%)</span>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-white p-3.5 text-center shadow-xs">
                <span className="text-xs font-bold text-gray-600">Consecutive Drops</span>
                <p className="mt-1 font-display text-2xl font-black text-gray-900">
                  {alert.consecutive_drop_count}
                </p>
                <span className="text-[11px] font-semibold text-gray-600">Sessions in a row</span>
              </div>
            </div>

            {/* Affected Cognitive Domains */}
            {alert.affected_areas && alert.affected_areas.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Affected Domains:</span>
                {alert.affected_areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-100/90 px-2.5 py-1 text-xs font-bold text-rose-900"
                  >
                    <TrendingDown className="h-3 w-3 text-rose-700" />
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* Clinical Context & Reversible Causes Guidance */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">
                    Clinical Note on Sudden or Progressive Cognitive Shifts:
                  </p>
                  <p className="text-amber-900 leading-relaxed font-medium">
                    Rapid performance dips in seniors are frequently secondary to treatable, acute conditions
                    such as dehydration, mild urinary tract infections (UTI), medication interactions or missed doses,
                    recent sleep disturbances, or physical fatigue. Prompt caregiver review can prevent distress.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Checklist for Caregivers */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                <HeartHandshake className="h-4 w-4 text-teal-600" />
                Recommended Caregiver Interventions:
              </h4>
              <ul className="mt-2.5 space-y-2">
                {alert.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-gray-800">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-800 text-[11px] font-black">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-soft transition-colors"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Call Loved One</span>
                </a>

                {onOpenReportModal && (
                  <button
                    type="button"
                    onClick={onOpenReportModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-colors"
                  >
                    <Printer className="h-4 w-4 text-teal-600" />
                    <span>Print Physician Summary</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {alert.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (stopSirenRef.current) stopSirenRef.current();
                      setIsPlayingSiren(false);
                      onAcknowledge(alert.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-700" />
                    <span>Acknowledge Alarm</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (stopSirenRef.current) stopSirenRef.current();
                    setIsPlayingSiren(false);
                    onResolve(alert.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-black text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Mark Handled & Resolved</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
