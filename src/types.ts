export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  difficulty: string;
  icon_name: string;
  sort_order: number;
  created_at: string;
}

export interface ActivityCompletion {
  id: string;
  user_id: string;
  activity_id: string;
  completed_at: string;
  duration_minutes: number | null;
  activity?: Activity;
}

export type GameType =
  | 'picture_recall'
  | 'sequence_memory'
  | 'object_association'
  | 'story_recall'
  | 'my_memories';

export type GameDifficulty = 'gentle' | 'moderate' | 'challenging';

export type GameCategory =
  | 'visual_recall'
  | 'sequential_memory'
  | 'verbal_association'
  | 'reading_comprehension'
  | 'personal_reminiscence';

export interface GameResult {
  game_type: GameType;
  score: number;
  accuracy: number;
  mistakes: number;
  response_time_ms: number;
  difficulty: GameDifficulty;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  game_category: GameCategory | null;
  score: number;
  accuracy: number;
  mistakes: number;
  response_time_ms: number;
  difficulty: GameDifficulty;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  participant_name: string;
  message_text: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  tags?: string[];
  status: 'pending' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface CognitiveDeclineAlert {
  id: string;
  user_id: string;
  participant_name: string;
  alarm_level: 'critical' | 'warning' | 'moderate';
  title: string;
  description: string;
  decline_percentage: number;
  baseline_accuracy: number;
  current_accuracy: number;
  baseline_response_time_ms: number;
  current_response_time_ms: number;
  affected_areas: string[];
  consecutive_drop_count: number;
  recommendations: string[];
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  siren_active: boolean;
}

export interface PersonalMemory {
  id: string;
  participant_id: string;
  person_name: string;
  place_name: string;
  object_name: string;
  memory_text: string;
  photo_url?: string;
  photo_alt?: string;
  is_approved: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CaregiverInfo {
  name: string;
  phoneNumber: string;
  relationship: string;
  caregiverUid?: string;
  linkingCode?: string;
  linkingCodeExpiresAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photoURL?: string | null;
  authProvider: 'google' | 'phone' | 'password' | 'anonymous';
  createdAt: string;
  updatedAt: string;
  caregiver?: CaregiverInfo;
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  preferredLanguage?: string;
  role?: 'user' | 'caregiver' | 'admin';
  linkedCaregiverUids?: string[];
}

export interface CaregiverLink {
  code: string;
  userUid: string;
  userName: string;
  userPhone?: string;
  caregiverPhone?: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedByUid?: string;
}

export interface PersonalMemoryConsent {
  participant_id: string;
  has_consent: boolean;
  consent_given_by: string;
  consent_date: string;
  notes?: string;
}

