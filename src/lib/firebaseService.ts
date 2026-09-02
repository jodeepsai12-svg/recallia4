import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type {
  UserProfile,
  CaregiverInfo,
  CaregiverLink,
  PersonalMemory,
  PersonalMemoryConsent,
  GameSession,
  EmergencyAlert,
} from '@/types';
import { DEFAULT_PERSONAL_MEMORIES } from '@/lib/memoriesService';

/**
 * Utility to strip undefined values from Firestore write payloads
 * to prevent 'Unsupported field value: undefined' errors.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned as T;
}

// ==========================================
// USER PROFILE MANAGEMENT
// ==========================================

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching user profile from Firestore:', error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    await setDoc(userDocRef, cleanFirestoreData({
      ...profile,
      email: profile.email || '',
      phone: profile.phone || '',
      photoURL: profile.photoURL || '',
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    throw error;
  }
}

export async function updateCaregiverDetails(uid: string, caregiver: CaregiverInfo): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const now = new Date().toISOString();
    await setDoc(userDocRef, cleanFirestoreData({
      caregiver: {
        name: caregiver.name || 'Caregiver',
        phoneNumber: caregiver.phoneNumber || '',
        relationship: caregiver.relationship || 'Family Member',
        linkingCode: caregiver.linkingCode || '',
        linkingCodeExpiresAt: caregiver.linkingCodeExpiresAt || '',
        caregiverUid: caregiver.caregiverUid || '',
        updatedAt: now,
      },
      emergencyContact: {
        name: caregiver.name || 'Caregiver',
        phoneNumber: caregiver.phoneNumber || '',
        relationship: caregiver.relationship || 'Family Member',
      },
      updatedAt: now,
    }), { merge: true });
  } catch (error) {
    console.error('Error updating caregiver details:', error);
    throw error;
  }
}

// ==========================================
// CAREGIVER LINKING SYSTEM
// ==========================================

export async function generateCaregiverLinkingCode(
  userUid: string,
  userName: string,
  caregiverPhone?: string
): Promise<string> {
  try {
    // Generate clean 6-digit uppercase alphanumeric token
    const safeName = (userName || 'User').trim();
    const prefix = safeName.slice(0, 2).toUpperCase() || 'RC';
    const digits = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${digits}-CARE`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days validity

    const linkData: CaregiverLink = {
      code,
      userUid,
      userName: safeName,
      caregiverPhone: caregiverPhone || '',
      createdAt: now.toISOString(),
      expiresAt,
      used: false,
    };

    // Save to caregiver_links collection safely with no undefined values
    await setDoc(doc(db, 'caregiver_links', code), cleanFirestoreData(linkData));

    // Also update user's profile with active linking code safely with merge
    const userDocRef = doc(db, 'users', userUid);
    await setDoc(userDocRef, cleanFirestoreData({
      caregiver: {
        linkingCode: code,
        linkingCodeExpiresAt: expiresAt,
      },
      updatedAt: now.toISOString(),
    }), { merge: true });

    return code;
  } catch (error) {
    console.error('Error generating caregiver linking code:', error);
    throw error;
  }
}

export async function verifyAndRedeemCaregiverCode(
  caregiverUid: string,
  caregiverName: string,
  rawCode: string
): Promise<{ success: boolean; error?: string; linkedUser?: UserProfile }> {
  try {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Please enter a valid linking code.' };
    }

    const linkDocRef = doc(db, 'caregiver_links', cleanCode);
    const snap = await getDoc(linkDocRef);

    if (!snap.exists()) {
      return { success: false, error: 'Invalid linking code. Please check the code provided by your family member.' };
    }

    const linkData = snap.data() as CaregiverLink;
    if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
      return { success: false, error: 'This linking code has expired. Please request a new one from your family member.' };
    }

    const userUid = linkData.userUid;
    const userDocRef = doc(db, 'users', userUid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'Linked user account not found.' };
    }

    const patientProfile = userSnap.data() as UserProfile;

    // Mark link as redeemed
    await updateDoc(linkDocRef, {
      used: true,
      usedByUid: caregiverUid,
      usedAt: new Date().toISOString(),
    });

    // Link caregiver to patient account
    await updateDoc(userDocRef, {
      'caregiver.caregiverUid': caregiverUid,
      linkedCaregiverUids: arrayUnion(caregiverUid),
      updatedAt: new Date().toISOString(),
    });

    // Link patient to caregiver's own profile
    const caregiverDocRef = doc(db, 'users', caregiverUid);
    await setDoc(caregiverDocRef, {
      uid: caregiverUid,
      role: 'caregiver',
      name: caregiverName || 'Caregiver',
      linkedPatientUids: arrayUnion(userUid),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return {
      success: true,
      linkedUser: {
        ...patientProfile,
        linkedCaregiverUids: [...(patientProfile.linkedCaregiverUids || []), caregiverUid],
      },
    };
  } catch (error) {
    console.error('Error redeeming caregiver linking code:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred during verification.' };
  }
}

export async function fetchLinkedPatientsForCaregiver(caregiverUid: string): Promise<UserProfile[]> {
  try {
    // 1. Check direct query on users where linkedCaregiverUids contains caregiverUid
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('linkedCaregiverUids', 'array-contains', caregiverUid));
    const querySnapshot = await getDocs(q);

    const patients: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      patients.push(docSnap.data() as UserProfile);
    });

    return patients;
  } catch (error) {
    console.warn('Error fetching linked patients for caregiver:', error);
    return [];
  }
}

// ==========================================
// MEMORIES & STORAGE
// ==========================================

export async function uploadMemoryPhoto(
  userId: string,
  file: File | Blob,
  customName?: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const fileName = customName ? `${timestamp}_${customName}` : `${timestamp}_${randomSuffix}.jpg`;
    const storagePath = `users/${userId}/photos/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading photo to Firebase Storage:', error);
    throw error;
  }
}

export async function fetchUserMemories(userId: string): Promise<PersonalMemory[]> {
  try {
    const memoriesRef = collection(db, 'users', userId, 'memories');
    const q = query(memoriesRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const list: PersonalMemory[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PersonalMemory);
      });
      return list;
    }

    // Return defaults if new user without memories yet
    return DEFAULT_PERSONAL_MEMORIES['participant_mary'] || [];
  } catch (error) {
    console.warn('Error fetching memories from Firestore:', error);
    return DEFAULT_PERSONAL_MEMORIES['participant_mary'] || [];
  }
}

export const fetchMemoriesForParticipant = fetchUserMemories;

export async function saveUserMemory(userId: string, memory: PersonalMemory): Promise<void> {
  try {
    const memoryDocRef = doc(db, 'users', userId, 'memories', memory.id);
    await setDoc(memoryDocRef, cleanFirestoreData({
      ...memory,
      participant_id: userId,
      updated_at: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    console.error('Error saving personal memory to Firestore:', error);
    throw error;
  }
}

export async function deleteUserMemory(userId: string, memoryId: string): Promise<void> {
  try {
    const memoryDocRef = doc(db, 'users', userId, 'memories', memoryId);
    await deleteDoc(memoryDocRef);
  } catch (error) {
    console.error('Error deleting memory from Firestore:', error);
    throw error;
  }
}

export async function fetchUserConsent(userId: string): Promise<PersonalMemoryConsent | null> {
  try {
    const consentDocRef = doc(db, 'users', userId, 'consent', 'settings');
    const snap = await getDoc(consentDocRef);
    if (snap.exists()) {
      return snap.data() as PersonalMemoryConsent;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching consent from Firestore:', error);
    return null;
  }
}

export async function saveUserConsent(userId: string, consent: PersonalMemoryConsent): Promise<void> {
  try {
    const consentDocRef = doc(db, 'users', userId, 'consent', 'settings');
    await setDoc(consentDocRef, cleanFirestoreData({
      ...consent,
      participant_id: userId,
    }), { merge: true });
  } catch (error) {
    console.error('Error saving consent to Firestore:', error);
    throw error;
  }
}

// ==========================================
// GAME SESSIONS & HISTORY
// ==========================================

export async function saveGameSession(session: GameSession): Promise<void> {
  try {
    const sessionId = session.id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionWithId = cleanFirestoreData({
      ...session,
      id: sessionId,
      created_at: session.created_at || new Date().toISOString(),
    });

    // Save in user subcollection
    if (session.user_id) {
      const userSessionRef = doc(db, 'users', session.user_id, 'game_sessions', sessionId);
      await setDoc(userSessionRef, sessionWithId);
    }

    // Save in root collection for caregiver reporting queries
    const rootSessionRef = doc(db, 'game_sessions', sessionId);
    await setDoc(rootSessionRef, sessionWithId);
  } catch (error) {
    console.warn('Error saving game session to Firestore:', error);
  }
}

export async function fetchGameSessions(userId: string): Promise<GameSession[]> {
  try {
    const sessionsRef = collection(db, 'users', userId, 'game_sessions');
    const q = query(sessionsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    const list: GameSession[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as GameSession);
    });
    return list;
  } catch (error) {
    console.warn('Error fetching game sessions from Firestore:', error);
    return [];
  }
}

// ==========================================
// EMERGENCY ALERTS (SOS)
// ==========================================

export async function createEmergencyAlert(
  alertData: Omit<EmergencyAlert, 'id' | 'created_at'>
): Promise<EmergencyAlert> {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newAlert: EmergencyAlert = {
    ...alertData,
    id: alertId,
    created_at: now,
  };

  try {
    // Write to Firestore emergency_alerts
    await setDoc(doc(db, 'emergency_alerts', alertId), cleanFirestoreData(newAlert));
  } catch (error) {
    console.warn('Error writing emergency alert to Firestore:', error);
  }

  return newAlert;
}

export async function fetchEmergencyAlerts(userId?: string): Promise<EmergencyAlert[]> {
  try {
    const alertsRef = collection(db, 'emergency_alerts');
    let q = query(alertsRef, orderBy('created_at', 'desc'));
    if (userId) {
      q = query(alertsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'));
    }
    const snap = await getDocs(q);
    const list: EmergencyAlert[] = [];
    snap.forEach((d) => list.push(d.data() as EmergencyAlert));
    return list;
  } catch (error) {
    console.warn('Error fetching emergency alerts from Firestore:', error);
    return [];
  }
}

export async function resolveEmergencyAlert(alertId: string, resolvedBy: string): Promise<void> {
  try {
    const alertRef = doc(db, 'emergency_alerts', alertId);
    await updateDoc(alertRef, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    });
  } catch (error) {
    console.error('Error resolving emergency alert:', error);
    throw error;
  }
}
