import { Volume2, VolumeX, Sparkles, Gauge } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useI18n } from '@/i18n';

interface VoiceGuideControlBarProps {
  currentScreenInstruction?: string;
  className?: string;
}

export function VoiceGuideControlBar({ currentScreenInstruction, className = '' }: VoiceGuideControlBarProps) {
  const {
    isVoiceGuideEnabled,
    setVoiceGuideEnabled,
    voiceRate,
    setVoiceRate,
    isSpeaking,
    speak,
    stopSpeaking,
    setAssistantOpen,
  } = useVoice();

  const { currentLanguageMeta, language } = useI18n();

  const toggleVoice = () => {
    if (isSpeaking) stopSpeaking();
    setVoiceGuideEnabled(!isVoiceGuideEnabled);
  };

  const handleReplayInstruction = () => {
    if (!currentScreenInstruction) return;
    speak(currentScreenInstruction, language);
  };

  const cyclePace = () => {
    const nextRate = voiceRate === 0.85 ? 1.0 : voiceRate === 1.0 ? 0.75 : 0.85;
    setVoiceRate(nextRate);
  };

  return (
    <aside aria-label="Voice guide controls" className={`border-b border-teal-100/80 bg-teal-50/60 px-4 py-2 text-xs text-teal-900 ${className}`}>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isSpeaking ? 'bg-amber-400 opacity-75' : isVoiceGuideEnabled ? 'bg-teal-400 opacity-75' : 'bg-slate-300'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSpeaking ? 'bg-amber-500' : isVoiceGuideEnabled ? 'bg-teal-600' : 'bg-slate-400'
              }`}
            ></span>
          </span>
          <span className="font-semibold text-teal-950">
            {isVoiceGuideEnabled ? (
              <>
                Voice Guide Active: <span className="font-bold text-teal-800">{currentLanguageMeta.nativeName}</span> ({currentLanguageMeta.state})
              </>
            ) : (
              <span className="text-slate-500">Voice Guide Muted</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Replay screen instruction if provided */}
          {currentScreenInstruction && isVoiceGuideEnabled && (
            <button
              onClick={handleReplayInstruction}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-bold text-teal-800 shadow-2xs hover:bg-teal-50 transition-colors"
              title="Hear page instructions aloud"
            >
              <Volume2 className="h-3.5 w-3.5 text-teal-600" />
              <span>Read Aloud</span>
            </button>
          )}

          {/* Voice Pace Selector */}
          <button
            onClick={cyclePace}
            className="inline-flex items-center gap-1 rounded-lg border border-teal-200/80 bg-white/90 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100/80 transition-colors"
            title="Adjust Voice Speed (Elderly Pace)"
          >
            <Gauge className="h-3 w-3 text-teal-600" />
            <span>{voiceRate === 0.85 ? 'Gentle (0.85x)' : voiceRate === 1.0 ? 'Normal (1.0x)' : 'Slow (0.75x)'}</span>
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={toggleVoice}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
              isVoiceGuideEnabled
                ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            title={isVoiceGuideEnabled ? 'Mute Voice Guide' : 'Enable Voice Guide'}
          >
            {isVoiceGuideEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span>Mute</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span>Unmute</span>
              </>
            )}
          </button>

          {/* AI Voice Assistant Trigger */}
          <button
            onClick={() => setAssistantOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-teal-800 transition-all active:scale-95"
            title="Ask Voice Assistant"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>AI Voice</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
