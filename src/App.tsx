import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/i18n';
import { VoiceProvider, useVoice } from '@/context/VoiceContext';
import { LanguageOnboarding } from '@/components/LanguageOnboarding';
import { LanguageSettingsModal } from '@/components/LanguageSettingsModal';
import { PeacefulBreathingModal } from '@/components/PeacefulBreathingModal';
import { VoiceAssistantWidget } from '@/components/VoiceAssistantWidget';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { CaregiverDashboard } from '@/pages/CaregiverDashboard';
import { GamePlayer } from '@/pages/GamePlayer';
import type { GameType } from '@/types';

type View = 'landing' | 'signin' | 'signup' | 'dashboard' | 'game' | 'caregiver';

function AppContent() {
  const { user, loading } = useAuth();
  const { hasSelectedLanguage } = useI18n();
  const { setActionTriggerHandler, announce, speak } = useVoice();
  const [view, setView] = useState<View>('landing');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Bind voice actions trigger handler so voice assistant commands can autonomously navigate
  useEffect(() => {
    setActionTriggerHandler((action: string) => {
      if (action === 'play_recommended_game') {
        // Autonomously launch the recommended game
        // Picture Recall is the premier, gold-standard visual memory activity for elders
        speak('Opening your recommended game: Picture Recall, designed for calm visual focus.');
        announce('start_picture_recall');
        setActiveGame('picture_recall');
        setView('game');
      } else if (action === 'play_picture_recall') {
        announce('start_picture_recall');
        setActiveGame('picture_recall');
        setView('game');
      } else if (action === 'play_sequence_memory') {
        announce('start_sequence_memory');
        setActiveGame('sequence_memory');
        setView('game');
      } else if (action === 'play_object_association') {
        announce('start_object_association');
        setActiveGame('object_association');
        setView('game');
      } else if (action === 'play_story_recall') {
        announce('start_story_recall');
        setActiveGame('story_recall');
        setView('game');
      } else if (action === 'play_my_memories') {
        speak('Opening your personalized My Memories activity.');
        setActiveGame('my_memories');
        setView('game');
      } else if (action === 'open_caregiver') {
        announce('open_caregiver');
        setView('caregiver');
      } else if (action === 'open_settings') {
        announce('open_settings');
        setShowSettingsModal(true);
      } else if (action === 'start_breathing') {
        setShowBreathingModal(true);
      } else if (action === 'back_to_dashboard') {
        announce('back_to_dashboard');
        setActiveGame(null);
        setView(user ? 'dashboard' : 'landing');
      }
    });
  }, [announce, setActionTriggerHandler, speak, user]);

  // If user hasn't selected language yet, show full-screen onboarding screen
  if (!hasSelectedLanguage && !onboardingCompleted) {
    return <LanguageOnboarding onContinue={() => setOnboardingCompleted(true)} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  // Active Game View (accessible for both signed-in and guest elders)
  if (view === 'game' && activeGame) {
    return (
      <>
        <GamePlayer
          gameType={activeGame}
          onExit={() => {
            announce('back_to_dashboard');
            setActiveGame(null);
            setView(user ? 'dashboard' : 'landing');
          }}
          onOpenSettings={() => {
            announce('open_settings');
            setShowSettingsModal(true);
          }}
        />
        <LanguageSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
        <PeacefulBreathingModal
          isOpen={showBreathingModal}
          onClose={() => setShowBreathingModal(false)}
        />
        <VoiceAssistantWidget />
      </>
    );
  }

  // Caregiver Portal View (accessible for both signed-in and guest elders)
  if (view === 'caregiver') {
    return (
      <>
        <CaregiverDashboard
          onBackToActivities={() => {
            announce('back_to_dashboard');
            setView(user ? 'dashboard' : 'landing');
          }}
          onOpenSettings={() => {
            announce('open_settings');
            setShowSettingsModal(true);
          }}
        />
        <LanguageSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
        <PeacefulBreathingModal
          isOpen={showBreathingModal}
          onClose={() => setShowBreathingModal(false)}
        />
        <VoiceAssistantWidget />
      </>
    );
  }

  // If signed in, show dashboard
  if (user) {
    return (
      <>
        <Dashboard
          onPlayGame={(gameType) => {
            if (gameType === 'picture_recall') announce('start_picture_recall');
            else if (gameType === 'sequence_memory') announce('start_sequence_memory');
            else if (gameType === 'object_association') announce('start_object_association');
            else if (gameType === 'story_recall') announce('start_story_recall');
            else if (gameType === 'my_memories') speak('Opening your personalized My Memories activity.');
            setActiveGame(gameType);
            setView('game');
          }}
          onOpenSettings={() => {
            announce('open_settings');
            setShowSettingsModal(true);
          }}
          onOpenCaregiver={() => {
            announce('open_caregiver');
            setView('caregiver');
          }}
        />
        <LanguageSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
        <PeacefulBreathingModal
          isOpen={showBreathingModal}
          onClose={() => setShowBreathingModal(false)}
        />
        <VoiceAssistantWidget />
      </>
    );
  }

  // Not signed in — route by view state
  if (view === 'signin' || view === 'signup') {
    return (
      <>
        <AuthPage
          mode={view}
          onBack={() => {
            announce('back_to_dashboard');
            setView('landing');
          }}
          onSuccess={() => {
            announce(view === 'signup' ? 'signup_success' : 'signin_success');
            setView('dashboard');
          }}
          onToggleMode={() => setView(view === 'signin' ? 'signup' : 'signin')}
          onOpenSettings={() => {
            announce('open_settings');
            setShowSettingsModal(true);
          }}
        />
        <LanguageSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
        <VoiceAssistantWidget />
      </>
    );
  }

  return (
    <>
      <LandingPage
        onGetStarted={() => {
          announce('welcome_home');
          setView('signup');
        }}
        onSignIn={() => {
          setView('signin');
        }}
        onOpenSettings={() => {
          announce('open_settings');
          setShowSettingsModal(true);
        }}
      />
      <LanguageSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      <PeacefulBreathingModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
      <VoiceAssistantWidget />
    </>
  );
}

function App() {
  return (
    <I18nProvider>
      <VoiceProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </VoiceProvider>
    </I18nProvider>
  );
}

export default App;
