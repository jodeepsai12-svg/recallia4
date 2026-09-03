import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { speak } = useVoice();

  useEffect(() => {
    // Check if already installed / standalone
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Check if on iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    if (isAppleMobile) {
      setIsIOS(true);
    }

    // Capture install prompt for Android/Chrome/Edge/Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      speak('Opening install prompt. Tap Install to add Recallia to your device.');
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
      speak('To install on your iPhone or iPad, tap the share icon at the bottom, then choose Add to Home Screen.');
    }
  };

  if (isStandalone || dismissed) {
    return null;
  }

  // Show if prompt available or on iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <aside
      id="pwa-install-banner"
      aria-label="Install App Prompt"
      className="bg-gradient-to-r from-teal-800 to-teal-900 text-white px-4 py-3 shadow-md border-b border-teal-700/50"
    >
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-700/80 text-teal-200 border border-teal-600/50">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-50 flex items-center gap-2">
              <span>Install Recallia for Offline Use</span>
              <span className="rounded-md bg-teal-600/60 px-2 py-0.5 text-[11px] font-semibold text-teal-200">
                Works Offline
              </span>
            </h4>
            <p className="text-xs text-teal-200 mt-0.5">
              Add to your home screen for easy one-tap access without typing any address.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-teal-950 px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>Install App</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl p-2 text-teal-300 hover:bg-teal-800 hover:text-white transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="mt-3 rounded-2xl bg-teal-950/80 p-3 text-xs text-teal-100 border border-teal-700 animate-fade-in">
          <p className="font-bold mb-1">How to install on iPhone / iPad:</p>
          <ol className="list-decimal list-inside space-y-1 text-teal-200">
            <li>Tap the Safari <strong className="text-white">Share button</strong> (square with an arrow pointing up) at the bottom.</li>
            <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
            <li>Tap <strong className="text-white">Add</strong> in the top right.</li>
          </ol>
        </div>
      )}
    </aside>
  );
};
