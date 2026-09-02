import type { PersonalMemory, PersonalMemoryConsent } from '@/types';

const MEMORIES_STORAGE_KEY_PREFIX = 'recallia_personal_memories_';
const CONSENT_STORAGE_KEY_PREFIX = 'recallia_memories_consent_';

// Curated peaceful default memories for initial demonstration and testing
export const DEFAULT_PERSONAL_MEMORIES: Record<string, PersonalMemory[]> = {
  participant_mary: [
    {
      id: 'mem_1',
      participant_id: 'participant_mary',
      person_name: 'Granddaughter Maya',
      place_name: 'Kaziranga Orchid Garden',
      object_name: 'Handcrafted Bamboo Tea Cup',
      memory_text: 'Maya held my hand as we walked through the orchid garden in bloom, sipping warm Assam tea from fresh bamboo cups.',
      photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      photo_alt: 'Grandmother and Maya smiling outdoors in a garden',
      is_approved: true,
      created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mem_2',
      participant_id: 'participant_mary',
      person_name: 'Brother Anand',
      place_name: 'Shillong Pine Forest Trail',
      object_name: 'Vintage Silver Pocket Watch',
      memory_text: 'Anand checked his silver pocket watch every morning while we enjoyed the fresh mountain breeze beneath the pine trees.',
      photo_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
      photo_alt: 'Pine hills with sunlight filtering through trees',
      is_approved: true,
      created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mem_3',
      participant_id: 'participant_mary',
      person_name: 'Daughter Priya',
      place_name: 'Majuli Island Courtyard',
      object_name: 'Handwoven Eri Silk Shawl',
      memory_text: 'Priya draped the warm golden silk shawl over my shoulders during the evening courtyard gathering by the river.',
      photo_url: 'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=600&auto=format&fit=crop&q=80',
      photo_alt: 'Traditional silk weaving and warm sunset courtyard',
      is_approved: true,
      created_at: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
    },
  ],
};

export const DEFAULT_CONSENT: PersonalMemoryConsent = {
  participant_id: 'participant_mary',
  has_consent: true,
  consent_given_by: 'Family Caregiver & Mary Vance',
  consent_date: '2026-08-15',
  notes: 'Explicit consent granted for private familiar memory recall exercises.',
};

/**
 * Get all personal memories for a given participant
 */
export function getParticipantMemories(participantId: string): PersonalMemory[] {
  try {
    const raw = localStorage.getItem(`${MEMORIES_STORAGE_KEY_PREFIX}${participantId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading personal memories from storage:', err);
  }

  // Return defaults if available for this participant or empty array
  return DEFAULT_PERSONAL_MEMORIES[participantId] ?? [];
}

/**
 * Save personal memories for a participant
 */
export function saveParticipantMemories(participantId: string, memories: PersonalMemory[]): void {
  try {
    localStorage.setItem(
      `${MEMORIES_STORAGE_KEY_PREFIX}${participantId}`,
      JSON.stringify(memories)
    );
  } catch (err) {
    console.error('Error saving personal memories:', err);
  }
}

/**
 * Get consent status for a participant
 */
export function getParticipantConsent(participantId: string): PersonalMemoryConsent {
  try {
    const raw = localStorage.getItem(`${CONSENT_STORAGE_KEY_PREFIX}${participantId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading consent status:', err);
  }

  if (participantId === 'participant_mary') {
    return DEFAULT_CONSENT;
  }

  return {
    participant_id: participantId,
    has_consent: false,
    consent_given_by: '',
    consent_date: '',
    notes: '',
  };
}

/**
 * Save consent status for a participant
 */
export function saveParticipantConsent(consent: PersonalMemoryConsent): void {
  try {
    localStorage.setItem(
      `${CONSENT_STORAGE_KEY_PREFIX}${consent.participant_id}`,
      JSON.stringify(consent)
    );
  } catch (err) {
    console.error('Error saving consent status:', err);
  }
}

/**
 * Helper to get only approved memories when consent is active
 */
export function getApprovedMemoriesForRecall(participantId: string): PersonalMemory[] {
  const consent = getParticipantConsent(participantId);
  if (!consent.has_consent) {
    return [];
  }
  const all = getParticipantMemories(participantId);
  return all.filter((m) => m.is_approved);
}

export interface MemoryRecallQuestion {
  id: string;
  memory: PersonalMemory;
  questionType: 'place' | 'person' | 'object';
  promptText: string;
  options: string[];
  correctIndex: number;
}

/**
 * Generates simple, encouraging recall questions from approved memories
 */
export function generateMemoryQuestions(memories: PersonalMemory[]): MemoryRecallQuestion[] {
  if (memories.length === 0) return [];

  const questions: MemoryRecallQuestion[] = [];

  // Pool of distractors
  const allPersons = Array.from(new Set(memories.map((m) => m.person_name)));
  const allPlaces = Array.from(new Set(memories.map((m) => m.place_name)));
  const allObjects = Array.from(new Set(memories.map((m) => m.object_name)));

  const fallbackPersons = ['Friend Gopal', 'Cousin Sunita', 'Uncle Dev'];
  const fallbackPlaces = ['Riverfront Park', 'Botanical Rose Garden', 'Old Town Marketplace'];
  const fallbackObjects = ['Brass Morning Bell', 'Carved Wooden Box', 'Warm Woolen Scarf'];

  memories.forEach((mem, index) => {
    // 1. Question: Place
    const placeDistractors = allPlaces
      .filter((p) => p !== mem.place_name)
      .concat(fallbackPlaces)
      .slice(0, 2);
    const placeOpts = shuffleArray([mem.place_name, ...placeDistractors]);
    questions.push({
      id: `q_place_${mem.id}_${index}`,
      memory: mem,
      questionType: 'place',
      promptText: 'Which place is associated with this memory?',
      options: placeOpts,
      correctIndex: placeOpts.indexOf(mem.place_name),
    });

    // 2. Question: Person
    const personDistractors = allPersons
      .filter((p) => p !== mem.person_name)
      .concat(fallbackPersons)
      .slice(0, 2);
    const personOpts = shuffleArray([mem.person_name, ...personDistractors]);
    questions.push({
      id: `q_person_${mem.id}_${index}`,
      memory: mem,
      questionType: 'person',
      promptText: 'Who is mentioned in this memory?',
      options: personOpts,
      correctIndex: personOpts.indexOf(mem.person_name),
    });

    // 3. Question: Object
    const objectDistractors = allObjects
      .filter((o) => o !== mem.object_name)
      .concat(fallbackObjects)
      .slice(0, 2);
    const objectOpts = shuffleArray([mem.object_name, ...objectDistractors]);
    questions.push({
      id: `q_object_${mem.id}_${index}`,
      memory: mem,
      questionType: 'object',
      promptText: 'Which object was associated with this memory?',
      options: objectOpts,
      correctIndex: objectOpts.indexOf(mem.object_name),
    });
  });

  return shuffleArray(questions);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
