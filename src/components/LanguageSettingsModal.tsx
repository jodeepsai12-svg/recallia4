import { Check, X, Globe, Sparkles, Volume2, VolumeX, Gauge } from 'lucide-react';
import { LANGUAGES, type SupportedLanguageCode } from '@/i18n';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';

interface LanguageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageSettingsModal({ isOpen, onClose }: LanguageSettingsModalProps) {
  const { language, setLanguage, t } = useI18n();
  const {
    isVoiceGuideEnabled,
    setVoiceGuideEnabled,
    voiceRate,
    setVoiceRate,
    announce,
    speak,
  } = useVoice();

  if (!isOpen) return null;

  const handleSelect = (code: SupportedLanguageCode) => {
    setLanguage(code);
    announce('language_selected', code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-sand-50 shadow-2xl border border-teal-100 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-teal-100/70 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-teal-900">
                {t.settings.language} & AI Voice Settings
              </h2>
              <p className="text-xs font-semibold text-teal-600">
                {t.settings.languageDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-100 text-teal-700 transition-colors hover:bg-sand-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Voice Guide Controls Section */}
          <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-teal-900">
                  <Volume2 className="h-4 w-4 text-teal-600" />
                  Spoken Voice Guide & Screen Announcements
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reads page instructions, buttons, game steps, and results aloud in your selected language.
                </p>
              </div>
              <button
                onClick={() => {
                  const nextState = !isVoiceGuideEnabled;
                  setVoiceGuideEnabled(nextState);
                  if (nextState) {
                    speak('ভয়েচ গাইড সক্ষম কৰা হ’ল।', language);
                  }
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  isVoiceGuideEnabled
                    ? 'bg-teal-700 text-white hover:bg-teal-800'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isVoiceGuideEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" /> Enabled
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" /> Muted
                  </>
                )}
              </button>
            </div>

            {/* Speech Speed Setting */}
            {isVoiceGuideEnabled && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-teal-600" /> Speech Pace
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Slow (0.75x)', val: 0.75 },
                    { label: 'Gentle (0.85x)', val: 0.85 },
                    { label: 'Normal (1.0x)', val: 1.0 },
                  ].map((rate) => (
                    <button
                      key={rate.val}
                      onClick={() => setVoiceRate(rate.val)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        voiceRate === rate.val
                          ? 'bg-teal-100 text-teal-900 ring-1 ring-teal-300 font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 9 Language Options */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-coral-500" />
              Select Spoken & Display Language
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;

                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`flex flex-col justify-between rounded-2xl p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-teal-600 bg-white shadow-soft ring-2 ring-teal-200'
                        : 'border border-sand-200 bg-white hover:border-teal-300 hover:bg-teal-50/40'
                    }`}
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                          {lang.state}
                        </span>
                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p className="font-display text-lg font-bold text-teal-900">
                        {lang.nativeName}
                      </p>
                      <p className="text-xs font-semibold text-teal-600">
                        {lang.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-teal-100/70 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="btn-primary !px-6 !py-2.5 !text-base"
          >
            {t.common.close || 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
