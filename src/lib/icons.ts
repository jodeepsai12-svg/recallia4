import {
  Brain,
  BookOpen,
  Puzzle,
  AlignLeft,
  Volume2,
  Eye,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Brain,
  BookOpen,
  Puzzle,
  AlignLeft,
  Volume2,
  Eye,
};

export function getActivityIcon(name: string): LucideIcon {
  return iconMap[name] ?? Brain;
}
