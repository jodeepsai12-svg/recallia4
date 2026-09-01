import type { SupportedLanguageCode } from '@/i18n/types';
import { VOICE_ANNOUNCEMENTS, type VoiceAnnouncementKey, findVoiceForLanguage } from './voiceGuide';

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel errors
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export function speak(
  text: string,
  lang: SupportedLanguageCode = 'en',
  options: SpeakOptions = {}
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (!text || text.trim() === '') return;

  stopSpeaking();

  try {
    const utterance = new SpeechSynthesisUtterance(text);

    // Senior-friendly calm pacing
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    const matchedVoice = findVoiceForLanguage(lang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      // Use standard BCP-47 tag
      utterance.lang = lang === 'as' ? 'as-IN' : lang === 'ne' ? 'ne-NP' : 'en-US';
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      options.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn('Speech synthesis error:', error);
  }
}

export function announceAction(
  actionKey: VoiceAnnouncementKey,
  lang: SupportedLanguageCode = 'en',
  options?: SpeakOptions
) {
  const langDict = VOICE_ANNOUNCEMENTS[lang] || VOICE_ANNOUNCEMENTS.en;
  const message = langDict[actionKey] || VOICE_ANNOUNCEMENTS.en[actionKey];
  if (message) {
    speak(message, lang, options);
  }
}
