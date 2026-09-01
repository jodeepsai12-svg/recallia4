import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { Activity, ActivityCompletion, GameSession, EmergencyAlert } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isValidSupabaseConfig = (url?: string, key?: string): boolean => {
  if (!url || !key) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (url.includes('placeholder') || key.includes('placeholder')) return false;
  return true;
};

// Seed activities for offline / local-first storage
export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Memory Match',
    description: 'Flip cards to find matching pairs and give your memory a gentle workout.',
    category: 'memory',
    duration_minutes: 5,
    difficulty: 'gentle',
    icon_name: 'Brain',
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Word Recall',
    description: 'Read a short list of words, then try to remember as many as you can.',
    category: 'memory',
    duration_minutes: 7,
    difficulty: 'gentle',
    icon_name: 'BookOpen',
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Picture Puzzle',
    description: 'Arrange shuffled pieces to complete a calming picture.',
    category: 'problem-solving',
    duration_minutes: 10,
    difficulty: 'moderate',
    icon_name: 'Puzzle',
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Story Sequencing',
    description: 'Put a short story in the right order, from beginning to end.',
    category: 'language',
    duration_minutes: 8,
    difficulty: 'gentle',
    icon_name: 'AlignLeft',
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Sound Recognition',
    description: 'Listen carefully and pick the sound that matches the picture.',
    category: 'attention',
    duration_minutes: 5,
    difficulty: 'gentle',
    icon_name: 'Volume2',
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: 'Spot the Difference',
    description: 'Find the small differences between two nearly identical scenes.',
    category: 'attention',
    duration_minutes: 6,
    difficulty: 'moderate',
    icon_name: 'Eye',
    sort_order: 6,
    created_at: new Date().toISOString(),
  },
];

// In-memory / LocalStorage client fallback
function createLocalClient() {
  const STORAGE_KEYS = {
    USER: 'recallia_auth_user',
    COMPLETIONS: 'recallia_completions',
    SESSIONS: 'recallia_game_sessions',
    ALERTS: 'recallia_emergency_alerts',
  };

  const authListeners: Array<(event: string, session: Session | null) => void> = [];

  const getStoredUser = (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const setStoredUser = (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const getStoredCompletions = (): ActivityCompletion[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const setStoredCompletions = (items: ActivityCompletion[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const getStoredSessions = (): GameSession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const setStoredSessions = (items: GameSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const getStoredAlerts = (): EmergencyAlert[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const setStoredAlerts = (items: EmergencyAlert[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const createSessionFromUser = (user: User | null): Session | null => {
    if (!user) return null;
    return {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user,
    } as Session;
  };

  return {
    auth: {
      getSession: async () => {
        const user = getStoredUser();
        return { data: { session: createSessionFromUser(user) }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
        authListeners.push(callback);
        const user = getStoredUser();
        callback('INITIAL_SESSION', createSessionFromUser(user));
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = authListeners.indexOf(callback);
                if (index > -1) authListeners.splice(index, 1);
              },
            },
          },
        };
      },
      signInWithPassword: async ({ email }: { email: string; password?: string }) => {
        const user: User = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          email,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;
        setStoredUser(user);
        const session = createSessionFromUser(user);
        authListeners.forEach((cb) => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      signUp: async ({ email }: { email: string; password?: string }) => {
        const user: User = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          email,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;
        setStoredUser(user);
        const session = createSessionFromUser(user);
        authListeners.forEach((cb) => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        setStoredUser(null);
        authListeners.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      },
    },
    from: (table: string) => {
      return {
        select: () => {
          const execute = async () => {
            if (table === 'activities') {
              return { data: INITIAL_ACTIVITIES, error: null };
            }
            if (table === 'activity_completions') {
              const list = getStoredCompletions().map((comp) => ({
                ...comp,
                activity: INITIAL_ACTIVITIES.find((a) => a.id === comp.activity_id),
              }));
              return { data: list, error: null };
            }
            if (table === 'game_sessions') {
              return { data: getStoredSessions(), error: null };
            }
            if (table === 'emergency_alerts') {
              return { data: getStoredAlerts(), error: null };
            }
            return { data: [], error: null };
          };

          const builder = {
            order: (field: string, options?: { ascending?: boolean }) => {
              return execute().then(({ data, error }) => {
                if (!data) return { data, error };
                const sorted = [...data].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
                  const valA = a[field];
                  const valB = b[field];
                  if (valA === valB) return 0;
                  if (options?.ascending) return (valA as number | string) > (valB as number | string) ? 1 : -1;
                  return (valA as number | string) < (valB as number | string) ? 1 : -1;
                });
                return { data: sorted, error };
              });
            },
            then: <TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
              resolve?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
              reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
            ) => execute().then(resolve, reject),
          };

          return builder;
        },
        insert: async (data: Record<string, unknown>) => {
          const user = getStoredUser();
          const userId = user?.id ?? 'guest-user';
          if (table === 'emergency_alerts') {
            const current = getStoredAlerts();
            const newAlert = {
              id: 'alert_' + Math.random().toString(36).substring(2, 9),
              user_id: userId,
              participant_name: (data.participant_name as string) || user?.user_metadata?.full_name || 'Senior Participant',
              message_text: (data.message_text as string) || 'Emergency assistance requested',
              audio_url: data.audio_url as string | undefined,
              audio_duration_seconds: data.audio_duration_seconds as number | undefined,
              tags: (data.tags as string[]) || [],
              status: (data.status as 'pending' | 'acknowledged' | 'resolved') || 'pending',
              created_at: new Date().toISOString(),
            };
            setStoredAlerts([newAlert, ...current]);
            return { data: newAlert, error: null };
          }
          if (table === 'activity_completions') {
            const current = getStoredCompletions();
            const newRecord: ActivityCompletion = {
              id: 'comp_' + Math.random().toString(36).substring(2, 9),
              user_id: userId,
              activity_id: String(data.activity_id),
              completed_at: new Date().toISOString(),
              duration_minutes: typeof data.duration_minutes === 'number' ? data.duration_minutes : 5,
              activity: INITIAL_ACTIVITIES.find((a) => a.id === data.activity_id),
            };
            setStoredCompletions([newRecord, ...current]);
            return { data: newRecord, error: null };
          }
          if (table === 'game_sessions') {
            const current = getStoredSessions();
            const newSession: GameSession = {
              id: 'sess_' + Math.random().toString(36).substring(2, 9),
              user_id: userId,
              game_type: data.game_type as GameSession['game_type'],
              game_category: (data.game_category as GameSession['game_category']) ?? null,
              score: typeof data.score === 'number' ? data.score : 0,
              accuracy: typeof data.accuracy === 'number' ? data.accuracy : 0,
              mistakes: typeof data.mistakes === 'number' ? data.mistakes : 0,
              response_time_ms: typeof data.response_time_ms === 'number' ? data.response_time_ms : 0,
              difficulty: (data.difficulty as GameSession['difficulty']) ?? 'gentle',
              created_at: new Date().toISOString(),
            };
            setStoredSessions([newSession, ...current]);
            return { data: newSession, error: null };
          }
          return { data: null, error: null };
        },
        update: async (updates: Record<string, unknown>) => {
          return {
            eq: (field: string, value: unknown) => {
              if (table === 'emergency_alerts') {
                const current = getStoredAlerts();
                const next = current.map((item) =>
                  item[field] === value ? { ...item, ...updates } : item
                );
                setStoredAlerts(next);
                return Promise.resolve({ data: next, error: null });
              }
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  };
}

export const supabase = isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (createLocalClient() as unknown as ReturnType<typeof createClient>);
