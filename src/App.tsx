import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/i18n';
import { VoiceProvider, useVoice } from '@/context/VoiceContext';
import { LanguageOnboarding } from '@/components/LanguageOnboarding';
import { LanguageSettingsModal } from '@/components/LanguageSettingsModal';
import { PeacefulBreathingModal } from '@/components/PeacefulBreathingModal';
import { EmergencyModal } from '@/components/EmergencyModal';
import { HackathonDemoBar } from '@/components/HackathonDemoBar';
import { VoiceAssistantWidget } from '@/components/VoiceAssistantWidget';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { CaregiverDashboard } from '@/pages/CaregiverDashboard';
import { GamePlayer } from '@/pages/GamePlayer';
import type { GameType } from '@/types';

type View = 'landing' | 'signin' | 'signup' | 'dashboard' | 'game' | 'caregiver';

function AppContent() {
  const { user, loading, startOfflineGuestSession } = useAuth();
  const { hasSelectedLanguage } = useI18n();
  const { setActionTriggerHandler, announce, speak } = useVoice();
  const [view, setView] = useState<View>('landing');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showCaregiverReportModal, setShowCaregiverReportModal] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isDeclineAlarmActive, setIsDeclineAlarmActive] = useState<boolean>(
    () => localStorage.getItem('recallia_simulating_decline') === 'true'
  );

  // Bind voice actions trigger handler so voice assistant commands can autonomously navigate
  useEffect(() => {
    setActionTriggerHandler((action: string) => {
      if (action === 'play_recommended_game') {
        // Autonomously launch the recommended game
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

  const renderContent = () => {
    // Active Game View (accessible for both signed-in and guest elders)
    if (view === 'game' && activeGame) {
      return (
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
      );
    }

    // Caregiver Portal View (accessible for both signed-in and guest elders)
    if (view === 'caregiver') {
      return (
        <CaregiverDashboard
          onBackToActivities={() => {
            announce('back_to_dashboard');
            setView(user ? 'dashboard' : 'landing');
          }}
          onOpenSettings={() => {
            announce('open_settings');
            setShowSettingsModal(true);
          }}
          isSimulatingDeclineProp={isDeclineAlarmActive}
          onDeclineSimulationChange={(active) => setIsDeclineAlarmActive(active)}
          showReportModalProp={showCaregiverReportModal}
          onCloseReportModalProp={() => setShowCaregiverReportModal(false)}
        />
      );
    }

    // If signed in or guest session active, show dashboard
    if (user) {
      return (
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
      );
    }

    // Not signed in — route by view state
    if (view === 'signin' || view === 'signup') {
      return (
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
      );
    }

    return (
      <LandingPage
        onGetStarted={() => {
          announce('welcome_home');
          setView('signup');
        }}
        onSignIn={() => {
          setView('signin');
        }}
        onStartOffline={async () => {
          speak('Welcome to Recallia. Starting offline exercises.');
          await startOfflineGuestSession('Mary Vance');
          announce('welcome_home');
          setView('dashboard');
        }}
        onOpenSettings={() => {
          announce('open_settings');
          setShowSettingsModal(true);
        }}
      />
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <OfflineBanner />
      <PWAInstallBanner />
      <main className="flex-1">{renderContent()}</main>
      <LanguageSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      <PeacefulBreathingModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />
      <VoiceAssistantWidget />

      {/* Floating Presentation Demo Mode Controller for Hackathon */}
      <HackathonDemoBar
        currentView={view}
        activeGame={activeGame}
        isDeclineAlarmActive={isDeclineAlarmActive}
        onNavigate={async (targetView, gameType) => {
          if (targetView === 'game') {
            setActiveGame(gameType || 'picture_recall');
            setView('game');
          } else if (targetView === 'dashboard') {
            if (!user) {
              await startOfflineGuestSession('Mary Vance');
            }
            setActiveGame(null);
            setView('dashboard');
          } else if (targetView === 'caregiver') {
            setActiveGame(null);
            setView('caregiver');
          } else {
            setActiveGame(null);
            setView('landing');
          }
        }}
        onToggleDeclineAlarm={(active) => {
          setIsDeclineAlarmActive(active);
          if (active) {
            localStorage.setItem('recallia_simulating_decline', 'true');
            setView('caregiver');
          } else {
            localStorage.removeItem('recallia_simulating_decline');
            localStorage.removeItem('recallia_active_decline_alert');
          }
        }}
        onOpenBreathing={() => setShowBreathingModal(true)}
        onOpenEmergencySOS={() => setShowEmergencyModal(true)}
        onOpenPhysicianReport={() => {
          setView('caregiver');
          setShowCaregiverReportModal(true);
        }}
      />
    </div>
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
