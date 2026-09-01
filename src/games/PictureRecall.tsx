import { useState, useEffect, useCallback } from 'react';
import { Eye, Check, X, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { GameResult, GameDifficulty } from '@/types';

interface PictureRecallProps {
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}

interface PictureItem {
  id: string;
  label: string;
  emoji: string;
}

const ALL_ITEMS: PictureItem[] = [
  { id: 'apple', label: 'Apple', emoji: '🍎' },
  { id: 'key', label: 'Key', emoji: '🔑' },
  { id: 'cup', label: 'Cup', emoji: '☕' },
  { id: 'book', label: 'Book', emoji: '📚' },
  { id: 'clock', label: 'Clock', emoji: '🕐' },
  { id: 'flower', label: 'Flower', emoji: '🌸' },
  { id: 'hat', label: 'Hat', emoji: '🎩' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'umbrella', label: 'Umbrella', emoji: '☂️' },
  { id: 'scissors', label: 'Scissors', emoji: '✂️' },
];

const DIFFICULTY_CONFIG: Record<GameDifficulty, { shown: number; total: number; memorizeSec: number }> = {
  gentle: { shown: 4, total: 6, memorizeSec: 6 },
  moderate: { shown: 5, total: 8, memorizeSec: 5 },
  challenging: { shown: 6, total: 9, memorizeSec: 4 },
};

type Phase = 'memorize' | 'select' | 'feedback';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PictureRecall({ difficulty, onComplete }: PictureRecallProps) {
  const { t } = useI18n();
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<Phase>('memorize');
  const [shownItems, setShownItems] = useState<PictureItem[]>([]);
  const [displayItems, setDisplayItems] = useState<PictureItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(config.memorizeSec);
  const [startTime, setStartTime] = useState(0);

  const getItemLabel = (item: PictureItem) => {
    return t.pictureRecall.items[item.id as keyof typeof t.pictureRecall.items] || item.label;
  };

  const initRound = useCallback(() => {
    const shuffled = shuffle(ALL_ITEMS);
    const shown = shuffled.slice(0, config.shown);
    const remaining = shuffled.slice(config.shown, config.shown + (config.total - config.shown));
    setShownItems(shown);
    setDisplayItems(shuffle([...shown, ...remaining]));
    setSelected(new Set());
    setPhase('memorize');
    setCountdown(config.memorizeSec);
  }, [config]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  useEffect(() => {
    if (phase !== 'memorize') return;
    if (countdown <= 0) {
      setPhase('select');
      setStartTime(Date.now());
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = () => {
    const shownIds = new Set(shownItems.map((i) => i.id));
    const correct = displayItems.filter((i) => shownIds.has(i.id) && selected.has(i.id));
    const wrong = displayItems.filter((i) => !shownIds.has(i.id) && selected.has(i.id));
    const missed = shownItems.filter((i) => !selected.has(i.id));

    const responseTime = Date.now() - startTime;
    const accuracy = Math.round((correct.length / shownItems.length) * 100);
    const mistakes = wrong.length + missed.length;
    const score = correct.length * 100 - mistakes * 25;

    setPhase('feedback');

    setTimeout(() => {
      onComplete({
        game_type: 'picture_recall',
        score: Math.max(0, score),
        accuracy,
        mistakes,
        response_time_ms: responseTime,
        difficulty,
      });
    }, 3000);
  };

  return (
    <div className="animate-fade-in">
      {phase === 'memorize' && (
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-coral-50 px-5 py-2.5 text-base font-bold text-coral-600">
            <Eye className="h-5 w-5" />
            {t.pictureRecall.memorizeObjects}
          </div>
          <p className="mb-6 text-lg font-bold text-teal-600">
            {t.pictureRecall.startingIn} {countdown}...
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {shownItems.map((item) => (
              <div
                key={item.id}
                className="card flex flex-col items-center gap-2 !p-5 animate-gentle-pulse"
              >
                <span className="text-5xl">{item.emoji}</span>
                <span className="text-base font-bold text-teal-800">{getItemLabel(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'select' && (
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-5 py-2.5 text-base font-bold text-teal-700">
            <Check className="h-5 w-5" />
            {t.pictureRecall.whichObjects}
          </div>
          <p className="mb-6 text-base font-semibold text-teal-500">
            {t.pictureRecall.tapRemember}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {displayItems.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`card flex flex-col items-center gap-2 !p-5 transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-2 border-teal-500 bg-teal-50 ring-2 ring-teal-300'
                      : 'hover:shadow-soft-lg'
                  }`}
                >
                  <span className="text-5xl">{item.emoji}</span>
                  <span className="text-base font-bold text-teal-800">{getItemLabel(item)}</span>
                  {isSelected && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600">
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            className="btn-primary mt-8"
          >
            {t.pictureRecall.done}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="text-center">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {displayItems.map((item) => {
              const wasShown = shownItems.some((s) => s.id === item.id);
              const wasSelected = selected.has(item.id);
              const isCorrect = wasShown === wasSelected;
              return (
                <div
                  key={item.id}
                  className={`card flex flex-col items-center gap-2 !p-5 ${
                    isCorrect ? 'ring-2 ring-teal-300' : 'ring-2 ring-coral-200'
                  }`}
                >
                  <span className="text-5xl">{item.emoji}</span>
                  <span className="text-base font-bold text-teal-800">{getItemLabel(item)}</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    {isCorrect ? (
                      <span className="text-teal-600">
                        <Check className="inline h-4 w-4" /> {t.pictureRecall.correct}
                      </span>
                    ) : (
                      <span className="text-coral-600">
                        <X className="inline h-4 w-4" /> {wasShown ? t.pictureRecall.wasShown : t.pictureRecall.wasNotShown}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
