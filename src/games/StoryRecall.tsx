import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Check, X, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { GameResult, GameDifficulty } from '@/types';

interface StoryRecallProps {
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}

interface BaseStoryDef {
  id: number;
  defaultTitle: string;
  defaultText: string;
  questions: {
    defaultQuestion: string;
    defaultOptions: string[];
    correctIndex: number;
  }[];
}

const BASE_STORIES: BaseStoryDef[] = [
  {
    id: 0,
    defaultTitle: 'A Morning Walk',
    defaultText: 'Mary woke up early on Sunday. She put on her blue coat and walked to the park. At the park, she met her friend Tom. They sat on a bench and shared a basket of apples. Then Mary walked home and made a cup of tea.',
    questions: [
      {
        defaultQuestion: 'What day did Mary go to the park?',
        defaultOptions: ['Saturday', 'Sunday', 'Monday'],
        correctIndex: 1,
      },
      {
        defaultQuestion: "What color was Mary's coat?",
        defaultOptions: ['Red', 'Green', 'Blue'],
        correctIndex: 2,
      },
      {
        defaultQuestion: 'Who did Mary meet at the park?',
        defaultOptions: ['Tom', 'Anna', 'Her sister'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 1,
    defaultTitle: 'The Garden',
    defaultText: 'James decided to plant a garden in his backyard. He bought tomato seeds, carrot seeds, and sunflower seeds. He planted them in three rows. Every morning he watered the garden before breakfast. By summer, the sunflowers grew taller than his fence.',
    questions: [
      {
        defaultQuestion: 'What did James plant?',
        defaultOptions: ['Tomatoes, carrots, and sunflowers', 'Roses and tulips', 'Only tomatoes'],
        correctIndex: 0,
      },
      {
        defaultQuestion: 'When did James water the garden?',
        defaultOptions: ['After dinner', 'Before breakfast', 'At noon'],
        correctIndex: 1,
      },
      {
        defaultQuestion: 'What grew taller than the fence?',
        defaultOptions: ['The carrots', 'The tomatoes', 'The sunflowers'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 2,
    defaultTitle: 'The Library Visit',
    defaultText: 'Anna loves reading. Every Wednesday she visits the library. Last week she borrowed a book about the ocean and a book about birds. The librarian, Mr. Lee, helped her find a comfortable chair by the window. Anna read for two hours, then returned both books.',
    questions: [
      {
        defaultQuestion: 'Which day does Anna visit the library?',
        defaultOptions: ['Monday', 'Wednesday', 'Friday'],
        correctIndex: 1,
      },
      {
        defaultQuestion: 'What books did Anna borrow?',
        defaultOptions: ['Ocean and birds', 'Cooking and travel', 'History and art'],
        correctIndex: 0,
      },
      {
        defaultQuestion: 'Who helped Anna find a chair?',
        defaultOptions: ['Mrs. Park', 'Mr. Lee', 'Anna herself'],
        correctIndex: 1,
      },
    ],
  },
];

type Phase = 'reading' | 'questions' | 'feedback';

export function StoryRecall({ difficulty, onComplete }: StoryRecallProps) {
  const { t } = useI18n();
  const [storyIndex, setStoryIndex] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>('reading');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const initRound = useCallback(() => {
    const idx = Math.floor(Math.random() * BASE_STORIES.length);
    setStoryIndex(idx);
    setPhase('reading');
    setCurrentQ(0);
    setMistakes(0);
    setCorrectCount(0);
    setSelected(null);
  }, []);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const baseStory = BASE_STORIES[storyIndex];
  const translatedStory = t.storyRecall.stories?.[storyIndex];
  const storyTitle = translatedStory?.title || baseStory.defaultTitle;
  const storyText = translatedStory?.text || baseStory.defaultText;
  const questionsCount = baseStory.questions.length;

  const currentBaseQ = baseStory.questions[currentQ];
  const translatedQ = translatedStory?.questions?.[currentQ];
  const questionPrompt = translatedQ?.question || currentBaseQ.defaultQuestion;

  const handleStartQuestions = () => {
    setPhase('questions');
    setStartTime(Date.now());
  };

  const handleAnswer = (index: number) => {
    if (phase !== 'questions') return;
    setSelected(index);
    setPhase('feedback');

    const isCorrect = index === currentBaseQ.correctIndex;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMistakes((m) => m + 1);
    }

    setTimeout(() => {
      if (currentQ + 1 >= questionsCount) {
        const responseTime = Date.now() - startTime;
        const totalCorrect = correctCount + (isCorrect ? 1 : 0);
        const accuracy = Math.round((totalCorrect / questionsCount) * 100);
        onComplete({
          game_type: 'story_recall',
          score: totalCorrect * 100 - (mistakes + (isCorrect ? 0 : 1)) * 25,
          accuracy,
          mistakes: mistakes + (isCorrect ? 0 : 1),
          response_time_ms: responseTime,
          difficulty,
        });
      } else {
        setCurrentQ((q) => q + 1);
        setSelected(null);
        setPhase('questions');
      }
    }, 2000);
  };

  return (
    <div className="animate-fade-in">
      {phase === 'reading' && (
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-coral-50 px-5 py-2.5 text-base font-bold text-coral-600">
            <BookOpen className="h-5 w-5" />
            {t.storyRecall.readCarefully}
          </div>

          <div className="card mx-auto max-w-2xl !p-8 text-left">
            <h3 className="mb-4 font-display text-2xl font-semibold text-teal-900">
              {storyTitle}
            </h3>
            <p className="text-lg leading-relaxed text-teal-700">{storyText}</p>
          </div>

          <button onClick={handleStartQuestions} className="btn-primary mt-8">
            {t.storyRecall.readyForQuestions}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {(phase === 'questions' || phase === 'feedback') && (
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600" />
            <span className="text-sm font-bold text-teal-500">
              {t.storyRecall.question} {currentQ + 1} {t.storyRecall.of} {questionsCount}
            </span>
          </div>

          <div className="mx-auto mb-8 max-w-xl">
            <div className="card !p-6">
              <p className="font-display text-xl font-semibold text-teal-900">
                {questionPrompt}
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-lg gap-3">
            {currentBaseQ.defaultOptions.map((defaultOption, index) => {
              const isSelected = selected === index;
              const showFeedback = phase === 'feedback' && isSelected;
              const showCorrect = phase === 'feedback' && index === currentBaseQ.correctIndex;
              const optionLabel = translatedQ?.options?.[index] || defaultOption;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={phase !== 'questions'}
                  className={`card flex items-center justify-between !p-5 text-left transition-all active:scale-[0.98] ${
                    showCorrect
                      ? 'border-2 border-teal-500 bg-teal-50 ring-2 ring-teal-300'
                      : showFeedback
                        ? 'border-2 border-coral-300 bg-coral-50 ring-2 ring-coral-200'
                        : 'hover:shadow-soft-lg'
                  }`}
                >
                  <span className="text-lg font-bold text-teal-800">{optionLabel}</span>
                  {showCorrect && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                  {showFeedback && !showCorrect && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-500">
                      <X className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2">
            {baseStory.questions.map((_, i) => (
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
      )}
    </div>
  );
}
