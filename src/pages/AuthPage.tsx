import { useState, type FormEvent } from 'react';
import { ArrowLeft, Mail, Lock, AlertCircle, Globe } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';

interface AuthPageProps {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onSuccess: () => void;
  onToggleMode: () => void;
  onOpenSettings?: () => void;
}

export function AuthPage({ mode, onBack, onSuccess, onToggleMode, onOpenSettings }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { announce } = useVoice();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      announce('error_occurred');
    } else {
      announce(isSignUp ? 'signup_success' : 'signin_success');
      onSuccess();
    }
  };

  const title = isSignUp ? t.auth.signUpTitle : t.auth.signInTitle;
  const subtitle = isSignUp ? t.auth.signUpSubtitle : t.auth.signInSubtitle;

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
        >
          <ArrowLeft className="h-5 w-5" />
          {t.auth.back}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100"
          >
            <Globe className="h-4 w-4 text-teal-600" />
            <span>{currentLanguageMeta.nativeName}</span>
          </button>
        )}
      </div>

      <VoiceGuideControlBar currentScreenInstruction={`${title}. ${subtitle}`} />

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <h1 className="font-display text-3xl font-semibold text-teal-900">
              {title}
            </h1>
            <p className="mt-2 text-lg text-teal-600">
              {subtitle}
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-base font-bold text-teal-800">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className="input-field pl-12"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-base font-bold text-teal-800">
                  {t.auth.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className="input-field pl-12"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60"
              >
                {submitting
                  ? t.auth.submitting
                  : isSignUp
                    ? t.auth.submitSignUp
                    : t.auth.submitSignIn}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-base text-teal-600">
                {isSignUp ? t.auth.haveAccount : t.auth.noAccount}{' '}
                <button
                  onClick={onToggleMode}
                  className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
                >
                  {isSignUp ? t.auth.signInLink : t.auth.createLink}
                </button>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-teal-400">
            {t.auth.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
