import { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { GameResult, GameDifficulty } from '@/types';

interface SequenceMemoryProps {
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}

const DIFFICULTY_CONFIG: Record<GameDifficulty, { sequenceLength: number; flashMs: number; gapMs: number }> = {
  gentle: { sequenceLength: 3, flashMs: 800, gapMs: 400 },
  moderate: { sequenceLength: 4, flashMs: 700, gapMs: 350 },
  challenging: { sequenceLength: 5, flashMs: 600, gapMs: 300 },
};

type Phase = 'watching' | 'playing' | 'feedback';

const TILE_COUNT = 4;

export function SequenceMemory({ difficulty, onComplete }: SequenceMemoryProps) {
  const { t } = useI18n();
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<Phase>('watching');
  const [sequence, setSequence] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [playerStep, setPlayerStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initRound = useCallback(() => {
    const seq = Array.from({ length: config.sequenceLength }, () =>
      Math.floor(Math.random() * TILE_COUNT),
    );
    setSequence(seq);
    setPlayerStep(0);
    setMistakes(0);
    setPhase('watching');
  }, [config]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  // Play the sequence
  useEffect(() => {
    if (phase !== 'watching') return;
    let step = 0;

    const playNext = () => {
      if (step >= sequence.length) {
        setActiveTile(null);
        setPhase('playing');
        setStartTime(Date.now());
        return;
      }
      setActiveTile(sequence[step]);
      timeoutRef.current = setTimeout(() => {
        setActiveTile(null);
        timeoutRef.current = setTimeout(() => {
          step++;
          playNext();
        }, config.gapMs);
      }, config.flashMs);
    };

    const startTimer = setTimeout(playNext, 600);
    return () => {
      clearTimeout(startTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, sequence, config]);

  const handleTileClick = (tile: number) => {
    if (phase !== 'playing') return;

    if (tile === sequence[playerStep]) {
      setActiveTile(tile);
      setTimeout(() => setActiveTile(null), 300);
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      if (nextStep >= sequence.length) {
        const responseTime = Date.now() - startTime;
        const accuracy = Math.round((sequence.length / (sequence.length + mistakes)) * 100);
        setPhase('feedback');
        setTimeout(() => {
          onComplete({
            game_type: 'sequence_memory',
            score: sequence.length * 100 - mistakes * 50,
            accuracy,
            mistakes,
            response_time_ms: responseTime,
            difficulty,
          });
        }, 1500);
      }
    } else {
      setMistakes((m) => m + 1);
      setActiveTile(tile);
      setTimeout(() => setActiveTile(null), 300);
    }
  };

  const tileColors = [
    'bg-teal-500',
    'bg-coral-500',
    'bg-sand-400',
    'bg-teal-700',
  ];

  return (
    <div className="animate-fade-in text-center">
      {phase === 'watching' && (
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral-50 px-5 py-2.5 text-base font-bold text-coral-600">
            <Brain className="h-5 w-5" />
            {t.sequenceMemory.watchSequence}
          </div>
          <p className="text-base font-semibold text-teal-500">
            {t.sequenceMemory.rememberOrder}
          </p>
        </div>
      )}

      {phase === 'playing' && (
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-5 py-2.5 text-base font-bold text-teal-700">
            <ArrowRight className="h-5 w-5" />
            {t.sequenceMemory.yourTurn}
          </div>
          <p className="text-base font-semibold text-teal-500">
            {t.sequenceMemory.step} {playerStep + 1} {t.sequenceMemory.of} {sequence.length}
          </p>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-100 px-5 py-2.5 text-base font-bold text-teal-700">
            <Brain className="h-5 w-5" />
            {t.sequenceMemory.sequenceComplete}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        {Array.from({ length: TILE_COUNT }, (_, i) => i).map((tile) => (
          <button
            key={tile}
            onClick={() => handleTileClick(tile)}
            disabled={phase !== 'playing'}
            className={`h-32 rounded-3xl transition-all duration-200 sm:h-40 ${
              activeTile === tile
                ? `${tileColors[tile]} scale-105 shadow-soft-lg`
                : 'bg-teal-50 ring-2 ring-teal-100 hover:ring-teal-200'
            } ${phase === 'playing' ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
          />
        ))}
      </div>

      {phase === 'playing' && mistakes > 0 && (
        <p className="mt-4 text-sm font-bold text-coral-500">
          {mistakes} {mistakes === 1 ? t.sequenceMemory.mistake : t.sequenceMemory.mistakes} {t.sequenceMemory.keepGoing}
        </p>
      )}
    </div>
  );
}
