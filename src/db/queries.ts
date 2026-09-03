import { db } from './index.ts';
import { activities, activityCompletions, emergencyAlerts, gameSessions, personalMemories } from './schema.ts';
import { desc, eq } from 'drizzle-orm';

export async function getActivities() {
  try {
    return await db.select().from(activities).orderBy(activities.sortOrder);
  } catch (error) {
    console.error('Database getActivities failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function recordActivityCompletion(data: {
  userUid: string;
  activityId: number;
  durationMinutes?: number;
}) {
  try {
    const result = await db.insert(activityCompletions).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Database recordActivityCompletion failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function recordGameSession(data: {
  userUid: string;
  gameType: string;
  gameCategory?: string;
  score: number;
  accuracy: number;
  mistakes: number;
  responseTimeMs: number;
  difficulty: string;
}) {
  try {
    const result = await db.insert(gameSessions).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Database recordGameSession failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getGameSessionsByUser(userUid: string) {
  try {
    return await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userUid, userUid))
      .orderBy(desc(gameSessions.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database getGameSessionsByUser failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function logEmergencyAlert(data: {
  userUid: string;
  participantName: string;
  messageText: string;
  audioUrl?: string;
  tags?: string;
}) {
  try {
    const result = await db.insert(emergencyAlerts).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Database logEmergencyAlert failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getEmergencyAlertsByUser(userUid: string) {
  try {
    return await db
      .select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.userUid, userUid))
      .orderBy(desc(emergencyAlerts.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database getEmergencyAlertsByUser failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getPersonalMemoriesByUser(userUid: string) {
  try {
    return await db
      .select()
      .from(personalMemories)
      .where(eq(personalMemories.userUid, userUid))
      .orderBy(desc(personalMemories.createdAt));
  } catch (error) {
    console.error('Database getPersonalMemoriesByUser failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
