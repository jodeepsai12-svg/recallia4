import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SupportedLanguageCode } from '@/i18n/types';
import { useI18n } from '@/i18n';
import { speak as audioSpeak, stopSpeaking as audioStopSpeaking, announceAction, isSpeaking as checkIsSpeaking } from '@/lib/audio';
import type { VoiceAnnouncementKey } from '@/lib/voiceGuide';
import { speechRecognizer } from '@/lib/speechRecognition';
import { sounds } from '@/lib/soundEffects';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language?: SupportedLanguageCode;
  timestamp: string;
  actionTriggered?: string | null;
}

interface VoiceContextType {
  isVoiceGuideEnabled: boolean;
  setVoiceGuideEnabled: (enabled: boolean) => void;
  voiceRate: number;
  setVoiceRate: (rate: number) => void;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  isAssistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  assistantMessages: AssistantMessage[];
  isProcessingAI: boolean;
  detectedLanguage: SupportedLanguageCode;
  speak: (text: string, lang?: SupportedLanguageCode) => void;
  stopSpeaking: () => void;
  announce: (actionKey: VoiceAnnouncementKey, overrideLang?: SupportedLanguageCode) => void;
  sendMessageToAssistant: (userText: string) => Promise<void>;
  startVoiceAssistantListening: () => void;
  stopVoiceAssistantListening: () => void;
  clearMessages: () => void;
  onActionTrigger?: (action: string) => void;
  setActionTriggerHandler: (handler: (action: string) => void) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

const STORAGE_VOICE_ENABLED = 'recallia_voice_guide_enabled';
const STORAGE_VOICE_RATE = 'recallia_voice_rate';

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useI18n();

  const [isVoiceGuideEnabled, setIsVoiceGuideEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_VOICE_ENABLED);
    return saved !== null ? saved === 'true' : true; // Enabled by default for senior accessibility
  });

  const [voiceRate, setVoiceRateState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_VOICE_RATE);
    return saved ? parseFloat(saved) : 0.85; // Senior-friendly default
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isAssistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguageCode>(language);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);

  const actionHandlerRef = useRef<((action: string) => void) | null>(null);

  // Sync detected language with app language when app language changes
  useEffect(() => {
    setDetectedLanguage(language);
  }, [language]);

  // Keep track of window.speechSynthesis.speaking
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(checkIsSpeaking());
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const setVoiceGuideEnabled = (enabled: boolean) => {
    setIsVoiceGuideEnabledState(enabled);
    localStorage.setItem(STORAGE_VOICE_ENABLED, String(enabled));
    if (!enabled) {
      audioStopSpeaking();
      setIsSpeaking(false);
    }
  };

  const setVoiceRate = (rate: number) => {
    setVoiceRateState(rate);
    localStorage.setItem(STORAGE_VOICE_RATE, String(rate));
  };

  const setActionTriggerHandler = useCallback((handler: (action: string) => void) => {
    actionHandlerRef.current = handler;
  }, []);

  const speak = useCallback(
    (text: string, lang?: SupportedLanguageCode) => {
      if (!isVoiceGuideEnabled) return;
      const targetLang = lang || language;
      setIsSpeaking(true);
      audioSpeak(text, targetLang, {
        rate: voiceRate,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [isVoiceGuideEnabled, language, voiceRate]
  );

  const stopSpeaking = useCallback(() => {
    audioStopSpeaking();
    setIsSpeaking(false);
  }, []);

  const announce = useCallback(
    (actionKey: VoiceAnnouncementKey, overrideLang?: SupportedLanguageCode) => {
      if (!isVoiceGuideEnabled) return;
      const targetLang = overrideLang || language;
      sounds.playTapChime();
      setIsSpeaking(true);
      announceAction(actionKey, targetLang, {
        rate: voiceRate,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [isVoiceGuideEnabled, language, voiceRate]
  );

  // Handle action returned from AI Assistant
  const handleAction = useCallback(
    (action: string | null) => {
      if (!action) return;

      // Check if it's a language change request
      if (action.startsWith('change_lang_')) {
        const newLang = action.replace('change_lang_', '') as SupportedLanguageCode;
        setLanguage(newLang);
        return;
      }

      // Delegate to external handler (e.g., in App.tsx)
      if (actionHandlerRef.current) {
        actionHandlerRef.current(action);
      }
    },
    [setLanguage]
  );

  // Send message to AI assistant with real-time streaming
  const sendMessageToAssistant = useCallback(
    async (userText: string) => {
      if (!userText || userText.trim() === '') return;

      const userMsg: AssistantMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        text: userText,
        language: detectedLanguage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const botMsgId = `msg_${Date.now() + 1}_bot`;

      setAssistantMessages((prev) => [...prev, userMsg]);
      setIsProcessingAI(true);

      try {
        const historyPayload = assistantMessages.slice(-6).map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const response = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            selectedLanguage: language,
            history: historyPayload,
            screenContext: {
              currentLanguage: language,
              voiceGuideActive: isVoiceGuideEnabled,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Server error');
        }

        let accumulatedText = '';
        let triggeredAction: string | null = null;
        let responseLang = detectedLanguage || language;
        let hasAddedBotMsg = false;

        const updateBotMessage = (text: string, lang: SupportedLanguageCode, action?: string | null) => {
          setAssistantMessages((prev) => {
            const exists = prev.some((m) => m.id === botMsgId);
            if (exists) {
              return prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      text,
                      language: lang,
                      ...(action !== undefined ? { actionTriggered: action } : {}),
                    }
                  : m
              );
            } else {
              return [
                ...prev,
                {
                  id: botMsgId,
                  role: 'assistant',
                  text,
                  language: lang,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  actionTriggered: action || undefined,
                },
              ];
            }
          });
        };

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.text) {
                    accumulatedText += data.text;
                    if (!hasAddedBotMsg) {
                      hasAddedBotMsg = true;
                      setIsProcessingAI(false);
                    }
                    updateBotMessage(accumulatedText, responseLang);
                  }
                  if (data.action) {
                    triggeredAction = data.action;
                  }
                  if (data.detectedLanguage) {
                    responseLang = data.detectedLanguage as SupportedLanguageCode;
                    setDetectedLanguage(responseLang);
                  }
                } catch {
                  // ignore JSON parse error on incomplete line
                }
              }
            }
          }

          // Process any residual buffer
          if (buffer.trim().startsWith('data: ')) {
            try {
              const data = JSON.parse(buffer.trim().slice(6));
              if (data.text) {
                accumulatedText += data.text;
                updateBotMessage(accumulatedText, responseLang);
              }
              if (data.action) triggeredAction = data.action;
              if (data.detectedLanguage) {
                responseLang = data.detectedLanguage as SupportedLanguageCode;
                setDetectedLanguage(responseLang);
              }
            } catch {
              // ignore parse error
            }
          }
        }

        // Finalize bot message if text was received
        if (accumulatedText.trim()) {
          updateBotMessage(accumulatedText, responseLang, triggeredAction);
          setIsProcessingAI(false);

          if (isVoiceGuideEnabled) {
            speak(accumulatedText, responseLang);
          }
          if (triggeredAction) {
            handleAction(triggeredAction);
          }
        } else {
          throw new Error('Empty response');
        }
      } catch (err) {
        console.warn('AI Assistant error (recovering with fallback):', err);
        const fallbackText = language === 'as'
          ? 'মই আপোনাক সহায় কৰিবলৈ সাজু আছোঁ।'
          : language === 'ne'
          ? 'म तपाईंलाई मद्दत गर्न तयार छु।'
          : "I am ready to help you with your daily activities.";

        const errorMsg: AssistantMessage = {
          id: `msg_${Date.now()}_bot`,
          role: 'assistant',
          text: fallbackText,
          language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setAssistantMessages((prev) => [...prev, errorMsg]);
        if (isVoiceGuideEnabled) {
          speak(fallbackText, language);
        }
      } finally {
        setIsProcessingAI(false);
      }
    },
    [assistantMessages, detectedLanguage, handleAction, isVoiceGuideEnabled, language, speak]
  );

  // Start voice assistant recording
  const startVoiceAssistantListening = useCallback(() => {
    stopSpeaking();
    sounds.playMicStart();
    setTranscript('');
    setIsListening(true);

    speechRecognizer.start(
      {
        onStart: () => {
          setIsListening(true);
        },
        onResult: (text, isFinal) => {
          setTranscript(text);
          if (isFinal && text.trim().length > 0) {
            speechRecognizer.stop();
            setIsListening(false);
            sendMessageToAssistant(text);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      },
      detectedLanguage || language
    );
  }, [detectedLanguage, language, sendMessageToAssistant, stopSpeaking]);

  const stopVoiceAssistantListening = useCallback(() => {
    speechRecognizer.stop();
    setIsListening(false);
    if (transcript.trim()) {
      sendMessageToAssistant(transcript);
    }
  }, [sendMessageToAssistant, transcript]);

  const clearMessages = () => {
    setAssistantMessages([]);
  };

  const value: VoiceContextType = {
    isVoiceGuideEnabled,
    setVoiceGuideEnabled,
    voiceRate,
    setVoiceRate,
    isSpeaking,
    isListening,
    transcript,
    isAssistantOpen,
    setAssistantOpen,
    assistantMessages,
    isProcessingAI,
    detectedLanguage,
    speak,
    stopSpeaking,
    announce,
    sendMessageToAssistant,
    startVoiceAssistantListening,
    stopVoiceAssistantListening,
    clearMessages,
    setActionTriggerHandler,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
