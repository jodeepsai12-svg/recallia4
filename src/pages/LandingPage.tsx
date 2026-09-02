import { Brain, BookOpen, Puzzle, Heart, ArrowRight, Check, Globe } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/i18n';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onOpenSettings?: () => void;
}

export function LandingPage({ onGetStarted, onSignIn, onOpenSettings }: LandingPageProps) {
  const { t, currentLanguageMeta } = useI18n();

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-teal-50 bg-sand-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-100/80 bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 sm:text-sm"
                title="Change language"
              >
                <Globe className="h-4 w-4 text-teal-600" />
                <span>{currentLanguageMeta.nativeName}</span>
              </button>
            )}
            <button
              onClick={onSignIn}
              className="rounded-xl px-4 py-2.5 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
            >
              {t.landing.signIn}
            </button>
            <button
              onClick={onGetStarted}
              className="btn-primary !px-5 !py-2.5 !text-base"
            >
              {t.landing.getStarted}
            </button>
          </div>
        </div>
      </nav>

      {/* Voice Guide Control Bar */}
      <VoiceGuideControlBar
        currentScreenInstruction={`${t.landing.heroTitle}. ${t.landing.heroText}`}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                <Heart className="h-4 w-4" />
                {t.landing.badge}
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 md:text-5xl">
                {t.landing.heroTitle}
              </h1>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-teal-700">
                {t.landing.heroText}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={onGetStarted} className="btn-primary">
                  {t.landing.ctaPrimary}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button onClick={onSignIn} className="btn-secondary">
                  {t.landing.ctaSecondary}
                </button>
              </div>
              <p className="mt-6 text-sm font-semibold text-teal-500">
                {t.landing.heroNote}
              </p>
            </div>

            {/* Illustration / Visual card */}
            <div className="relative">
              <div className="relative rounded-3xl border-2 border-teal-100 bg-white p-8 shadow-soft-lg md:p-10">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100">
                  <Brain className="h-10 w-10 text-teal-600" strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-2xl font-semibold text-teal-900">
                  {t.landing.cardTitle || 'Gentle Mind Exercises'}
                </h3>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-base font-semibold text-teal-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700 shrink-0">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <span>{t.landing.feature1 || 'Self-paced exercises with no timers or rush'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base font-semibold text-teal-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700 shrink-0">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <span>{t.landing.feature2 || 'Spoken voice guidance in your preferred language'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base font-semibold text-teal-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700 shrink-0">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <span>{t.landing.feature3 || 'Gentle daily routine to share with loved ones'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-teal-50 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-teal-900 md:text-4xl">
              {t.landing.howItWorksTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-teal-700">
              {t.landing.howItWorksSubtitle}
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="card text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 font-display text-2xl font-bold">
                1
              </div>
              <h3 className="font-display text-xl font-semibold text-teal-900">
                {t.landing.step1Title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-teal-700">
                {t.landing.step1Text}
              </p>
            </div>

            {/* Step 2 */}
            <div className="card text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 font-display text-2xl font-bold">
                2
              </div>
              <h3 className="font-display text-xl font-semibold text-teal-900">
                {t.landing.step2Title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-teal-700">
                {t.landing.step2Text}
              </p>
            </div>

            {/* Step 3 */}
            <div className="card text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-coral-100 text-coral-600 font-display text-2xl font-bold">
                3
              </div>
              <h3 className="font-display text-xl font-semibold text-teal-900">
                {t.landing.step3Title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-teal-700">
                {t.landing.step3Text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activity types preview */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-teal-900 md:text-4xl">
              {t.landing.activitiesTitle || 'Simple Daily Activities'}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-teal-700">
              {t.landing.activitiesSubtitle || 'Four gentle ways to keep your mind sharp and relaxed.'}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                <Brain className="h-7 w-7 text-teal-600" strokeWidth={2.5} />
              </div>
              <h4 className="font-display text-lg font-semibold text-teal-900">
                {t.landing.activity1Title || 'Memory Match'}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-teal-700">
                {t.landing.activity1Text || 'Gentle card and picture recall exercises.'}
              </p>
            </div>

            <div className="card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-200">
                <BookOpen className="h-7 w-7 text-sand-600" strokeWidth={2.5} />
              </div>
              <h4 className="font-display text-lg font-semibold text-teal-900">
                {t.landing.activity2Title || 'Words & Stories'}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-teal-700">
                {t.landing.activity2Text || 'Relaxing word games and pleasant stories.'}
              </p>
            </div>

            <div className="card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-100">
                <Puzzle className="h-7 w-7 text-coral-600" strokeWidth={2.5} />
              </div>
              <h4 className="font-display text-lg font-semibold text-teal-900">
                {t.landing.activity3Title || 'Mind Puzzles'}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-teal-700">
                {t.landing.activity3Text || 'Simple, self-paced pattern and shape puzzles.'}
              </p>
            </div>

            <div className="card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                <Heart className="h-7 w-7 text-teal-600" strokeWidth={2.5} />
              </div>
              <h4 className="font-display text-lg font-semibold text-teal-900">
                {t.landing.activity4Title || 'Daily Calm'}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-teal-700">
                {t.landing.activity4Text || 'Soothing breathing pauses and mindful reflections.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-50 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Logo />
          <p className="mt-4 text-sm font-semibold text-teal-500">
            {t.landing.footerNote || 'Gentle cognitive wellness designed for everyday comfort.'}
          </p>
          <p className="mt-2 text-xs text-sand-500">
            {t.landing.copyright || '© Recallia. All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
