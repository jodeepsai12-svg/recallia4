import { useState, useEffect, type FormEvent } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  AlertCircle,
  Globe,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
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

export function AuthPage({
  mode,
  onBack,
  onSuccess,
  onToggleMode,
  onOpenSettings,
}: AuthPageProps) {
  const { signIn, signUp, signInWithDemo, startOfflineGuestSession } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { announce, speak } = useVoice();

  // Local mode allows instant seamless switching between Sign In & Create Account
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(mode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDemoSignIn = async (role: 'patient' | 'caregiver') => {
    setSubmitting(true);
    speak(role === 'caregiver' ? 'Signing in to Caregiver Portal...' : 'Welcome back, Mary. Opening your dashboard...');
    const result = await signInWithDemo(role);
    setSubmitting(false);
    if (!result.error) {
      announce('signin_success');
      onSuccess();
    }
  };

  useEffect(() => {
    setCurrentMode(mode);
    setError(null);
  }, [mode]);

  const isSignUp = currentMode === 'signup';

  const handleTabSwitch = (newMode: 'signin' | 'signup') => {
    if (newMode === currentMode) return;
    setCurrentMode(newMode);
    setError(null);
    if (newMode === 'signup') {
      speak('Create your account. Please enter your email and a password.');
    } else {
      speak('Welcome back. Please enter your email and password to sign in.');
    }
  };

  // Handle Email & Password Authentication (Sign In & Sign Up)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    speak(isSignUp ? 'Creating your account...' : 'Signing you in...');

    const result = isSignUp
      ? await signUp(cleanEmail, password, name)
      : await signIn(cleanEmail, password);

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
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
        >
          <ArrowLeft className="h-5 w-5" />
          {t.auth.back}
        </button>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100"
          >
            <Globe className="h-4 w-4 text-teal-600" />
            <span>{currentLanguageMeta.nativeName}</span>
          </button>
        )}
      </div>

      <VoiceGuideControlBar currentScreenInstruction={`${title}. ${subtitle}`} />

      {/* Main Form Content */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 pb-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-6 text-center">
            <div className="mb-5 flex justify-center">
              <Logo />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-teal-900">
              {title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-teal-600">
              {subtitle}
            </p>
          </div>

          <div className="card shadow-soft p-6 sm:p-8 border border-teal-100 bg-white">
            {/* Mode Switcher Tabs: Sign In / Create Account */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-sand-100 p-1">
              <button
                type="button"
                onClick={() => handleTabSwitch('signin')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  !isSignUp
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-700 hover:text-teal-900'
                }`}
              >
                <span>{t.auth.submitSignIn}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('signup')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  isSignUp
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-700 hover:text-teal-900'
                }`}
              >
                <span>{t.auth.submitSignUp}</span>
              </button>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="name-input" className="mb-1.5 block text-sm font-bold text-teal-800">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                    <input
                      id="name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mary Vance"
                      className="input-field pl-12"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email-input" className="mb-1.5 block text-sm font-bold text-teal-800">
                  Email (or Gmail address)
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="input-field pl-12"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-input" className="mb-1.5 block text-sm font-bold text-teal-800">
                  {t.auth.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                  <input
                    id="password-input"
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
                {isSignUp && (
                  <p className="mt-1 text-xs text-teal-600">
                    Must be at least 6 characters long.
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-coral-50 p-4 text-xs sm:text-sm font-semibold text-coral-700 border border-coral-200 animate-fade-in">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2 pt-3.5 pb-3.5 text-base font-bold shadow-soft"
              >
                {submitting ? (
                  <span>{t.auth.submitting}</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{isSignUp ? t.auth.submitSignUp : t.auth.submitSignIn}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Toggle Link */}
            <div className="mt-6 text-center border-t border-teal-50 pt-5">
              <p className="text-sm text-teal-600">
                {isSignUp ? t.auth.haveAccount : t.auth.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    handleTabSwitch(isSignUp ? 'signin' : 'signup');
                    onToggleMode();
                  }}
                  className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-900"
                >
                  {isSignUp ? t.auth.signInLink : t.auth.createLink}
                </button>
              </p>
            </div>

            {/* Quick Demo & Offline Guest Access */}
            <div className="mt-5 border-t border-teal-100/60 pt-4">
              <button
                type="button"
                onClick={async () => {
                  setSubmitting(true);
                  speak('Welcome! Starting offline guest mode. All exercises are ready.');
                  await startOfflineGuestSession('Mary Vance');
                  setSubmitting(false);
                  onSuccess();
                }}
                disabled={submitting}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-950 transition-colors hover:bg-amber-100"
              >
                <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Play Offline as Guest (No Password)</span>
              </button>

              <p className="text-center text-xs font-semibold text-teal-700 mb-2.5">
                Quick One-Click Demo Profiles
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('patient')}
                  disabled={submitting}
                  className="rounded-xl border border-teal-200 bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 text-center"
                >
                  👵 Mary Vance
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('caregiver')}
                  disabled={submitting}
                  className="rounded-xl border border-teal-200 bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 text-center"
                >
                  👩‍⚕️ Caregiver
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-teal-600">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span>Secure account authentication stored safely in Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
