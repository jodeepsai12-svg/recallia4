import { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speak, stopSpeaking } from '@/lib/audio';

interface AudioButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function AudioButton({ text, label = 'Play instructions', className = '' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleClick = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(text);
    const checkInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setPlaying(false);
        clearInterval(checkInterval);
      }
    }, 200);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-50 px-6 py-3 text-base font-bold text-teal-700 ring-2 ring-teal-100 transition-all hover:bg-teal-100 hover:ring-teal-200 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-teal-200 ${className}`}
    >
      {playing ? (
        <>
          <Square className="h-5 w-5" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-5 w-5" />
          {label}
        </>
      )}
    </button>
  );
}
