import { useState } from 'react';
import { Check, Globe, ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LANGUAGES, type SupportedLanguageCode } from '@/i18n';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';

interface LanguageOnboardingProps {
  onContinue: () => void;
}

const LANGUAGE_GREETINGS: Record<SupportedLanguageCode, string> = {
  as: 'নমস্কাৰ, অসমীয়া ভাষালৈ আদৰণি।',
  nyi: 'Aying! Nyishi agom ho gumchi gumna doolo.',
  mni: 'ꯈꯨꯔꯨꯝꯖꯔꯤ, ꯃꯤꯇꯩ ꯂꯣꯟꯗꯥ ꯇꯔꯥꯝꯅꯥ ꯑꯣꯛꯆꯔꯤ꯫',
  kha: 'Khublei, sngewbha ban jied ia ka ktien Khasi.',
  lus: 'Chibai, Mizo ṭawng i thlang e.',
  ao: 'Salam, Ao oshi nung pelaa agizüker.',
  ne: 'नमस्ते, नेपाली भाषामा स्वागत छ।',
  kok: 'Khulumkha, Kokborok kokno seichha.',
  en: 'Welcome, you have selected English.',
};

export function LanguageOnboarding({ onContinue }: LanguageOnboardingProps) {
  const { language, setLanguage, t } = useI18n();
  const { speak, announce } = useVoice();
  const [selectedCode, setSelectedCode] = useState<SupportedLanguageCode>(language || 'as');

  const handleSelect = (code: SupportedLanguageCode) => {
    setSelectedCode(code);
    setLanguage(code);
    const greeting = LANGUAGE_GREETINGS[code] || LANGUAGE_GREETINGS.en;
    speak(greeting, code);
  };

  const handleProceed = () => {
    setLanguage(selectedCode);
    announce('language_selected', selectedCode);
    onContinue();
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      {/* Header Bar */}
      <header className="border-b border-teal-50 bg-sand-50/90 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-800">
            <Globe className="h-4 w-4 text-teal-600" />
            North-East Regional Languages
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-10 sm:py-16">
        <div className="mb-10 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral-50 px-4 py-2 text-sm font-bold text-coral-600">
            <Sparkles className="h-4 w-4 text-coral-500" />
            Welcome to Recallia • AI Voice Enabled
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900 sm:text-4xl lg:text-5xl">
            Choose your preferred language
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-teal-700">
            Select the language you feel most comfortable with. All voice guidance, audio instructions, and AI assistance will respond in this language.
          </p>
        </div>

        {/* 9 Large Elderly-Friendly Language Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedCode === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                type="button"
                className={`group relative flex flex-col justify-between rounded-3xl p-6 text-left transition-all duration-200 active:scale-[0.98] ${
                  isSelected
                    ? 'border-2 border-teal-600 bg-white shadow-soft-lg ring-4 ring-teal-100'
                    : 'border-2 border-sand-200/80 bg-white shadow-soft hover:border-teal-300 hover:shadow-soft-lg'
                }`}
              >
                <div>
                  {/* Top State Badge & Selection Check */}
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        isSelected
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-sand-100 text-sand-600 group-hover:bg-teal-50 group-hover:text-teal-700'
                      }`}
                    >
                      {lang.state}
                    </span>

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'border-2 border-sand-200 text-transparent group-hover:border-teal-300'
                      }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                  </div>

                  {/* Native Script Display (Large & Clear for Seniors) */}
                  <h2 className="font-display text-2xl font-bold text-teal-900 sm:text-3xl">
                    {lang.nativeName}
                  </h2>

                  {/* English Name & Format */}
                  <p className="mt-1 text-base font-semibold text-teal-600">
                    {lang.name}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-sand-100 pt-3 text-sm">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${isSelected ? 'text-teal-700 font-bold' : 'text-teal-500'}`}>
                    <Volume2 className="h-4 w-4" />
                    {isSelected ? '✓ Spoken Guide Active' : 'Tap to hear & select'}
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      isSelected
                        ? 'text-teal-600 translate-x-0.5'
                        : 'text-sand-400 group-hover:text-teal-500 group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Action Button */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 animate-fade-in-up">
          <button
            onClick={handleProceed}
            className="btn-primary flex w-full max-w-md items-center justify-center gap-3 !py-4 !text-lg"
          >
            <span>{t.languageSelect?.continue || 'Continue to Recallia'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-xs font-semibold text-teal-500">
            You can also ask the AI Voice Assistant to change languages anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
