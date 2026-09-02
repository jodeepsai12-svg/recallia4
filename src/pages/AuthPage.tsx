import { useState, useRef, type FormEvent } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  Phone,
  User,
  AlertCircle,
  Globe,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useVoice } from '@/context/VoiceContext';
import { VoiceGuideControlBar } from '@/components/VoiceGuideControlBar';
import type { ConfirmationResult } from 'firebase/auth';

interface AuthPageProps {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onSuccess: () => void;
  onToggleMode: () => void;
  onOpenSettings?: () => void;
}

type AuthMethod = 'google' | 'phone' | 'email';

export function AuthPage({
  mode,
  onBack,
  onSuccess,
  onToggleMode,
  onOpenSettings,
}: AuthPageProps) {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    setupRecaptcha,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth();
  const { t, currentLanguageMeta } = useI18n();
  const { announce, speak } = useVoice();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');

  // Email form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'enter_phone' | 'enter_otp'>('enter_phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const isSignUp = mode === 'signup';

  // Handle Google Auth
  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    speak('Signing in with Google...');

    const result = await signInWithGoogle();
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      announce('error_occurred');
    } else {
      announce('signin_success');
      onSuccess();
    }
  };

  // Handle Sending Phone OTP
  const handleSendPhoneOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      setError('Please enter your phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const appVerifier = setupRecaptcha('recaptcha-container');
      const res = await sendPhoneOtp(cleanPhone, appVerifier);

      setSubmitting(false);
      if (res.error || !res.confirmationResult) {
        setError(res.error || 'Failed to send OTP.');
        announce('error_occurred');
      } else {
        setConfirmationResult(res.confirmationResult);
        setPhoneStep('enter_otp');
        speak('6-digit OTP has been sent to your phone. Please enter it below.');
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Error sending SMS verification.');
    }
  };

  // Handle Verifying Phone OTP
  const handleVerifyPhoneOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit code received on your phone.');
      return;
    }

    setError(null);
    setSubmitting(true);
    speak('Verifying code...');

    const res = await verifyPhoneOtp(confirmationResult, otpCode);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      announce('error_occurred');
    } else {
      announce('signin_success');
      onSuccess();
    }
  };

  // Handle Email / Password submit
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = isSignUp
      ? await signUp(email, password, name)
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
      {/* Invisible reCAPTCHA container for Phone Auth */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

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

      {/* Form Area */}
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
            {/* Quick Google Sign In */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-teal-200 bg-white py-3 px-4 text-sm sm:text-base font-bold text-teal-900 transition-all hover:bg-teal-50 hover:border-teal-300 shadow-xs active:scale-[0.98] disabled:opacity-60"
              >
                {/* Official Google G SVG */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative mb-5 flex items-center justify-center">
              <div className="w-full border-t border-teal-100" />
              <span className="absolute bg-white px-3 text-xs font-bold text-teal-500 uppercase tracking-wider">
                or use phone / email
              </span>
            </div>

            {/* Auth Method Tabs */}
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-sand-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-bold transition-all ${
                  authMethod === 'email'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-700 hover:text-teal-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Email & Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-bold transition-all ${
                  authMethod === 'phone'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-700 hover:text-teal-900'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>Phone SMS OTP</span>
              </button>
            </div>

            {/* PHONE AUTH FLOW */}
            {authMethod === 'phone' && (
              <div>
                {phoneStep === 'enter_phone' ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div>
                      <label htmlFor="phone-input" className="mb-1.5 block text-sm font-bold text-teal-800">
                        Phone Number (with country code)
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                        <input
                          id="phone-input"
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="input-field pl-12"
                          autoComplete="tel"
                        />
                      </div>
                      <p className="mt-1 text-xs text-teal-600">
                        Enter your 10-digit mobile number with country code (e.g., +91 for India).
                      </p>
                    </div>

                    {error && (
                      <div className="space-y-2 rounded-2xl bg-coral-50 p-4 text-xs font-semibold text-coral-800 border border-coral-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral-600" />
                          <div className="flex-1 leading-relaxed">{error}</div>
                        </div>

                        {error.includes('Phone (SMS) authentication is not enabled') && (
                          <div className="pt-2 border-t border-coral-200/80 flex flex-col gap-2">
                            <span className="text-[11px] text-coral-700 font-bold">
                              Tip: You can instantly sign in using one of the other methods below:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-coral-300 text-teal-900 font-bold hover:bg-coral-50 transition-colors shadow-2xs text-xs"
                              >
                                <span>Sign In with Google</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAuthMethod('email');
                                  setError(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 text-white font-bold hover:bg-teal-900 transition-colors text-xs"
                              >
                                <span>Use Email & Password</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{submitting ? 'Sending SMS OTP...' : 'Send SMS Verification Code'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div className="rounded-2xl bg-teal-50 p-3 border border-teal-100 text-xs text-teal-800">
                      OTP sent to: <strong>{phoneNumber}</strong>
                    </div>

                    <div>
                      <label htmlFor="otp-input" className="mb-1.5 block text-sm font-bold text-teal-800">
                        Enter 6-Digit Verification Code
                      </label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                        <input
                          id="otp-input"
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="input-field pl-12 tracking-widest text-lg font-bold"
                          autoComplete="one-time-code"
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
                      disabled={submitting || otpCode.length < 6}
                      className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <span>{submitting ? 'Verifying...' : 'Verify & Sign In'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="flex justify-between items-center pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneStep('enter_phone');
                          setError(null);
                        }}
                        className="font-bold text-teal-700 hover:underline"
                      >
                        Change Number
                      </button>
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={submitting}
                        className="font-bold text-teal-700 hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* EMAIL / PASSWORD AUTH FLOW */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                  <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-teal-800">
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
                  <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-teal-800">
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
            )}

            {/* Switch between Sign In / Sign Up */}
            <div className="mt-6 text-center">
              <p className="text-sm text-teal-600">
                {isSignUp ? t.auth.haveAccount : t.auth.noAccount}{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
                >
                  {isSignUp ? t.auth.signInLink : t.auth.createLink}
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-teal-600">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span>Secure Firebase Authentication & Cloud Firestore</span>
          </div>
        </div>
      </div>
    </div>
  );
}
