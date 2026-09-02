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
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: string | null; user?: FirebaseUser }>;
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
  signOut: () => Promise<void>;
  updateCaregiver: (caregiverInfo: CaregiverInfo) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await syncProfile(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
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
    } catch (err) {
      console.error('Google Sign In Error:', err);
      return { error: err instanceof Error ? err.message : 'Google authentication failed' };
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

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncProfile(result.user);
      return { error: null };
    } catch (err) {
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
    } catch (err) {
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
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
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
        loading,
        signInWithGoogle,
        setupRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        signIn,
        signUp,
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
