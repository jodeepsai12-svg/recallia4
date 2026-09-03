import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { speak } = useVoice();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setIsDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      speak('Offline mode active. All memory exercises and games work fully without internet.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [speak]);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (isDismissed && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div
        id="reconnected-banner"
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 shadow-md animate-fade-in"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Internet reconnected. Your progress is synced!</span>
      </div>
    );
  }

  return (
    <aside
      id="offline-status-banner"
      aria-label="Offline status banner"
      className="bg-amber-100/90 border-b border-amber-200/90 px-4 py-2.5 text-amber-950 text-xs sm:text-sm font-semibold transition-all shadow-xs"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-900 shrink-0">
            <WifiOff className="h-3.5 w-3.5" />
          </span>
          <p className="leading-tight">
            <strong className="font-bold text-amber-900">Offline Mode Active:</strong>{' '}
            <span className="text-amber-800">
              No internet connection required. All exercises, calming sounds, and games are fully ready to play.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="rounded-lg px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-200/60 transition-colors shrink-0"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
};
