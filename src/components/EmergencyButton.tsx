import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface EmergencyButtonProps {
  onTrigger: () => void;
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

const HOLD_DURATION_MS = 1800; // 1.8 seconds hold to prevent accidental triggers

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onTrigger,
  className = '',
  variant = 'header',
}) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const soundTickRef = useRef<number>(0);

  const startHold = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (holding) return;

    setHolding(true);
    startTimeRef.current = performance.now();
    soundTickRef.current = 0;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
    }

    const updateHold = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const curProgress = Math.min(1, elapsed / HOLD_DURATION_MS);
      setProgress(curProgress);

      // Play soft rising ticks every 300ms
      if (now - soundTickRef.current > 280 && curProgress < 0.95) {
        sounds.playHoldTick(curProgress);
        soundTickRef.current = now;
      }

      if (curProgress >= 1) {
        // Trigger emergency!
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([100, 50, 150]);
          } catch {
            // ignore
          }
        }
        sounds.playEmergencyTrigger();
        setHolding(false);
        setProgress(0);
        startTimeRef.current = null;
        onTrigger();
        return;
      }

      animFrameRef.current = requestAnimationFrame(updateHold);
    };

    animFrameRef.current = requestAnimationFrame(updateHold);
  };

  const cancelHold = () => {
    if (!holding) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setHolding(false);
    setProgress(0);
    startTimeRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Calculate circular SVG progress values
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onTouchCancel={cancelHold}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') startHold(e);
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') cancelHold();
          }}
          aria-label="Hold for 2 seconds for Emergency Assistance"
          className="relative group flex items-center gap-3 px-4 py-3 bg-white/95 hover:bg-rose-50/90 text-rose-800 border-2 border-rose-200/80 hover:border-rose-300 rounded-2xl shadow-lg hover:shadow-xl transition-all select-none active:scale-95 touch-none"
        >
          {/* Progress circle container */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="stroke-rose-100 fill-transparent"
                strokeWidth="3.5"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="stroke-rose-600 fill-transparent transition-all duration-75"
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <ShieldAlert
              className={`absolute w-5 h-5 ${
                holding ? 'text-rose-600 animate-pulse scale-110' : 'text-rose-700'
              } transition-transform`}
            />
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-rose-900 leading-tight">
              {holding ? 'Keep Holding...' : 'Emergency Assistance'}
            </p>
            <p className="text-xs text-rose-600/90 font-medium">
              {holding ? `${Math.round((1 - progress) * 1.8 * 10) / 10}s remaining` : 'Press & hold 2s'}
            </p>
          </div>
        </button>
      </div>
    );
  }

  // Header / inline button variant (discreet, accessible, calming)
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') startHold(e);
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') cancelHold();
        }}
        aria-label="Hold for 2 seconds to request Emergency Assistance"
        className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all select-none touch-none active:scale-95 ${
          holding
            ? 'bg-rose-100 border-rose-400 text-rose-950 shadow-inner'
            : 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/90 text-rose-800 hover:text-rose-900 shadow-xs'
        }`}
      >
        {/* Circular progress or mini indicator */}
        <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 -rotate-90 transform" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="stroke-rose-200/70 fill-transparent"
              strokeWidth="4"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="stroke-rose-600 fill-transparent transition-all duration-75"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <ShieldAlert
            className={`absolute w-3.5 h-3.5 ${
              holding ? 'text-rose-700 animate-pulse' : 'text-rose-600'
            }`}
          />
        </div>

        <div className="flex flex-col text-left">
          <span className="font-semibold text-xs sm:text-sm leading-tight text-rose-950">
            {holding ? 'Holding...' : 'Emergency Help'}
          </span>
          <span className="text-[10px] text-rose-700/80 font-normal leading-none hidden sm:inline">
            {holding ? `${Math.round(progress * 100)}%` : 'Hold 2s'}
          </span>
        </div>
      </button>
    </div>
  );
};
