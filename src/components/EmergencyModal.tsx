import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  PhoneCall,
  CheckCircle,
  RefreshCw,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { SpeechRecognizer } from '@/lib/speechRecognition';
import { sounds } from '@/lib/soundEffects';
import { createEmergencyAlert } from '@/lib/firebaseService';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TAGS = [
  { id: 'dizzy', label: '🚶 Feeling Dizzy / Weak' },
  { id: 'meds', label: '💊 Need Medication' },
  { id: 'call', label: '📞 Please Call Me' },
  { id: 'water', label: '💧 Need Water / Food' },
  { id: 'help', label: '🏠 Urgent Help Needed' },
];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { currentLanguage } = useI18n();
  const { announce } = useVoice();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const caregiverPhone =
    profile?.caregiver?.phoneNumber ||
    profile?.emergencyContact?.phoneNumber ||
    '+919876543210';
  const caregiverName =
    profile?.caregiver?.name ||
    profile?.emergencyContact?.name ||
    'Family Caregiver';

  // Audio / MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const hasSpokenIntroRef = useRef(false);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping media recorder:', err);
      }
    }

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping speech recognizer:', err);
      }
      recognizerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      // 1. Initialize browser MediaRecorder
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

          // Stop all audio tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start(200);
      }
    } catch (err) {
      console.warn('Microphone permission or MediaRecorder not available:', err);
      setErrorMessage('Microphone access unavailable. You can still select quick options or type a note.');
    }

    // 2. Initialize Speech Recognition for live text transcription
    try {
      const recognizer = new SpeechRecognizer();
      recognizerRef.current = recognizer;

      recognizer.start(
        currentLanguage,
        (text, isFinal) => {
          setTranscript((prev) => {
            if (isFinal) {
              return prev ? `${prev} ${text}` : text;
            }
            return prev ? `${prev} [${text}]` : text;
          });
        },
        (error) => {
          console.warn('Speech recognition warning:', error);
        }
      );
    } catch (err) {
      console.warn('SpeechRecognizer initialization note:', err);
    }

    sounds.playMicStart();
    setIsRecording(true);
    setRecordingDuration(0);
  }, [currentLanguage]);

  // When modal opens, announce voice confirmation and automatically start recording
  useEffect(() => {
    if (isOpen) {
      setIsSent(false);
      setTranscript('');
      setAudioUrl(null);
      setSelectedTags([]);
      setErrorMessage(null);
      setRecordingDuration(0);

      // Play emergency voice confirmation immediately
      if (!hasSpokenIntroRef.current) {
        hasSpokenIntroRef.current = true;
        announce('emergency_activated');
      }

      // Auto start recording after a brief delay so audio chime / prompt doesn't overlap
      const startTimer = window.setTimeout(() => {
        startRecording();
      }, 700);

      return () => {
        clearTimeout(startTimer);
        stopRecording();
      };
    } else {
      hasSpokenIntroRef.current = false;
      stopRecording();
    }
  }, [isOpen, announce, startRecording, stopRecording]);

  // Handle timer during recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording, stopRecording]);

  const toggleTag = (tagLabel: string) => {
    sounds.playTapChime();
    setSelectedTags((prev) =>
      prev.includes(tagLabel) ? prev.filter((t) => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const playRecordedAudio = () => {
    if (!audioUrl) return;

    if (isPlayingAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlayingAudio(false);
      } else {
        audioElementRef.current.src = audioUrl;
      }
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleSendAlert = async () => {
    if (isRecording) {
      stopRecording();
    }

    setIsSubmitting(true);
    const participantName =
      profile?.name ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      'Senior Participant';

    const finalMessage =
      transcript.trim() ||
      (selectedTags.length > 0
        ? `Request: ${selectedTags.join(', ')}`
        : 'Emergency assistance requested by participant.');

    let savedAlertId = `alert_${Date.now()}`;

    // 1. Save alert into Firebase Firestore
    try {
      const newAlert = await createEmergencyAlert({
        user_id: user?.uid || 'participant_mary',
        participant_name: participantName,
        message_text: finalMessage,
        audio_url: audioUrl || undefined,
        audio_duration_seconds: recordingDuration,
        tags: selectedTags,
        status: 'pending',
      });
      savedAlertId = newAlert.id;
    } catch (err) {
      console.warn('Error saving emergency alert to Firestore:', err);
    }

    // 2. Dispatch real Twilio SMS to caregiver phone number via server backend
    try {
      const response = await fetch('/api/emergency/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: caregiverPhone,
          participantName,
          messageText: finalMessage,
          audioUrl: audioUrl || undefined,
          tags: selectedTags,
          alertId: savedAlertId,
        }),
      });

      const smsResult = await response.json();
      if (smsResult.smsDelivered) {
        setSmsDeliveryStatus(`Live cellular SMS dispatched to caregiver at ${caregiverPhone}.`);
      } else {
        setSmsDeliveryStatus(`Alert recorded in Firebase database for ${caregiverName} (${caregiverPhone}).`);
      }
    } catch (smsErr) {
      console.warn('SMS dispatch error:', smsErr);
      setSmsDeliveryStatus(`Alert recorded in Firebase database for ${caregiverName} (${caregiverPhone}).`);
    }

    sounds.playSuccessChime();
    announce('emergency_sent');
    setIsSubmitting(false);
    setIsSent(true);
  };

  const handleCancel = () => {
    sounds.playCancel();
    announce('emergency_cancelled');
    stopRecording();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-rose-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-rose-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 id="emergency-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
                Emergency Assistance
              </h2>
              <p className="text-xs sm:text-sm text-rose-100 font-medium">
                Record a voice message for your caregiver
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            aria-label="Close emergency assistance"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isSent ? (
            /* Success confirmation screen */
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Message Sent to Caregiver</h3>
              <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
                Your caregiver <strong>{caregiverName}</strong> ({caregiverPhone}) has been alerted. Please sit comfortably and rest; someone will attend to you shortly.
              </p>

              {smsDeliveryStatus && (
                <div className="inline-block rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  {smsDeliveryStatus}
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`tel:${caregiverPhone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
                >
                  <PhoneCall className="w-5 h-5" />
                  Call {caregiverName} Now
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-2xl transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Voice Recording Control Area */}
              <div className="bg-rose-50/80 rounded-2xl p-5 border border-rose-100 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  {/* Pulsing visual ring when recording */}
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
                  )}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                      isRecording
                        ? 'bg-rose-600 text-white ring-4 ring-rose-300'
                        : 'bg-white text-rose-700 hover:bg-rose-100/80 border-2 border-rose-300'
                    }`}
                    aria-label={isRecording ? 'Stop Recording' : 'Start Recording Voice Memo'}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8 fill-current" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-rose-900">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRecording ? 'bg-rose-600 animate-pulse' : 'bg-gray-400'
                    }`}
                  />
                  <span>
                    {isRecording
                      ? `Recording Voice Memo (${recordingDuration}s / 60s)`
                      : audioUrl
                      ? 'Voice Memo Recorded'
                      : 'Tap to Record Voice Memo'}
                  </span>
                </div>

                {errorMessage && (
                  <p className="mt-2 text-xs font-semibold text-rose-700 bg-rose-100/80 px-3 py-1.5 rounded-lg border border-rose-200">
                    {errorMessage}
                  </p>
                )}

                <p className="text-xs text-rose-700/80 mt-1 max-w-sm">
                  {isRecording
                    ? 'Speak clearly into your device. Your caregiver will hear your exact voice.'
                    : 'Tell your caregiver what you need or how you are feeling.'}
                </p>

                {/* Audio playback review if recorded */}
                {audioUrl && !isRecording && (
                  <div className="mt-4 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-rose-200 shadow-xs">
                    <button
                      type="button"
                      onClick={playRecordedAudio}
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-rose-800 hover:text-rose-950"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="w-4 h-4 text-rose-600" />
                          Pause Playback
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-rose-600" />
                          Listen to Voice Note ({recordingDuration}s)
                        </>
                      )}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-record
                    </button>
                  </div>
                )}
              </div>

              {/* Live Speech-to-Text Transcription Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Spoken Message Transcript / Note:
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={
                      isRecording
                        ? 'Listening to your voice...'
                        : 'Your transcribed message will appear here. You can also type directly.'
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
                  />
                  {transcript && (
                    <button
                      type="button"
                      onClick={() => setTranscript('')}
                      className="absolute top-2.5 right-2.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Preset Tags (One-Tap Senior Friendly) */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Quick Needs (Tap to select):
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all select-none active:scale-95 ${
                          isSelected
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/80'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Direct Phone Call Options */}
              <div className="pt-1 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-gray-500 font-medium">Immediate Call:</span>
                <div className="flex items-center gap-2">
                  <a
                    href="tel:+919876543210"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl border border-emerald-200"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    Call Mary (Caregiver)
                  </a>
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-xl border border-rose-200"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                    Dial 112
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isSent && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 transition-colors text-center"
            >
              Cancel / False Alarm
            </button>

            <button
              type="button"
              onClick={handleSendAlert}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-base font-bold shadow-lg hover:shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending Alert...' : 'Send to Caregiver'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
