import type { SupportedLanguageCode } from '@/i18n/types';

export interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognitionInstance;
}

// SpeechRecognition type declarations for browser support
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: unknown) => void;
  onEnd?: () => void;
}

export class SpeechRecognizer {
  private recognition: ISpeechRecognitionInstance | null = null;
  private isListening = false;
  private currentLanguage: SupportedLanguageCode = 'en';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechClass) {
        this.recognition = new SpeechClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  isSupported(): boolean {
    return Boolean(this.recognition);
  }

  getCurrentLanguage(): SupportedLanguageCode {
    return this.currentLanguage;
  }

  setLanguage(lang: SupportedLanguageCode) {
    this.currentLanguage = lang;
    if (!this.recognition) return;

    // Map language code to SpeechRecognition locale
    const localeMap: Record<SupportedLanguageCode, string> = {
      as: 'as-IN',
      ne: 'ne-NP',
      mni: 'mni-IN',
      kok: 'bn-IN',
      kha: 'en-IN',
      lus: 'en-IN',
      nyi: 'en-IN',
      ao: 'en-IN',
      en: 'en-IN',
    };

    this.recognition.lang = localeMap[lang] || 'en-IN';
  }

  start(handlers: SpeechRecognitionHandlers, lang?: SupportedLanguageCode) {
    if (!this.recognition) {
      handlers.onError?.({ error: 'not-supported', message: 'Speech recognition is not supported in this browser.' });
      return;
    }

    if (lang) {
      this.setLanguage(lang);
    }

    try {
      this.stop(); // Stop any existing session

      this.recognition.onstart = () => {
        this.isListening = true;
        handlers.onStart?.();
      };

      this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        handlers.onResult?.(text, Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        this.isListening = false;
        handlers.onError?.(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd?.();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      handlers.onError?.(err);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isListening = false;
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
    }
    this.isListening = false;
  }
}

export const speechRecognizer = new SpeechRecognizer();
