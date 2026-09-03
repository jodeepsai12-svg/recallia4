import React, { useState } from 'react';
import {
  Trophy,
  Siren,
  ShieldCheck,
  Globe,
  Wind,
  PhoneCall,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Home,
  Layers,
  UserCheck,
} from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useI18n, type SupportedLanguageCode } from '@/i18n';
import type { GameType } from '@/types';

export interface HackathonDemoBarProps {
  currentView: 'landing' | 'signin' | 'signup' | 'dashboard' | 'game' | 'caregiver';
  activeGame: GameType | null;
  isDeclineAlarmActive: boolean;
  onNavigate: (view: 'landing' | 'dashboard' | 'caregiver' | 'game', gameType?: GameType) => void;
  onToggleDeclineAlarm: (active: boolean) => void;
  onOpenBreathing: () => void;
  onOpenEmergencySOS: () => void;
  onOpenPhysicianReport: () => void;
}

export const HackathonDemoBar: React.FC<HackathonDemoBarProps> = ({
  currentView,
  activeGame,
  isDeclineAlarmActive,
  onNavigate,
  onToggleDeclineAlarm,
  onOpenBreathing,
  onOpenEmergencySOS,
  onOpenPhysicianReport,
}) => {
  const { speak } = useVoice();
  const { language, setLanguage, languages } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const handleLanguageSwitch = (langCode: SupportedLanguageCode, langName: string) => {
    setLanguage(langCode);
    speak(`Switched language to ${langName}. Voice guide active.`);
  };

  const handleDeclineToggle = (shouldActivate: boolean) => {
    onToggleDeclineAlarm(shouldActivate);
    if (shouldActivate) {
      speak(
        'Triggering progressive cognitive decline alarm. Siren symbol activated and navigating to Caregiver Portal.'
      );
      if (currentView !== 'caregiver') {
        onNavigate('caregiver');
      }
    } else {
      speak('Progressive cognitive decline alarm deactivated. Patient returned to healthy baseline.');
    }
  };

  return (
    <aside
      id="hackathon-presentation-bar"
      aria-label="Hackathon Presentation Demo Mode Controller"
      className="fixed bottom-3 right-3 z-50 max-w-[calc(100vw-24px)] md:bottom-4 md:right-4"
    >
      {/* Floating Minimized Pill when collapsed */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2.5 rounded-2xl border-2 border-amber-400 bg-teal-950 px-4 py-2.5 text-white shadow-soft-lg transition-all hover:scale-105 hover:bg-teal-900"
          title="Expand Hackathon Presentation Controller"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400 text-teal-950">
            <Trophy className="h-4 w-4 fill-current" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide text-amber-300 uppercase">
                Hackathon Demo
              </span>
              {isDeclineAlarmActive && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="text-[11px] font-medium text-teal-200">
              {isDeclineAlarmActive ? '🚨 Siren Alarm Active' : '🟢 Healthy Baseline'} • Click to Open
            </span>
          </div>
          <ChevronUp className="h-4 w-4 text-amber-300 transition-transform group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Expanded Presentation Dock */}
      {isExpanded && (
        <div className="w-[360px] sm:w-[480px] max-h-[85vh] overflow-y-auto rounded-3xl border-2 border-amber-400 bg-slate-950/95 text-slate-100 p-4 shadow-soft-xl backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-xs">
                <Trophy className="h-4 w-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-wide text-white">
                    Recallia Presentation Demo
                  </h3>
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase">
                    Live Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Instant 1-click feature showcase for hackathon judges
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Minimize controller"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Section 1: Progressive Cognitive Decline Alarm (PITCH HIGHLIGHT) */}
          <div className="mt-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Siren className={`h-4 w-4 ${isDeclineAlarmActive ? 'text-rose-400 animate-spin [animation-duration:3s]' : 'text-slate-400'}`} />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Progressive Decline Alarm
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isDeclineAlarmActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isDeclineAlarmActive ? '🚨 ALARM ACTIVE' : '🟢 NORMAL BASELINE'}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-300 leading-tight">
              {isDeclineAlarmActive
                ? 'Decline alarm is active: Mary Vance dropped -38% accuracy with +4.8s reaction latency. Siren banner & clinical warning are showing.'
                : 'Decline alarm is OFF: Normal patient baseline (92% accuracy, stable speed). No siren sign.'}
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDeclineToggle(false)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                  !isDeclineAlarmActive
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>Normal Baseline</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeclineToggle(true)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                  isDeclineAlarmActive
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400 animate-pulse'
                    : 'bg-rose-950/60 text-rose-200 border border-rose-800/80 hover:bg-rose-900/60'
                }`}
              >
                <Siren className="h-3.5 w-3.5 text-rose-300" />
                <span>Simulate Decline</span>
              </button>
            </div>
          </div>

          {/* Section 2: Quick Navigation Fast-Lane */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Quick Navigation</span>
              <span className="text-[10px] text-amber-400">Current: {currentView}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Senior Home</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('caregiver')}
                className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  currentView === 'caregiver'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Caregiver Portal</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  currentView === 'landing'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Landing Page</span>
              </button>
            </div>
          </div>

          {/* Section 3: 5 Cognitive Games Direct Launch */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Play 5 Cognitive Games</span>
              <span className="text-[10px] text-teal-400">100% Offline</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate('game', 'picture_recall')}
                className={`flex items-center gap-1.5 rounded-xl p-2 text-left text-[11px] font-medium transition-all ${
                  currentView === 'game' && activeGame === 'picture_recall'
                    ? 'bg-teal-600 text-white font-bold ring-1 ring-teal-300'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>🖼️</span>
                <span className="truncate">Picture Recall</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('game', 'sequence_memory')}
                className={`flex items-center gap-1.5 rounded-xl p-2 text-left text-[11px] font-medium transition-all ${
                  currentView === 'game' && activeGame === 'sequence_memory'
                    ? 'bg-teal-600 text-white font-bold ring-1 ring-teal-300'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>🔢</span>
                <span className="truncate">Sequence</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('game', 'object_association')}
                className={`flex items-center gap-1.5 rounded-xl p-2 text-left text-[11px] font-medium transition-all ${
                  currentView === 'game' && activeGame === 'object_association'
                    ? 'bg-teal-600 text-white font-bold ring-1 ring-teal-300'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>🧩</span>
                <span className="truncate">Association</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('game', 'story_recall')}
                className={`flex items-center gap-1.5 rounded-xl p-2 text-left text-[11px] font-medium transition-all ${
                  currentView === 'game' && activeGame === 'story_recall'
                    ? 'bg-teal-600 text-white font-bold ring-1 ring-teal-300'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>📖</span>
                <span className="truncate">Story Recall</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('game', 'my_memories')}
                className={`col-span-2 sm:col-span-2 flex items-center gap-1.5 rounded-xl p-2 text-left text-[11px] font-medium transition-all ${
                  currentView === 'game' && activeGame === 'my_memories'
                    ? 'bg-pink-600 text-white font-bold ring-1 ring-pink-300'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>💖</span>
                <span className="truncate">My Memories (Family Photos)</span>
              </button>
            </div>
          </div>

          {/* Section 4: Key Modals & Live Features */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onOpenBreathing}
              className="flex items-center justify-center gap-1 rounded-xl bg-teal-950/80 border border-teal-800/80 p-2 text-[11px] font-semibold text-teal-200 hover:bg-teal-900 transition-colors"
            >
              <Wind className="h-3.5 w-3.5 text-teal-400" />
              <span>Breathing</span>
            </button>

            <button
              type="button"
              onClick={onOpenEmergencySOS}
              className="flex items-center justify-center gap-1 rounded-xl bg-rose-950/80 border border-rose-800/80 p-2 text-[11px] font-semibold text-rose-200 hover:bg-rose-900 transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-rose-400" />
              <span>Senior SOS</span>
            </button>

            <button
              type="button"
              onClick={onOpenPhysicianReport}
              className="flex items-center justify-center gap-1 rounded-xl bg-indigo-950/80 border border-indigo-800/80 p-2 text-[11px] font-semibold text-indigo-200 hover:bg-indigo-900 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Print Report</span>
            </button>
          </div>

          {/* Section 5: Multilingual Voice Demonstration */}
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                <span>Multilingual Voice Showcase</span>
              </div>
              <span className="text-[10px] text-slate-400">Speaks out loud</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {languages.slice(0, 6).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSwitch(lang.code, lang.name)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                    language === lang.code
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lang.flag} {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Presenter Pitch Cheatsheet Toggle */}
          <div className="mt-3 border-t border-slate-800 pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
            >
              <Sparkles className="h-3 w-3" />
              <span>{showCheatSheet ? 'Hide Hackathon Pitch Script' : 'Show 4-Pillar Pitch Script'}</span>
            </button>

            {showCheatSheet && (
              <div className="mt-2 text-left rounded-xl bg-slate-900 p-2.5 text-[11px] text-slate-300 space-y-1.5 border border-slate-800">
                <p>
                  <strong className="text-amber-300">1. Senior Accessibility:</strong> Zero-login guest mode, high-contrast, text-to-speech audio reader, and big touch targets.
                </p>
                <p>
                  <strong className="text-amber-300">2. 5 Cognitive Games:</strong> Clinically modeled working memory, sequence memory, comprehension, and personalized family photo reminiscence.
                </p>
                <p>
                  <strong className="text-amber-300">3. Progressive Decline Siren Alarm:</strong> Longitudinal statistical baseline engine alerts caregivers to sudden drops caused by reversible medical conditions (UTI, dehydration, medication changes).
                </p>
                <p>
                  <strong className="text-amber-300">4. 100% Offline & PWA:</strong> Built for rural and low-connectivity environments; syncs seamlessly to Firestore when connected.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
