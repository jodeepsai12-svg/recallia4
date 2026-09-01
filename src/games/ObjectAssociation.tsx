import { useState, useEffect, useCallback } from 'react';
import { Link2, Check, X, ArrowRight } from 'lucide-react';
import type { GameResult, GameDifficulty } from '@/types';

interface ObjectAssociationProps {
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}

interface Question {
  prompt: string;
  promptEmoji: string;
  options: { label: string; emoji: string; correct: boolean }[];
}

const QUESTIONS: Question[] = [
  {
    prompt: 'What do you use with a key?',
    promptEmoji: '🔑',
    options: [
      { label: 'Door', emoji: '🚪', correct: true },
      { label: 'Plate', emoji: '🍽️', correct: false },
      { label: 'Pillow', emoji: '😴', correct: false },
    ],
  },
  {
    prompt: 'What goes with a cup?',
    promptEmoji: '☕',
    options: [
      { label: 'Saucer', emoji: '🫗', correct: true },
      { label: 'Shoe', emoji: '👟', correct: false },
      { label: 'Tree', emoji: '🌳', correct: false },
    ],
  },
  {
    prompt: 'What do you need for an umbrella?',
    promptEmoji: '☂️',
    options: [
      { label: 'Rain', emoji: '🌧️', correct: true },
      { label: 'Oven', emoji: '🔥', correct: false },
      { label: 'Bed', emoji: '🛏️', correct: false },
    ],
  },
  {
    prompt: 'What goes with a book?',
    promptEmoji: '📚',
    options: [
      { label: 'Bookmark', emoji: '🔖', correct: true },
      { label: 'Soap', emoji: '🧼', correct: false },
      { label: 'Tire', emoji: '🛞', correct: false },
    ],
  },
  {
    prompt: 'What do you wear with shoes?',
    promptEmoji: '👟',
    options: [
      { label: 'Socks', emoji: '🧦', correct: true },
      { label: 'Cloud', emoji: '☁️', correct: false },
      { label: 'Banana', emoji: '🍌', correct: false },
    ],
  },
  {
    prompt: 'What goes with a pen?',
    promptEmoji: '🖊️',
    options: [
      { label: 'Paper', emoji: '📄', correct: true },
      { label: 'Helmet', emoji: '⛑️', correct: false },
      { label: 'Fish', emoji: '🐟', correct: false },
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
  const config = DIFFICULTY_CONFIG[difficulty];
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [questionStart, setQuestionStart] = useState(0);

  const initRound = useCallback(() => {
    setQuestions(shuffle(QUESTIONS).slice(0, config.questionCount));
    setCurrentQ(0);
    setMistakes(0);
    setCorrectCount(0);
    setPhase('playing');
    setStartTime(Date.now());
    setQuestionStart(Date.now());
  }, [config]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const handleSelect = (index: number) => {
    if (phase !== 'playing') return;
    setSelected(index);
    setPhase('feedback');

    const question = questions[currentQ];
    const isCorrect = question.options[index].correct;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMistakes((m) => m + 1);
    }

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        const responseTime = Date.now() - startTime;
        const accuracy = Math.round((correctCount + (isCorrect ? 1 : 0)) / questions.length * 100);
        onComplete({
          game_type: 'object_association',
          score: (correctCount + (isCorrect ? 1 : 0)) * 100 - mistakes * 25,
          accuracy,
          mistakes: mistakes + (isCorrect ? 0 : 1),
          response_time_ms: responseTime,
          difficulty,
        });
      } else {
        setCurrentQ((q) => q + 1);
        setSelected(null);
        setPhase('playing');
        setQuestionStart(Date.now());
      }
    }, 2000);
  };

  if (questions.length === 0) return null;

  const question = questions[currentQ];

  return (
    <div className="animate-fade-in text-center">
      <div className="mb-2 flex items-center justify-center gap-2">
        <Link2 className="h-5 w-5 text-coral-500" />
        <span className="text-sm font-bold text-teal-500">
          Question {currentQ + 1} of {questions.length}
        </span>
      </div>

      {/* Prompt */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="card !p-8">
          <span className="text-6xl">{question.promptEmoji}</span>
          <p className="mt-4 font-display text-xl font-semibold text-teal-900">
            {question.prompt}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-3">
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const showFeedback = phase === 'feedback' && isSelected;
          const showCorrect = phase === 'feedback' && option.correct;

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
              <span className="text-base font-bold text-teal-800">{option.label}</span>
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
        {questions.map((_, i) => (
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
