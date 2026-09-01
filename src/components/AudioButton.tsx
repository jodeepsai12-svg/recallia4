import { useVoice } from '@/context/VoiceContext';
import { useI18n } from '@/i18n';
import { Volume2, Square } from 'lucide-react';

interface AudioButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function AudioButton({ text, label = 'Play instructions', className = '' }: AudioButtonProps) {
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const { language } = useI18n();

  const handleClick = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text, language);
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-50 px-6 py-3 text-base font-bold text-teal-700 ring-2 ring-teal-100 transition-all hover:bg-teal-100 hover:ring-teal-200 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-teal-200 ${className}`}
    >
      {isSpeaking ? (
        <>
          <Square className="h-5 w-5 text-teal-700" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="h-5 w-5 text-teal-600" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
