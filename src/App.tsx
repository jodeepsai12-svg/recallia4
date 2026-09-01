import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { GamePlayer } from '@/pages/GamePlayer';
import type { GameType } from '@/types';

type View = 'landing' | 'signin' | 'signup' | 'dashboard' | 'game';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  // If signed in, show dashboard or game
  if (user) {
    if (view === 'game' && activeGame) {
      return (
        <GamePlayer
          gameType={activeGame}
          onExit={() => {
            setActiveGame(null);
            setView('dashboard');
          }}
        />
      );
    }
    return (
      <Dashboard
        onPlayGame={(gameType) => {
          setActiveGame(gameType);
          setView('game');
        }}
      />
    );
  }

  // Not signed in — route by view state
  if (view === 'signin' || view === 'signup') {
    return (
      <AuthPage
        mode={view}
        onBack={() => setView('landing')}
        onSuccess={() => setView('dashboard')}
        onToggleMode={() => setView(view === 'signin' ? 'signup' : 'signin')}
      />
    );
  }

  return (
    <LandingPage
      onGetStarted={() => setView('signup')}
      onSignIn={() => setView('signin')}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
