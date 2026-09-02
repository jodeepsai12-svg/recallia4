import { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Volume2,
  Check,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  User,
  Package,
  ShieldCheck,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { sounds } from '@/lib/soundEffects';
import {
  getApprovedMemoriesForRecall,
  generateMemoryQuestions,
  getParticipantConsent,
  type MemoryRecallQuestion,
} from '@/lib/memoriesService';
import { fetchMemoriesForParticipant } from '@/lib/firebaseService';
import type { GameResult, PersonalMemory } from '@/types';

interface MyMemoriesRecallProps {
  difficulty?: string;
  participantId?: string;
  onComplete: (result: GameResult) => void;
  onOpenCaregiverMemories?: () => void;
}

export function MyMemoriesRecall({
  participantId = 'participant_mary',
  onComplete,
  onOpenCaregiverMemories,
}: MyMemoriesRecallProps) {
  const { speak } = useVoice();

  const [consent, setConsent] = useState(() => getParticipantConsent(participantId));
  const [approvedMemories, setApprovedMemories] = useState(() =>
    getApprovedMemoriesForRecall(participantId)
  );

  const [questions, setQuestions] = useState<MemoryRecallQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [completed, setCompleted] = useState(false);

  // Initialize questions
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const loadedConsent = getParticipantConsent(participantId);
      if (isMounted) setConsent(loadedConsent);
      
      let memories: PersonalMemory[] = [];
      try {
        const cloudMemories = await fetchMemoriesForParticipant(participantId);
        if (cloudMemories && cloudMemories.length > 0) {
          memories = cloudMemories.filter((m) => m.is_approved);
        }
      } catch (err) {
        console.warn('Could not fetch cloud memories:', err);
      }

      if (memories.length === 0) {
        memories = getApprovedMemoriesForRecall(participantId);
      }

      if (isMounted) {
        setApprovedMemories(memories);
        if (memories.length > 0) {
          const generated = generateMemoryQuestions(memories);
          setQuestions(generated.slice(0, 5));
          setCurrentIndex(0);
          setStartTime(Date.now());
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [participantId]);

  const currentQuestion = questions[currentIndex];

  // Voice read aloud current memory and question
  const readAloud = useCallback(() => {
    if (!currentQuestion) return;
    const textToRead = `Memory: ${currentQuestion.memory.memory_text}. Question: ${currentQuestion.promptText}. Option 1: ${currentQuestion.options[0]}. Option 2: ${currentQuestion.options[1]}. Option 3: ${currentQuestion.options[2]}.`;
    speak(textToRead);
  }, [currentQuestion, speak]);

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const isCorrect = idx === currentQuestion.correctIndex;
    if (isCorrect) {
      sounds.playSuccessChime();
      setScore((s) => s + 100);
      speak('Wonderful! That is correct.');
    } else {
      sounds.playCardFlip();
      setMistakes((m) => m + 1);
      speak(`That is okay. The familiar answer was ${currentQuestion.options[currentQuestion.correctIndex]}.`);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      // Completed all questions
      const totalElapsedMs = Date.now() - startTime;
      const totalQuestions = questions.length;
      const accuracyPct = Math.round(
        (Math.max(0, totalQuestions - mistakes) / totalQuestions) * 100
      );

      setCompleted(true);
      onComplete({
        game_type: 'story_recall', // Log under cognitive recall
        score: score + (totalQuestions - mistakes) * 50,
        accuracy: Math.max(0, Math.min(100, accuracyPct)),
        mistakes,
        response_time_ms: totalElapsedMs,
        difficulty: 'gentle',
      });
    }
  };

  // If no consent or no memories added yet
  if (!consent.has_consent || approvedMemories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border-2 border-teal-200 bg-white p-8 text-center shadow-soft animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Heart className="h-8 w-8 text-teal-600" />
        </div>

        <h3 className="font-display text-2xl font-bold text-teal-950">
          My Memories (Personal Recall)
        </h3>

        <p className="mt-3 text-sm text-teal-800 leading-relaxed font-medium">
          "My Memories" allows caregivers to add familiar names, cherished places, beloved objects, and short personal stories to create personalized, gentle recall activities.
        </p>

        <div className="my-6 rounded-2xl bg-sand-100 p-4 text-left border border-teal-100">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-teal-700 mt-0.5 shrink-0" />
            <div className="text-xs text-teal-900 leading-relaxed">
              <strong className="font-bold">Privacy & Consent Commitment:</strong> Personal memory content is private, stored exclusively for this participant, and requires caregiver/user consent before being shown.
            </div>
          </div>
        </div>

        {onOpenCaregiverMemories && (
          <button
            onClick={onOpenCaregiverMemories}
            className="btn-primary !px-6 !py-3 !text-sm font-bold shadow-soft"
          >
            Open Caregiver Portal to Manage Memories
          </button>
        )}
      </div>
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-soft animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <Sparkles className="h-8 w-8 text-teal-700" />
        </div>

        <h3 className="font-display text-2xl sm:text-3xl font-bold text-teal-950">
          Cherished Moments Recalled
        </h3>

        <p className="mt-2 text-base text-teal-800 font-medium">
          You spent warm, peaceful time reconnecting with your personal memories.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-teal-50 p-4 border border-teal-100">
            <span className="text-xs font-bold text-teal-700 uppercase">Memories Visited</span>
            <p className="font-display text-2xl font-bold text-teal-900 mt-1">
              {questions.length} Questions
            </p>
          </div>
          <div className="rounded-2xl bg-sand-100 p-4 border border-sand-200">
            <span className="text-xs font-bold text-teal-800 uppercase">Accuracy</span>
            <p className="font-display text-2xl font-bold text-teal-950 mt-1">
              {Math.round((Math.max(0, questions.length - mistakes) / questions.length) * 100)}%
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => {
              setCompleted(false);
              setCurrentIndex(0);
              setSelectedOption(null);
              setIsAnswerChecked(false);
              setMistakes(0);
              setScore(0);
              setStartTime(Date.now());
              const generated = generateMemoryQuestions(approvedMemories);
              setQuestions(generated.slice(0, 5));
            }}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-teal-200 bg-white px-5 py-3 text-sm font-bold text-teal-900 hover:bg-teal-50"
          >
            <RotateCcw className="h-4 w-4 text-teal-700" />
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const currentMemory = currentQuestion.memory;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Question Progress Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
            <Heart className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-teal-900">
            My Memories · Memory {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <button
          onClick={readAloud}
          className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 shadow-soft hover:bg-teal-50"
          title="Read memory and question aloud"
        >
          <Volume2 className="h-4 w-4 text-teal-600" />
          <span>Read Aloud</span>
        </button>
      </div>

      {/* Memory Card */}
      <div className="card !p-6 sm:!p-8 border-2 border-teal-200 bg-white shadow-soft-lg">
        {/* Optional Photo or Illustration */}
        {currentMemory.photo_url ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-teal-100 bg-teal-50 max-h-64 flex items-center justify-center">
            <img
              src={currentMemory.photo_url}
              alt={currentMemory.photo_alt || currentMemory.person_name}
              className="w-full h-56 sm:h-64 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wide">
            <BookOpen className="h-4 w-4 text-teal-600" />
            Personal Story Moment
          </div>
        )}

        {/* Short Personal Memory Text */}
        <blockquote className="text-lg sm:text-xl font-medium text-teal-950 leading-relaxed bg-sand-50/70 p-5 rounded-2xl border-l-4 border-teal-600 italic">
          "{currentMemory.memory_text}"
        </blockquote>

        {/* Question Prompt */}
        <div className="mt-6 pt-6 border-t border-teal-100">
          <div className="flex items-center gap-2 mb-3">
            {currentQuestion.questionType === 'place' && (
              <MapPin className="h-5 w-5 text-teal-700 shrink-0" />
            )}
            {currentQuestion.questionType === 'person' && (
              <User className="h-5 w-5 text-teal-700 shrink-0" />
            )}
            {currentQuestion.questionType === 'object' && (
              <Package className="h-5 w-5 text-teal-700 shrink-0" />
            )}
            <h4 className="font-display text-lg sm:text-xl font-bold text-teal-950">
              {currentQuestion.promptText}
            </h4>
          </div>

          {/* Options Grid */}
          <div className="grid gap-3 pt-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;

              let buttonStyle =
                'border-2 border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50/60 text-teal-950';

              if (isAnswerChecked) {
                if (isCorrect) {
                  buttonStyle =
                    'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-200';
                } else if (isSelected) {
                  buttonStyle =
                    'border-2 border-sand-400 bg-sand-100 text-sand-900 opacity-90';
                } else {
                  buttonStyle = 'border border-gray-200 bg-gray-50 text-gray-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerChecked}
                  className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl text-left text-base sm:text-lg font-semibold transition-all shadow-xs active:scale-[0.99] ${buttonStyle}`}
                >
                  <span>{option}</span>
                  {isAnswerChecked && isCorrect && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}
                  {isAnswerChecked && isSelected && !isCorrect && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-400 text-white">
                      <X className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback & Next Button */}
        {isAnswerChecked && (
          <div className="mt-6 pt-4 border-t border-teal-100 flex items-center justify-between">
            <span className="text-sm font-bold text-teal-800">
              {selectedOption === currentQuestion.correctIndex
                ? '✨ Beautifully remembered!'
                : `Warm reminder: ${currentQuestion.options[currentQuestion.correctIndex]}`}
            </span>

            <button
              onClick={handleNext}
              className="btn-primary !px-6 !py-3 !text-sm font-bold inline-flex items-center gap-2"
            >
              <span>{currentIndex < questions.length - 1 ? 'Next Memory' : 'Finish Activity'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Non-Diagnostic Safety & Privacy Notice */}
      <div className="rounded-2xl border border-teal-100 bg-sand-50 px-5 py-3 text-center">
        <p className="text-xs text-teal-700 font-medium">
          <strong>Privacy & Safety Notice:</strong> My Memories is designed for gentle, familiar reminiscence and emotional warmth. It does not treat, cure, or diagnose dementia or any medical condition.
        </p>
      </div>
    </div>
  );
}
