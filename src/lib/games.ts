import {
  Eye,
  Brain,
  Link2,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import type { GameType, GameDifficulty, GameCategory } from '@/types';

export interface GameMeta {
  type: GameType;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  difficulty: GameDifficulty;
  durationMinutes: number;
  category: GameCategory;
  categoryLabel: string;
}

export const GAMES: GameMeta[] = [
  {
    type: 'picture_recall',
    title: 'Picture Recall',
    tagline: 'Remember what you saw',
    description: 'Look at a set of familiar objects, then identify which ones were shown.',
    icon: Eye,
    difficulty: 'gentle',
    durationMinutes: 5,
    category: 'visual_recall',
    categoryLabel: 'Visual recall',
  },
  {
    type: 'sequence_memory',
    title: 'Sequence Memory',
    tagline: 'Watch and repeat',
    description: 'Watch a sequence light up, then reproduce it in the same order.',
    icon: Brain,
    difficulty: 'gentle',
    durationMinutes: 4,
    category: 'sequential_memory',
    categoryLabel: 'Sequential memory',
  },
  {
    type: 'object_association',
    title: 'Object Association',
    tagline: 'Match things that go together',
    description: 'Look at everyday objects and choose the one that goes with each prompt.',
    icon: Link2,
    difficulty: 'gentle',
    durationMinutes: 5,
    category: 'verbal_association',
    categoryLabel: 'Verbal association',
  },
  {
    type: 'story_recall',
    title: 'Story Recall',
    tagline: 'Read and remember',
    description: 'Read a short story, then answer a few simple questions about it.',
    icon: BookOpen,
    difficulty: 'gentle',
    durationMinutes: 6,
    category: 'reading_comprehension',
    categoryLabel: 'Reading comprehension',
  },
];

export function getGame(type: GameType): GameMeta | undefined {
  return GAMES.find((g) => g.type === type);
}
