import { useState, useEffect } from 'react';
import { Wind, Heart, X, CheckCircle2, Sparkles } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

interface PeacefulBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PeacefulBreathingModal({ isOpen, onClose }: PeacefulBreathingModalProps) {
  const { speak } = useVoice();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPhase('inhale');
      setSecondsLeft(4);
      setCyclesCompleted(0);
      return;
    }

    speak('Welcome to your peaceful breathing moment. Sit back comfortably, relax your shoulders, and follow the gentle rhythm.');

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phase
        setPhase((currentPhase) => {
          if (currentPhase === 'inhale') {
            return 'hold';
          } else if (currentPhase === 'hold') {
            return 'exhale';
          } else {
            setCyclesCompleted((c) => c + 1);
            return 'inhale';
          }
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, speak]);

  if (!isOpen) return null;

  const phaseInstruction = {
    inhale: {
      title: 'Breathe In Gently',
      text: 'Breathe in through your nose, filling your chest with fresh, calm air.',
      scale: 'scale-110',
      color: 'bg-teal-100 border-teal-400 text-teal-900',
    },
    hold: {
      title: 'Hold Calmly',
      text: 'Gently hold that calm breath, feeling peaceful and centered.',
      scale: 'scale-105',
      color: 'bg-sand-100 border-sand-300 text-sand-900',
    },
    exhale: {
      title: 'Breathe Out Slowly',
      text: 'Gently release through your mouth, letting any tension melt away.',
      scale: 'scale-90',
      color: 'bg-teal-50 border-teal-300 text-teal-800',
    },
  }[phase];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-teal-100 bg-white p-6 sm:p-8 shadow-2xl text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-slate-600 hover:bg-sand-200 transition-colors"
          title="Close breathing exercise"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 mb-3">
          <Wind className="h-7 w-7" />
        </div>

        <h3 className="font-display text-2xl font-bold text-teal-950">
          Peaceful Breathing & Calm
        </h3>
        <p className="mt-1 text-sm text-teal-700">
          A gentle pause to center your mind and relax your body.
        </p>

        {/* Dynamic Breathing Circle */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div
            className={`flex h-44 w-44 items-center justify-center rounded-full border-4 shadow-soft transition-all duration-1000 ease-in-out ${phaseInstruction.color} ${phaseInstruction.scale}`}
          >
            <div className="text-center">
              <span className="font-display text-4xl font-extrabold">{secondsLeft}</span>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider">
                {phaseInstruction.title}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm font-medium text-teal-800 leading-relaxed">
            {phaseInstruction.text}
          </p>
        </div>

        {/* Reminiscence Prompt */}
        <div className="rounded-2xl border border-sand-200 bg-sand-50/80 p-4 text-left mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-coral-500" />
            Comforting Thought for Today
          </p>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            &ldquo;Recall the comforting smell of freshly baked bread, or the warm morning sun gently streaming through a window.&rdquo;
          </p>
        </div>

        {/* Footer info & Done Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-coral-500" />
            {cyclesCompleted > 0
              ? `${cyclesCompleted} ${cyclesCompleted === 1 ? 'cycle completed' : 'cycles completed'}`
              : 'Take your time'}
          </span>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-800 transition-colors shadow-soft"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>I Feel Relaxed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
