import { useState, useEffect, useCallback } from 'react';
import { Link2, Check, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { GameResult, GameDifficulty } from '@/types';

interface ObjectAssociationProps {
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}

interface QuestionDef {
  id: number;
  promptEmoji: string;
  defaultPrompt: string;
  options: { defaultLabel: string; emoji: string; correct: boolean }[];
}

const BASE_QUESTIONS: QuestionDef[] = [
  {
    id: 0,
    promptEmoji: '🔑',
    defaultPrompt: 'What do you use with a key?',
    options: [
      { defaultLabel: 'Door', emoji: '🚪', correct: true },
      { defaultLabel: 'Plate', emoji: '🍽️', correct: false },
      { defaultLabel: 'Pillow', emoji: '😴', correct: false },
    ],
  },
  {
    id: 1,
    promptEmoji: '☕',
    defaultPrompt: 'What goes with a cup?',
    options: [
      { defaultLabel: 'Saucer', emoji: '🫗', correct: true },
      { defaultLabel: 'Shoe', emoji: '👟', correct: false },
      { defaultLabel: 'Tree', emoji: '🌳', correct: false },
    ],
  },
  {
    id: 2,
    promptEmoji: '☂️',
    defaultPrompt: 'What do you need for an umbrella?',
    options: [
      { defaultLabel: 'Rain', emoji: '🌧️', correct: true },
      { defaultLabel: 'Oven', emoji: '🔥', correct: false },
      { defaultLabel: 'Bed', emoji: '🛏️', correct: false },
    ],
  },
  {
    id: 3,
    promptEmoji: '📚',
    defaultPrompt: 'What goes with a book?',
    options: [
      { defaultLabel: 'Bookmark', emoji: '🔖', correct: true },
      { defaultLabel: 'Soap', emoji: '🧼', correct: false },
      { defaultLabel: 'Tire', emoji: '🛞', correct: false },
    ],
  },
  {
    id: 4,
    promptEmoji: '👟',
    defaultPrompt: 'What do you wear with shoes?',
    options: [
      { defaultLabel: 'Socks', emoji: '🧦', correct: true },
      { defaultLabel: 'Cloud', emoji: '☁️', correct: false },
      { defaultLabel: 'Banana', emoji: '🍌', correct: false },
    ],
  },
  {
    id: 5,
    promptEmoji: '🖊️',
    defaultPrompt: 'What goes with a pen?',
    options: [
      { defaultLabel: 'Paper', emoji: '📄', correct: true },
      { defaultLabel: 'Helmet', emoji: '⛑️', correct: false },
      { defaultLabel: 'Fish', emoji: '🐟', correct: false },
    ],
  },
];

const DIFFICULTY_CONFIG: Record<GameDifficulty, { questionCount: number }> = {
  gentle: { questionCount: 3 },
  moderate: { questionCount: 4 },
  challenging: { questionCount: 5 },
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Phase = 'playing' | 'feedback';

export function ObjectAssociation({ difficulty, onComplete }: ObjectAssociationProps) {
  const { t } = useI18n();
  const config = DIFFICULTY_CONFIG[difficulty];
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const initRound = useCallback(() => {
    const indices = shuffle(BASE_QUESTIONS.map((_, i) => i)).slice(0, config.questionCount);
    setSelectedIndices(indices);
    setCurrentQ(0);
    setMistakes(0);
    setCorrectCount(0);
    setPhase('playing');
    setStartTime(Date.now());
  }, [config]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  if (selectedIndices.length === 0) return null;

  const currentBaseQ = BASE_QUESTIONS[selectedIndices[currentQ]];
  const translatedQ = t.objectAssociation.questions?.[currentBaseQ.id];
  const promptText = translatedQ?.prompt || currentBaseQ.defaultPrompt;

  const handleSelect = (index: number) => {
    if (phase !== 'playing') return;
    setSelected(index);
    setPhase('feedback');

    const isCorrect = currentBaseQ.options[index].correct;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMistakes((m) => m + 1);
    }

    setTimeout(() => {
      if (currentQ + 1 >= selectedIndices.length) {
        const responseTime = Date.now() - startTime;
        const totalCorrect = correctCount + (isCorrect ? 1 : 0);
        const accuracy = Math.round((totalCorrect / selectedIndices.length) * 100);
        onComplete({
          game_type: 'object_association',
          score: totalCorrect * 100 - (mistakes + (isCorrect ? 0 : 1)) * 25,
          accuracy,
          mistakes: mistakes + (isCorrect ? 0 : 1),
          response_time_ms: responseTime,
          difficulty,
        });
      } else {
        setCurrentQ((q) => q + 1);
        setSelected(null);
        setPhase('playing');
      }
    }, 2000);
  };

  return (
    <div className="animate-fade-in text-center">
      <div className="mb-2 flex items-center justify-center gap-2">
        <Link2 className="h-5 w-5 text-coral-500" />
        <span className="text-sm font-bold text-teal-500">
          {t.objectAssociation.question} {currentQ + 1} {t.objectAssociation.of} {selectedIndices.length}
        </span>
      </div>

      {/* Prompt */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="card !p-8">
          <span className="text-6xl">{currentBaseQ.promptEmoji}</span>
          <p className="mt-4 font-display text-xl font-semibold text-teal-900">
            {promptText}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-3">
        {currentBaseQ.options.map((option, index) => {
          const isSelected = selected === index;
          const showFeedback = phase === 'feedback' && isSelected;
          const showCorrect = phase === 'feedback' && option.correct;
          const labelText = translatedQ?.options?.[index] || option.defaultLabel;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={phase !== 'playing'}
              className={`card flex flex-col items-center gap-2 !p-6 transition-all active:scale-[0.98] ${
                showCorrect
                  ? 'border-2 border-teal-500 bg-teal-50 ring-2 ring-teal-300'
                  : showFeedback
                    ? 'border-2 border-coral-300 bg-coral-50 ring-2 ring-coral-200'
                    : 'hover:shadow-soft-lg'
              }`}
            >
              <span className="text-5xl">{option.emoji}</span>
              <span className="text-base font-bold text-teal-800">{labelText}</span>
              {showCorrect && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600">
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
              )}
              {showFeedback && !option.correct && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-500">
                  <X className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress dots */}
      <div className="mt-8 flex justify-center gap-2">
        {selectedIndices.map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full ${
              i < currentQ
                ? 'bg-teal-500'
                : i === currentQ
                  ? 'bg-teal-300'
                  : 'bg-teal-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
