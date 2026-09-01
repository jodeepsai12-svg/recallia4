import { useState, type FormEvent } from 'react';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';

interface AuthPageProps {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onSuccess: () => void;
  onToggleMode: () => void;
}

export function AuthPage({ mode, onBack, onSuccess, onToggleMode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
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
    } else {
      onSuccess();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      {/* Top bar */}
      <div className="px-6 py-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <h1 className="font-display text-3xl font-semibold text-teal-900">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-lg text-teal-600">
              {isSignUp
                ? 'Start your daily cognitive activities in less than a minute.'
                : 'Sign in to continue your daily activities.'}
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-base font-bold text-teal-800">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-12"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-base font-bold text-teal-800">
                  Password
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
                    placeholder="At least 6 characters"
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
                  ? 'Please wait...'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-base text-teal-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  onClick={onToggleMode}
                  className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-teal-400">
            Recallia does not diagnose dementia or measure medical cognitive decline.
          </p>
        </div>
      </div>
    </div>
  );
}
