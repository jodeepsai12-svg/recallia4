import type { GameSession, GameType } from '@/types';

export interface LinkedParticipant {
  id: string;
  name: string;
  relationship: string;
  age: number;
  avatarEmoji: string;
  consentDate: string;
  accessLevel: 'full' | 'summary_only';
  primaryCaregiverName: string;
  accessCode: string;
  weeklyGoalSessions: number;
  emailAlerts: boolean;
  inactivityAlerts: boolean;
  milestoneAlerts: boolean;
}

export const DEFAULT_PARTICIPANTS: LinkedParticipant[] = [
  {
    id: 'participant_mary',
    name: 'Mary Jenkins',
    relationship: 'Mother',
    age: 78,
    avatarEmoji: '👵',
    consentDate: '2026-08-15',
    accessLevel: 'full',
    primaryCaregiverName: 'Family Caregiver',
    accessCode: 'MJ-7821-CARE',
    weeklyGoalSessions: 5,
    emailAlerts: true,
    inactivityAlerts: true,
    milestoneAlerts: true,
  },
  {
    id: 'participant_robert',
    name: 'Robert Chen',
    relationship: 'Father',
    age: 82,
    avatarEmoji: '👴',
    consentDate: '2026-08-20',
    accessLevel: 'full',
    primaryCaregiverName: 'Family Caregiver',
    accessCode: 'RC-9412-CARE',
    weeklyGoalSessions: 4,
    emailAlerts: true,
    inactivityAlerts: false,
    milestoneAlerts: true,
  },
];

// Sample historical sessions for demonstration if user has few sessions
export const SAMPLE_HISTORICAL_SESSIONS: GameSession[] = [
  {
    id: 'demo_1',
    user_id: 'participant_mary',
    game_type: 'picture_recall',
    game_category: 'visual_recall',
    score: 380,
    accuracy: 95,
    mistakes: 0,
    response_time_ms: 3200,
    difficulty: 'moderate',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'demo_2',
    user_id: 'participant_mary',
    game_type: 'sequence_memory',
    game_category: 'sequential_memory',
    score: 290,
    accuracy: 90,
    mistakes: 1,
    response_time_ms: 4100,
    difficulty: 'gentle',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
  },
  {
    id: 'demo_3',
    user_id: 'participant_mary',
    game_type: 'story_recall',
    game_category: 'reading_comprehension',
    score: 300,
    accuracy: 100,
    mistakes: 0,
    response_time_ms: 5400,
    difficulty: 'moderate',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
  },
  {
    id: 'demo_4',
    user_id: 'participant_mary',
    game_type: 'object_association',
    game_category: 'verbal_association',
    score: 375,
    accuracy: 92,
    mistakes: 1,
    response_time_ms: 3600,
    difficulty: 'gentle',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString(), // 3 days ago
  },
  {
    id: 'demo_5',
    user_id: 'participant_mary',
    game_type: 'picture_recall',
    game_category: 'visual_recall',
    score: 360,
    accuracy: 88,
    mistakes: 1,
    response_time_ms: 3900,
    difficulty: 'gentle',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 98).toISOString(), // 4 days ago
  },
  {
    id: 'demo_6',
    user_id: 'participant_mary',
    game_type: 'sequence_memory',
    game_category: 'sequential_memory',
    score: 310,
    accuracy: 95,
    mistakes: 0,
    response_time_ms: 3800,
    difficulty: 'moderate',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 122).toISOString(), // 5 days ago
  },
  {
    id: 'demo_7',
    user_id: 'participant_mary',
    game_type: 'story_recall',
    game_category: 'reading_comprehension',
    score: 280,
    accuracy: 85,
    mistakes: 1,
    response_time_ms: 6100,
    difficulty: 'gentle',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 146).toISOString(), // 6 days ago
  },
];

export interface CategorySummary {
  categoryKey: string;
  name: string;
  gameType: GameType;
  description: string;
  sessionsCount: number;
  averageAccuracy: number;
  averageResponseTimeSec: number;
  preferredDifficulty: string;
  iconName: string;
}

export interface DayActivityData {
  dayName: string;
  dateStr: string;
  sessionsCount: number;
  avgAccuracy: number;
}

export interface RecalliaInsight {
  id: string;
  title: string;
  description: string;
  category: 'engagement' | 'preference' | 'rhythm' | 'consistency';
  icon: string;
}

export function computeCaregiverMetrics(sessions: GameSession[]) {
  const totalSessions = sessions.length;
  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      weeklySessions: 0,
      averageAccuracy: 0,
      averageResponseTimeSec: 0,
      gameCounts: {
        picture_recall: 0,
        sequence_memory: 0,
        object_association: 0,
        story_recall: 0,
      },
      categories: [],
      dailyTrends: [],
      insights: [
        {
          id: 'ins_welcome',
          title: 'Getting Started',
          description: 'No cognitive activity sessions have been recorded yet this week. As activities are completed, engagement patterns and non-diagnostic summaries will appear here.',
          category: 'engagement' as const,
          icon: 'Sparkles',
        },
      ],
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklySessions = sessions.filter((s) => new Date(s.created_at) >= sevenDaysAgo);

  const totalAccuracySum = sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0);
  const averageAccuracy = Math.round(totalAccuracySum / totalSessions);

  const totalTimeSum = sessions.reduce((sum, s) => sum + (s.response_time_ms || 0), 0);
  const averageResponseTimeSec = Number((totalTimeSum / totalSessions / 1000).toFixed(1));

  // Game counts
  const gameCounts = {
    picture_recall: sessions.filter((s) => s.game_type === 'picture_recall').length,
    sequence_memory: sessions.filter((s) => s.game_type === 'sequence_memory').length,
    object_association: sessions.filter((s) => s.game_type === 'object_association').length,
    story_recall: sessions.filter((s) => s.game_type === 'story_recall').length,
  };

  // Category breakdown
  const categoryDefs: Array<{
    key: string;
    name: string;
    gameType: GameType;
    desc: string;
    icon: string;
  }> = [
    {
      key: 'visual_recall',
      name: 'Visual Recall',
      gameType: 'picture_recall',
      desc: 'Remembering everyday objects & imagery',
      icon: 'Eye',
    },
    {
      key: 'sequential_memory',
      name: 'Sequential Memory',
      gameType: 'sequence_memory',
      desc: 'Pattern following & working memory',
      icon: 'Brain',
    },
    {
      key: 'verbal_association',
      name: 'Verbal Association',
      gameType: 'object_association',
      desc: 'Semantic relationships & conceptual pairing',
      icon: 'Link2',
    },
    {
      key: 'reading_comprehension',
      name: 'Story Recall',
      gameType: 'story_recall',
      desc: 'Reading narrative retention & detail recall',
      icon: 'BookOpen',
    },
  ];

  const categories: CategorySummary[] = categoryDefs.map((def) => {
    const catSessions = sessions.filter((s) => s.game_type === def.gameType);
    const count = catSessions.length;
    const catAccuracy = count > 0 ? Math.round(catSessions.reduce((sum, s) => sum + s.accuracy, 0) / count) : 0;
    const catTime = count > 0 ? Number((catSessions.reduce((sum, s) => sum + s.response_time_ms, 0) / count / 1000).toFixed(1)) : 0;

    // determine most common difficulty
    const diffMap: Record<string, number> = { gentle: 0, moderate: 0, challenging: 0 };
    catSessions.forEach((s) => {
      if (s.difficulty) diffMap[s.difficulty] = (diffMap[s.difficulty] || 0) + 1;
    });
    let prefDiff = 'gentle';
    if (diffMap.moderate >= diffMap.gentle && diffMap.moderate >= diffMap.challenging) prefDiff = 'moderate';
    if (diffMap.challenging > diffMap.moderate && diffMap.challenging > diffMap.gentle) prefDiff = 'challenging';

    return {
      categoryKey: def.key,
      name: def.name,
      gameType: def.gameType,
      description: def.desc,
      sessionsCount: count,
      averageAccuracy: catAccuracy,
      averageResponseTimeSec: catTime,
      preferredDifficulty: prefDiff,
      iconName: def.icon,
    };
  });

  // Daily Trends for the past 7 days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTrends: DayActivityData[] = [];

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySessions = sessions.filter((s) => {
      const d = new Date(s.created_at);
      return d >= targetDate && d < nextDate;
    });

    const dayAccuracy = daySessions.length > 0
      ? Math.round(daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length)
      : 0;

    dailyTrends.push({
      dayName: dayNames[targetDate.getDay()],
      dateStr: targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sessionsCount: daySessions.length,
      avgAccuracy: dayAccuracy,
    });
  }

  // Generate Strictly Non-Diagnostic Insights
  const insights: RecalliaInsight[] = [];

  // 1. Weekly completion insight
  const thisWeekCount = weeklySessions.length;
  insights.push({
    id: 'ins_weekly_count',
    title: 'Weekly Cognitive Activity',
    description: `The user has completed ${thisWeekCount} cognitive ${thisWeekCount === 1 ? 'activity' : 'activities'} this week.`,
    category: 'engagement',
    icon: 'Calendar',
  });

  // 2. Most frequent activity insight
  let maxGame: GameType = 'picture_recall';
  let maxGameCount = 0;
  (Object.keys(gameCounts) as GameType[]).forEach((gt) => {
    if (gameCounts[gt] > maxGameCount) {
      maxGameCount = gameCounts[gt];
      maxGame = gt;
    }
  });

  const gameNames: Record<GameType, string> = {
    picture_recall: 'Visual recall activities (Picture Recall)',
    sequence_memory: 'Sequential memory exercises (Sequence Memory)',
    object_association: 'Verbal association tasks (Object Association)',
    story_recall: 'Narrative retention activities (Story Recall)',
  };

  if (maxGameCount > 0) {
    insights.push({
      id: 'ins_frequent_game',
      title: 'Activity Preference',
      description: `${gameNames[maxGame]} have been completed most frequently (${maxGameCount} ${maxGameCount === 1 ? 'session' : 'sessions'}).`,
      category: 'preference',
      icon: 'Sparkles',
    });
  }

  // 3. Accuracy stability insight
  if (averageAccuracy > 0) {
    insights.push({
      id: 'ins_accuracy_trend',
      title: 'Performance Stability',
      description: `Average accuracy across completed activities is currently at ${averageAccuracy}%, reflecting solid engagement with prompts.`,
      category: 'consistency',
      icon: 'TrendingUp',
    });
  }

  // 4. Response pace insight
  if (averageResponseTimeSec > 0) {
    insights.push({
      id: 'ins_response_pace',
      title: 'Pacing & Focus',
      description: `Response time averaged ${averageResponseTimeSec} seconds per task, indicating a calm, attentive, and unhurried rhythm.`,
      category: 'rhythm',
      icon: 'Clock',
    });
  }

  return {
    totalSessions,
    weeklySessions: thisWeekCount,
    averageAccuracy,
    averageResponseTimeSec,
    gameCounts,
    categories,
    dailyTrends,
    insights,
  };
}
