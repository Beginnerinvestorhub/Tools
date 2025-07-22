/**
 * Authentication Store
 * Comprehensive authentication state management with Firebase integration
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  AuthState, 
  AuthActions, 
  AuthUser, 
  UserPreferences 
} from './types';
import { 
  createAsyncAction, 
  createErrorHandler, 
  immerSet,
  createPersistConfig,
  validateEmail,
  validatePassword,
  createNotification
} from './utils';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionExpiry: null,
};

const initialPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    marketing: false,
  },
  privacy: {
    profileVisibility: 'public',
    dataSharing: false,
  },
  trading: {
    riskTolerance: 'moderate',
    investmentGoals: [],
    experienceLevel: 'beginner',
  },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const authApi = {
  async fetchUserProfile(uid: string): Promise<Partial<AuthUser>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  },

  async updateUserProfile(updates: Partial<AuthUser>): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
  },

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user preferences');
    }
  },
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // AUTHENTICATION ACTIONS
        // ========================================================================

        login: createAsyncAction(
          'login',
          async (email: string, password: string) => {
            // Validate inputs
            if (!validateEmail(email)) {
              throw new Error('Please enter a valid email address');
            }

            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
              throw new Error(passwordValidation.errors[0]);
            }

            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Get ID token and user claims
            const idTokenResult = await firebaseUser.getIdTokenResult();
            const role = (idTokenResult.claims.role as string) || 'user';

            // Fetch additional user data from backend
            const profileData = await authApi.fetchUserProfile(firebaseUser.uid);

            // Create AuthUser object
            const authUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              role: role as AuthUser['role'],
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              lastLoginAt: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
              preferences: profileData.preferences || initialPreferences,
              ...profileData,
            };

            // Update store state
            set(immerSet<AuthState & AuthActions>((draft) => {
              draft.user = authUser;
              draft.firebaseUser = firebaseUser;
              draft.isAuthenticated = true;
              draft.isLoading = false;
              draft.error = null;
              draft.sessionExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
            }));

            return authUser;
          },
          {
            onStart: () => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.isLoading = true;
              draft.error = null;
            })),
            onError: (error) => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.isLoading = false;
              draft.error = createErrorHandler('Login')(error);
            })),
          }
        ),

        register: createAsyncAction(
          'register',
          async (email: string, password: string, userData: Partial<AuthUser>) => {
            // Validate inputs
            if (!validateEmail(email)) {
              throw new Error('Please enter a valid email address');
            }

            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
              throw new Error(passwordValidation.errors.join(', '));
            }

            // Create user with Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Update Firebase profile
            await updateProfile(firebaseUser, {
              displayName: userData.displayName || `${userData.email?.split('@')[0]}`,
            });

            // Send email verification
            await sendEmailVerification(firebaseUser);

            // Create user profile in backend
            const authUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              role: 'user',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              preferences: initialPreferences,
              ...userData,
            };

            await authApi.updateUserProfile(authUser);

            // Update store state
            set(immerSet<AuthState & AuthActions>((draft) => {
              draft.user = authUser;
              draft.firebaseUser = firebaseUser;
              draft.isAuthenticated = true;
              draft.isLoading = false;
              draft.error = null;
              draft.sessionExpiry = Date.now() + (60 * 60 * 1000);
            }));

            return authUser;
          },
          {
            onStart: () => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.isLoading = true;
              draft.error = null;
            })),
            onError: (error) => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.isLoading = false;
              draft.error = createErrorHandler('Registration')(error);
            })),
          }
        ),

        logout: createAsyncAction(
          'logout',
          async () => {
            await signOut(auth);
            
            // Clear store state
            set(immerSet<AuthState & AuthActions>((draft) => {
              draft.user = null;
              draft.firebaseUser = null;
              draft.isAuthenticated = false;
              draft.isLoading = false;
              draft.error = null;
              draft.sessionExpiry = null;
            }));
          },
          {
            onStart: () => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.isLoading = true;
            })),
            onError: (error) => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.isLoading = false;
              draft.error = createErrorHandler('Logout')(error);
            })),
          }
        ),

        // ========================================================================
        // PROFILE MANAGEMENT
        // ========================================================================

        updateProfile: createAsyncAction(
          'updateProfile',
          async (updates: Partial<AuthUser>) => {
            const currentUser = get().user;
            if (!currentUser) {
              throw new Error('No authenticated user');
            }

            // Update Firebase profile if display name or photo changed
            if (updates.displayName !== undefined || updates.photoURL !== undefined) {
              await updateProfile(auth.currentUser!, {
                displayName: updates.displayName || currentUser.displayName,
                photoURL: updates.photoURL || currentUser.photoURL,
              });
            }

            // Update backend profile
            await authApi.updateUserProfile(updates);

            // Update store state
            set(immerSet<AuthState & AuthActions>((draft) => {
              if (draft.user) {
                Object.assign(draft.user, updates);
              }
            }));
          },
          {
            onError: (error) => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.error = createErrorHandler('Profile Update')(error);
            })),
          }
        ),

        updatePreferences: createAsyncAction(
          'updatePreferences',
          async (preferences: Partial<UserPreferences>) => {
            const currentUser = get().user;
            if (!currentUser) {
              throw new Error('No authenticated user');
            }

            // Update backend preferences
            await authApi.updateUserPreferences(preferences);

            // Update store state
            set(immerSet<AuthState & AuthActions>((draft) => {
              if (draft.user) {
                draft.user.preferences = {
                  ...draft.user.preferences,
                  ...preferences,
                };
              }
            }));
          },
          {
            onError: (error) => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.error = createErrorHandler('Preferences Update')(error);
            })),
          }
        ),

        // ========================================================================
        // TOKEN MANAGEMENT
        // ========================================================================

        refreshToken: createAsyncAction(
          'refreshToken',
          async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
              throw new Error('No authenticated user');
            }

            // Force token refresh
            await currentUser.getIdToken(true);

            // Update session expiry
            set(immerSet<AuthState & AuthActions>((draft) => {
              draft.sessionExpiry = Date.now() + (60 * 60 * 1000);
            }));
          },
          {
            onError: (error) => set(immerSet<AuthState & AuthActions>((draft) => {
              draft.error = createErrorHandler('Token Refresh')(error);
            })),
          }
        ),

        // ========================================================================
        // UTILITY ACTIONS
        // ========================================================================

        clearError: () => set(immerSet<AuthState & AuthActions>((draft) => {
          draft.error = null;
        })),

        setLoading: (loading: boolean) => set(immerSet<AuthState & AuthActions>((draft) => {
          draft.isLoading = loading;
        })),
      }),
      createPersistConfig('auth-store', 1)
    ),
    { name: 'auth-store' }
  )
);

// ============================================================================
// FIREBASE AUTH STATE LISTENER
// ============================================================================

// Initialize Firebase auth state listener
let unsubscribe: (() => void) | null = null;

export const initializeAuthListener = () => {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    const { user, setLoading } = useAuthStore.getState();

    if (firebaseUser) {
      // User is signed in
      if (!user || user.uid !== firebaseUser.uid) {
        setLoading(true);
        
        try {
          // Get user claims and profile data
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = (idTokenResult.claims.role as string) || 'user';
          const profileData = await authApi.fetchUserProfile(firebaseUser.uid);

          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: role as AuthUser['role'],
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            lastLoginAt: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
            preferences: profileData.preferences || initialPreferences,
            ...profileData,
          };

          useAuthStore.setState({
            user: authUser,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionExpiry: Date.now() + (60 * 60 * 1000),
          });
        } catch (error) {
          console.error('Failed to initialize user session:', error);
          useAuthStore.setState({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: createErrorHandler('Session Initialization')(error),
            sessionExpiry: null,
          });
        }
      }
    } else {
      // User is signed out
      useAuthStore.setState({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionExpiry: null,
      });
    }
  });
};

// ============================================================================
// SELECTORS
// ============================================================================

export const authSelectors = {
  user: (state: AuthState & AuthActions) => state.user,
  isAuthenticated: (state: AuthState & AuthActions) => state.isAuthenticated,
  isLoading: (state: AuthState & AuthActions) => state.isLoading,
  error: (state: AuthState & AuthActions) => state.error,
  preferences: (state: AuthState & AuthActions) => state.user?.preferences,
  role: (state: AuthState & AuthActions) => state.user?.role,
  isAdmin: (state: AuthState & AuthActions) => state.user?.role === 'admin',
  isPremium: (state: AuthState & AuthActions) => state.user?.role === 'premium',
  isEmailVerified: (state: AuthState & AuthActions) => state.user?.emailVerified || false,
  sessionExpiry: (state: AuthState & AuthActions) => state.sessionExpiry,
  isSessionExpired: (state: AuthState & AuthActions) => {
    return state.sessionExpiry ? Date.now() > state.sessionExpiry : false;
  },
};

// ============================================================================
// HOOKS
// ============================================================================

export const useAuth = () => useAuthStore();
export const useAuthUser = () => useAuthStore(authSelectors.user);
export const useAuthLoading = () => useAuthStore(authSelectors.isLoading);
export const useAuthError = () => useAuthStore(authSelectors.error);
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated);
export const useUserPreferences = () => useAuthStore(authSelectors.preferences);
export const useUserRole = () => useAuthStore(authSelectors.role);
export const useIsAdmin = () => useAuthStore(authSelectors.isAdmin);
export const useIsPremium = () => useAuthStore(authSelectors.isPremium);
