import { Brain, BookOpen, Puzzle, Heart, ArrowRight, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-teal-50 bg-sand-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="rounded-xl px-5 py-2.5 text-base font-bold text-teal-700 transition-colors hover:bg-teal-50"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="btn-primary !px-6 !py-3 !text-base"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                <Heart className="h-4 w-4" />
                Cognitive wellness, made gentle
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 md:text-5xl">
                Keep your mind active with calm, daily activities
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-teal-700">
                Recallia offers simple, enjoyable exercises designed to help you stay
                mentally engaged. Just a few minutes a day, at your own pace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={onGetStarted} className="btn-primary">
                  Start your first activity
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button onClick={onSignIn} className="btn-secondary">
                  I already have an account
                </button>
              </div>
              <p className="mt-6 text-sm font-semibold text-teal-500">
                No medical diagnosis. No pressure. Just gentle practice.
              </p>
            </div>

            {/* Illustration card */}
            <div className="relative animate-fade-in-up [animation-delay:150ms]">
              <div className="card relative overflow-hidden p-8">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-50" />
                <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-coral-50" />
                <div className="relative">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                      <Brain className="h-7 w-7 text-teal-600" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold text-teal-900">
                        Today's Activity
                      </p>
                      <p className="text-sm font-semibold text-teal-500">5 minutes · Gentle</p>
                    </div>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-teal-900">
                    Memory Match
                  </h3>
                  <p className="mt-2 text-base text-teal-600">
                    Flip cards to find matching pairs and give your memory a gentle workout.
                  </p>
                  <div className="mt-6 flex items-center gap-2 rounded-2xl bg-sand-100 px-4 py-3">
                    <Check className="h-5 w-5 text-teal-600" strokeWidth={3} />
                    <span className="text-sm font-bold text-teal-700">
                      Recommended based on your recent activity
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-teal-50 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="text-center font-display text-3xl font-semibold text-teal-900 md:text-4xl">
            Simple activities, real engagement
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-teal-600">
            Each exercise is designed to be approachable, enjoyable, and easy to follow.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Brain,
                title: 'Memory',
                text: 'Gentle recall games that exercise your ability to remember and recognize.',
                color: 'teal',
              },
              {
                icon: BookOpen,
                title: 'Language',
                text: 'Story sequencing and word activities that keep your reading skills sharp.',
                color: 'coral',
              },
              {
                icon: Puzzle,
                title: 'Problem Solving',
                text: 'Calming puzzles that invite you to think at your own comfortable pace.',
                color: 'sand',
              },
            ].map((feature) => (
              <div key={feature.title} className="card transition-shadow hover:shadow-soft-lg">
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    feature.color === 'teal'
                      ? 'bg-teal-100'
                      : feature.color === 'coral'
                        ? 'bg-coral-100'
                        : 'bg-sand-200'
                  }`}
                >
                  <feature.icon
                    className={`h-7 w-7 ${
                      feature.color === 'teal'
                        ? 'text-teal-600'
                        : feature.color === 'coral'
                          ? 'text-coral-600'
                          : 'text-sand-500'
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="font-display text-xl font-semibold text-teal-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base text-teal-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-sand-50">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-center font-display text-3xl font-semibold text-teal-900 md:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Sign in', text: 'Create your account or sign in to get started.' },
              { step: '2', title: 'See your activity', text: 'Each day, we suggest one gentle exercise for you.' },
              { step: '3', title: 'Track progress', text: 'See what you have completed and celebrate your consistency.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 font-display text-xl font-bold text-white shadow-soft">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-teal-900">{item.title}</h3>
                <p className="mt-2 text-base text-teal-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20 text-center">
          <h2 className="font-display text-3xl font-semibold text-teal-900 md:text-4xl">
            Ready to keep your mind active?
          </h2>
          <p className="mt-4 text-lg text-teal-600">
            It takes less than a minute to get started. No medical diagnosis, no pressure.
          </p>
          <button onClick={onGetStarted} className="btn-primary mt-8">
            Create your free account
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-50 bg-sand-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo />
            <p className="text-sm font-semibold text-teal-500">
              Recallia does not diagnose dementia or measure medical cognitive decline.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
