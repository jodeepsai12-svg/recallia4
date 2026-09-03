import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type User as FirebaseUser,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  fetchUserProfile,
  saveUserProfile,
  updateCaregiverDetails,
} from '@/lib/firebaseService';
import type { UserProfile, CaregiverInfo } from '@/types';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{
    error: string | null;
    user?: FirebaseUser;
    isUnauthorizedDomain?: boolean;
    unauthorizedHost?: string;
  }>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  sendPhoneOtp: (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ) => Promise<{ confirmationResult?: ConfirmationResult; error: string | null }>;
  verifyPhoneOtp: (
    confirmationResult: ConfirmationResult,
    otpCode: string
  ) => Promise<{ error: string | null; user?: FirebaseUser }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signInWithDemo: (role?: 'patient' | 'caregiver') => Promise<{ error: string | null }>;
  startOfflineGuestSession: (customName?: string) => Promise<void>;
  isOffline: boolean;
  signOut: () => Promise<void>;
  updateCaregiver: (caregiverInfo: CaregiverInfo) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const LOCAL_SESSION_KEY = 'recallia_auth_session';

function createSyntheticFirebaseUser(opts: {
  uid: string;
  email: string;
  displayName: string;
}): FirebaseUser {
  return {
    uid: opts.uid,
    email: opts.email,
    displayName: opts.displayName,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
    tenantId: null,
    metadata: {
      creationTime: new Date().toUTCString(),
      lastSignInTime: new Date().toUTCString(),
    },
    providerData: [
      {
        uid: opts.uid,
        displayName: opts.displayName,
        email: opts.email,
        phoneNumber: null,
        photoURL: null,
        providerId: 'password',
      },
    ],
    refreshToken: '',
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({
      token: 'mock-token',
      authTime: new Date().toUTCString(),
      issuedAtTime: new Date().toUTCString(),
      expirationTime: new Date(Date.now() + 86400000).toUTCString(),
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({ uid: opts.uid, email: opts.email }),
  } as unknown as FirebaseUser;
}

function saveLocalSession(u: FirebaseUser, p: UserProfile) {
  try {
    localStorage.setItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || p.name,
        profile: p,
      })
    );
  } catch {
    // ignore
  }
}

function getLocalSession(): { user: FirebaseUser; profile: UserProfile } | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.uid) return null;
    const user = createSyntheticFirebaseUser({
      uid: data.uid,
      email: data.email || '',
      displayName: data.displayName || 'User',
    });
    return { user, profile: data.profile };
  } catch {
    return null;
  }
}

function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Sync user profile from Firestore
  const syncProfile = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }

    try {
      const existing = await fetchUserProfile(firebaseUser.uid);
      if (existing) {
        setProfile(existing);
      } else {
        // Create initial profile for new user
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber,
          photoURL: firebaseUser.photoURL,
          authProvider: firebaseUser.providerData[0]?.providerId === 'google.com'
            ? 'google'
            : firebaseUser.phoneNumber
            ? 'phone'
            : 'password',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          caregiver: {
            name: 'Primary Caregiver',
            phoneNumber: '+919876543210',
            relationship: 'Family Member',
            updatedAt: new Date().toISOString(),
          },
          emergencyContact: {
            name: 'Primary Caregiver',
            phoneNumber: '+919876543210',
            relationship: 'Family Member',
          },
        };

        await saveUserProfile(newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.warn('Error during profile sync:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      if (currentUser) {
        setUser(currentUser);
        await syncProfile(currentUser);
      } else {
        const local = getLocalSession();
        if (local) {
          setUser(local.user);
          setProfile(local.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  // Google Authentication
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncProfile(result.user);
      return { error: null, user: result.user };
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code || '';
      const errorMessage = (err as Error)?.message || '';
      
      if (
        errorCode === 'auth/unauthorized-domain' ||
        errorMessage.includes('auth/unauthorized-domain') ||
        errorMessage.includes('unauthorized-domain')
      ) {
        console.warn('Google Sign In - domain authorization required in Firebase Console:', err);
        const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        return {
          error: `Google Sign-In is not allowed for this domain (auth/unauthorized-domain). Please add "${host}" to Authorized domains in Firebase Console.`,
          isUnauthorizedDomain: true,
          unauthorizedHost: host,
        };
      }
      console.error('Google Sign In Error:', err);
      if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('popup-closed-by-user')) {
        return { error: 'Sign-in window was closed before completion. Please try again.' };
      }
      if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        return { error: 'Sign-in popup was blocked by your browser. Please allow popups for this site.' };
      }
      if (errorCode === 'auth/cancelled-popup-request' || errorMessage.includes('cancelled-popup-request')) {
        return { error: 'Popup request was cancelled. Please try again.' };
      }
      return { error: errorMessage || 'Google authentication failed.' };
    }
  };

  // Setup reCAPTCHA for Web Phone Authentication
  const setupRecaptcha = (containerId: string) => {
    if (typeof window === 'undefined') {
      return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    }

    const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };

    // If an active verifier already exists, reuse it
    if (win.recaptchaVerifier) {
      try {
        return win.recaptchaVerifier;
      } catch {
        // Fall through to recreate
      }
    }

    // Clean container element DOM to avoid 'reCAPTCHA has already been rendered in this element'
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    try {
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, clearing verifier.');
          if (win.recaptchaVerifier) {
            try {
              win.recaptchaVerifier.clear();
            } catch {
              // ignore
            }
            delete win.recaptchaVerifier;
          }
        },
      });

      win.recaptchaVerifier = verifier;
      return verifier;
    } catch (err) {
      console.warn('RecaptchaVerifier creation warning, resetting container:', err);
      if (container) {
        container.innerHTML = '';
      }
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
      win.recaptchaVerifier = verifier;
      return verifier;
    }
  };

  // Send Phone SMS OTP
  const sendPhoneOtp = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      // Ensure phone format contains country code
      let formatted = phoneNumber.trim().replace(/[\s()-]/g, '');
      if (!formatted.startsWith('+')) {
        formatted = `+91${formatted.replace(/^0+/, '')}`;
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formatted, appVerifier);
      return { confirmationResult, error: null };
    } catch (err) {
      console.error('Phone OTP Send Error:', err);
      let message = 'Failed to send SMS OTP. Please check the phone number format.';
      if (err instanceof Error) {
        const errorText = err.message || '';
        if (
          errorText.includes('operation-not-allowed') ||
          (err as unknown as { code?: string }).code === 'auth/operation-not-allowed'
        ) {
          message =
            'Phone (SMS) authentication is not enabled for this Firebase project. To enable it, go to Firebase Console > Authentication > Sign-in method > Phone. You can also sign in right now with Google or Email & Password.';
        } else if (
          errorText.includes('invalid-phone-number') ||
          (err as unknown as { code?: string }).code === 'auth/invalid-phone-number'
        ) {
          message =
            'Invalid phone number. Please enter a valid number with country code (e.g. +1 555 123 4567 or +91 98765 43210).';
        } else if (
          errorText.includes('too-many-requests') ||
          (err as unknown as { code?: string }).code === 'auth/too-many-requests'
        ) {
          message = 'Too many requests. Please wait a few moments or sign in with Google / Email.';
        } else if (
          errorText.includes('quota-exceeded') ||
          (err as unknown as { code?: string }).code === 'auth/quota-exceeded'
        ) {
          message =
            'SMS quota exceeded for this Firebase project. Please sign in with Google or Email & Password.';
        } else if (errorText.includes('captcha') || errorText.includes('reCAPTCHA')) {
          message = 'reCAPTCHA verification issue. Please try again or sign in with Google / Email.';
        } else {
          message = errorText;
        }
      }
      return { error: message };
    }
  };

  // Verify Phone OTP
  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, otpCode: string) => {
    try {
      const result = await confirmationResult.confirm(otpCode.trim());
      await syncProfile(result.user);
      return { error: null, user: result.user };
    } catch (err) {
      console.error('OTP Verification Error:', err);
      return {
        error: err instanceof Error && err.message.includes('invalid-verification-code')
          ? 'Invalid or expired OTP code. Please check and try again.'
          : 'Failed to verify OTP. Please try again.',
      };
    }
  };

  // Fallback Login Handler (when Email/Password provider is disabled in Firebase Console)
  const fallbackLogin = async (email: string, name?: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim();
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'Friend';

    // 1. First attempt Firebase anonymous sign in to obtain a genuine Firebase Auth token
    try {
      const anonResult = await signInAnonymously(auth);
      if (anonResult?.user) {
        try {
          await updateProfile(anonResult.user, {
            displayName: cleanName,
          });
        } catch {
          // ignore
        }

        const newProfile: UserProfile = {
          uid: anonResult.user.uid,
          name: cleanName,
          email: cleanEmail,
          authProvider: 'password',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          caregiver: {
            name: 'Primary Caregiver',
            phoneNumber: '+919876543210',
            relationship: 'Family Member',
            updatedAt: new Date().toISOString(),
          },
          emergencyContact: {
            name: 'Primary Caregiver',
            phoneNumber: '+919876543210',
            relationship: 'Family Member',
          },
        };

        await saveUserProfile(newProfile);
        saveLocalSession(anonResult.user, newProfile);
        setProfile(newProfile);
        setUser(anonResult.user);
        return { error: null };
      }
    } catch (anonErr) {
      console.warn('Firebase Anonymous sign-in also restricted in console, switching to local authenticated session:', anonErr);
    }

    // 2. High-fidelity local session if both email/password and anonymous are disabled in console
    const hash = cleanEmail.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000, 0);
    const localUid = `user_local_${Math.abs(hash)}`;

    const localUser = createSyntheticFirebaseUser({
      uid: localUid,
      email: cleanEmail,
      displayName: cleanName,
    });

    const localProfile: UserProfile = {
      uid: localUid,
      name: cleanName,
      email: cleanEmail,
      authProvider: 'password',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caregiver: {
        name: 'Primary Caregiver',
        phoneNumber: '+919876543210',
        relationship: 'Family Member',
        updatedAt: new Date().toISOString(),
      },
      emergencyContact: {
        name: 'Primary Caregiver',
        phoneNumber: '+919876543210',
        relationship: 'Family Member',
      },
    };

    saveLocalSession(localUser, localProfile);
    await saveUserProfile(localProfile);
    setUser(localUser);
    setProfile(localProfile);
    return { error: null };
  };

  // Instant Demo Sign-In
  const signInWithDemo = async (role: 'patient' | 'caregiver' = 'patient'): Promise<{ error: string | null }> => {
    if (role === 'caregiver') {
      const caregiverUid = 'caregiver_sarah';
      const demoUser = createSyntheticFirebaseUser({
        uid: caregiverUid,
        email: 'sarah.vance@example.com',
        displayName: 'Sarah Vance',
      });
      const demoProfile: UserProfile = {
        uid: caregiverUid,
        name: 'Sarah Vance',
        email: 'sarah.vance@example.com',
        phone: '+91 98765 43210',
        role: 'caregiver',
        authProvider: 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedPatientUids: ['participant_mary'],
      };
      saveLocalSession(demoUser, demoProfile);
      await saveUserProfile(demoProfile);
      setUser(demoUser);
      setProfile(demoProfile);
      return { error: null };
    }

    // Default senior profile (Mary Vance)
    const patientUid = 'participant_mary';
    const demoUser = createSyntheticFirebaseUser({
      uid: patientUid,
      email: 'mary.vance@example.com',
      displayName: 'Mary Vance',
    });
    const demoProfile: UserProfile = {
      uid: patientUid,
      name: 'Mary Vance',
      email: 'mary.vance@example.com',
      phone: '+91 98765 43210',
      role: 'patient',
      authProvider: 'password',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caregiver: {
        name: 'Sarah Vance',
        phoneNumber: '+91 98765 43210',
        relationship: 'Daughter',
        updatedAt: new Date().toISOString(),
      },
      emergencyContact: {
        name: 'Sarah Vance',
        phoneNumber: '+91 98765 43210',
        relationship: 'Daughter',
      },
    };
    saveLocalSession(demoUser, demoProfile);
    await saveUserProfile(demoProfile);
    setUser(demoUser);
    setProfile(demoProfile);
    return { error: null };
  };

  // Immediate Offline Guest Session (Single Tap, No Credentials Needed)
  const startOfflineGuestSession = async (customName?: string): Promise<void> => {
    const patientUid = 'participant_mary';
    const cleanName = customName?.trim() || 'Mary Vance';
    const guestUser = createSyntheticFirebaseUser({
      uid: patientUid,
      email: 'mary.vance@example.com',
      displayName: cleanName,
    });
    const guestProfile: UserProfile = {
      uid: patientUid,
      name: cleanName,
      email: 'mary.vance@example.com',
      phone: '+91 98765 43210',
      role: 'patient',
      authProvider: 'password',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caregiver: {
        name: 'Sarah Vance',
        phoneNumber: '+91 98765 43210',
        relationship: 'Daughter',
      },
      emergencyContact: {
        name: 'Sarah Vance',
        phoneNumber: '+91 98765 43210',
        relationship: 'Daughter',
      },
    };
    saveLocalSession(guestUser, guestProfile);
    await saveUserProfile(guestProfile);
    setUser(guestUser);
    setProfile(guestProfile);
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      clearLocalSession();
      await syncProfile(result.user);
      return { error: null };
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code || '';
      const errorMessage = (err as Error)?.message || '';

      // If Email/Password provider is disabled or device is offline, activate seamless fallback
      if (
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/network-request-failed' ||
        !navigator.onLine ||
        errorMessage.includes('auth/operation-not-allowed') ||
        errorMessage.includes('network-request-failed') ||
        errorMessage.includes('operation-not-allowed')
      ) {
        console.warn('Firebase network unavailable or provider disabled. Activating seamless local/offline session...');
        return await fallbackLogin(email);
      }

      console.error('Email Sign In Error:', err);
      let msg = 'Authentication failed. Please check your credentials.';
      if (err instanceof Error) {
        if (err.message.includes('user-not-found') || err.message.includes('wrong-password') || err.message.includes('invalid-credential')) {
          msg = 'Invalid email or password.';
        } else if (err.message.includes('invalid-email')) {
          msg = 'Please enter a valid email address.';
        } else {
          msg = err.message;
        }
      }
      return { error: msg };
    }
  };

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      clearLocalSession();
      const newProfile: UserProfile = {
        uid: result.user.uid,
        name: name?.trim() || email.split('@')[0],
        email: result.user.email,
        authProvider: 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        caregiver: {
          name: 'Primary Caregiver',
          phoneNumber: '+919876543210',
          relationship: 'Family Member',
          updatedAt: new Date().toISOString(),
        },
        emergencyContact: {
          name: 'Primary Caregiver',
          phoneNumber: '+919876543210',
          relationship: 'Family Member',
        },
      };
      await saveUserProfile(newProfile);
      setProfile(newProfile);
      return { error: null };
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code || '';
      const errorMessage = (err as Error)?.message || '';

      // If Email/Password provider is disabled or device is offline, activate seamless fallback
      if (
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/network-request-failed' ||
        !navigator.onLine ||
        errorMessage.includes('auth/operation-not-allowed') ||
        errorMessage.includes('network-request-failed') ||
        errorMessage.includes('operation-not-allowed')
      ) {
        console.warn('Firebase network unavailable or provider disabled. Activating seamless local/offline session...');
        return await fallbackLogin(email, name);
      }

      console.error('Sign Up Error:', err);
      let msg = 'Registration failed.';
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          msg = 'An account with this email already exists. Please sign in instead.';
        } else if (err.message.includes('weak-password')) {
          msg = 'Password should be at least 6 characters.';
        } else {
          msg = err.message;
        }
      }
      return { error: msg };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      clearLocalSession();
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      clearLocalSession();
      setUser(null);
      setProfile(null);
    }
  };

  // Update Caregiver
  const updateCaregiver = async (caregiverInfo: CaregiverInfo) => {
    if (!user) return;
    await updateCaregiverDetails(user.uid, caregiverInfo);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userProfile: profile,
        loading,
        signInWithGoogle,
        setupRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        signIn,
        signUp,
        signInWithDemo,
        startOfflineGuestSession,
        isOffline,
        signOut,
        updateCaregiver,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
