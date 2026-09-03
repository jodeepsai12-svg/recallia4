import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table mapped with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('senior'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Cognitive activities table
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  durationMinutes: integer('duration_minutes').default(10),
  difficulty: text('difficulty').default('gentle'),
  iconName: text('icon_name'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Activity completions recorded by users
export const activityCompletions = pgTable('activity_completions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  activityId: integer('activity_id').references(() => activities.id),
  durationMinutes: integer('duration_minutes'),
  completedAt: timestamp('completed_at').defaultNow(),
});

// Game sessions and cognitive training results
export const gameSessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  gameType: text('game_type').notNull(),
  gameCategory: text('game_category'),
  score: integer('score').notNull().default(0),
  accuracy: integer('accuracy').notNull().default(0),
  mistakes: integer('mistakes').notNull().default(0),
  responseTimeMs: integer('response_time_ms').notNull().default(0),
  difficulty: text('difficulty').notNull().default('gentle'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Emergency alerts and notification logs
export const emergencyAlerts = pgTable('emergency_alerts', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  participantName: text('participant_name').notNull(),
  messageText: text('message_text').notNull(),
  audioUrl: text('audio_url'),
  status: text('status').notNull().default('pending'),
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Personal reminiscence memories
export const personalMemories = pgTable('personal_memories', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  personName: text('person_name'),
  placeName: text('place_name'),
  objectName: text('object_name'),
  memoryText: text('memory_text').notNull(),
  photoUrl: text('photo_url'),
  isApproved: boolean('is_approved').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  completions: many(activityCompletions),
  gameSessions: many(gameSessions),
  alerts: many(emergencyAlerts),
  memories: many(personalMemories),
}));

export const activitiesRelations = relations(activities, ({ many }) => ({
  completions: many(activityCompletions),
}));

export const activityCompletionsRelations = relations(activityCompletions, ({ one }) => ({
  user: one(users, {
    fields: [activityCompletions.userUid],
    references: [users.uid],
  }),
  activity: one(activities, {
    fields: [activityCompletions.activityId],
    references: [activities.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  user: one(users, {
    fields: [gameSessions.userUid],
    references: [users.uid],
  }),
}));

export const emergencyAlertsRelations = relations(emergencyAlerts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyAlerts.userUid],
    references: [users.uid],
  }),
}));

export const personalMemoriesRelations = relations(personalMemories, ({ one }) => ({
  user: one(users, {
    fields: [personalMemories.userUid],
    references: [users.uid],
  }),
}));
