/**
 * Authentication Context Provider
 * 
 * Provides authentication state and methods throughout the application.
 * Handles user signup, signin, signout, and session management using AWS Cognito.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  getCurrentAuthenticatedUser, 
  signInUser, 
  signUpUser, 
  signOutUser, 
  resetUserPassword,
  getProfile,
  upsertProfile,
  configureAmplify,
  type UserProfile 
} from './aws';

// Initialize Amplify on module load
configureAmplify();

interface AuthUser {
  userId: string;
  username: string;
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await getProfile(userId);
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentAuthenticatedUser();
        
        if (user) {
          const authUser: AuthUser = {
            userId: user.userId,
            username: user.username,
          };
          
          const profile = await fetchProfile(user.userId);
          
          setState({
            user: authUser,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to initialize authentication' 
        }));
      }
    };

    initAuth();
  }, [fetchProfile]);

  // Sign up handler
  const handleSignUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await signUpUser(email, password, metadata);

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { error: null };
  }, []);

  // Sign in handler
  const handleSignIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await signInUser(email, password);

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    if (data) {
      // After successful sign-in, get the current user to get userId
      const currentUser = await getCurrentAuthenticatedUser();
      if (!currentUser) {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to get user info' }));
        return { error: new Error('Failed to get user info') };
      }
      
      const authUser: AuthUser = {
        userId: currentUser.userId,
        username: currentUser.username,
      };
      
      const profile = await fetchProfile(authUser.userId);
      
      setState({
        user: authUser,
        profile,
        loading: false,
        error: null,
      });
    }

    return { error: null };
  }, [fetchProfile]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await signOutUser();
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return;
    }

    setState({
      user: null,
      profile: null,
      loading: false,
      error: null,
    });
  }, []);

  // Reset password handler
  const handleResetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await resetUserPassword(email);

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { error: null };
  }, []);

  // Update profile handler
  const handleUpdateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { error: new Error('Not authenticated') };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await upsertProfile({
      id: state.user.userId,
      email: state.profile?.email || '',
      ...updates,
    });

    if (error) {
      const errorMsg = (error as Error).message || 'Failed to update profile';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { error };
    }

    setState(prev => ({ ...prev, profile: data, loading: false }));
    return { error: null };
  }, [state.user, state.profile]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Higher-order component to require authentication
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return <LoginForm />;
    }

    return <Component {...props} />;
  };
}

/**
 * Simple login form for protected routes
 */
function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [formError, setFormError] = useState('');
  
  const { signIn, signUp, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setFormError('Password must be at least 8 characters');
        return;
      }
      
      const result = await signUp(email, password, { full_name: fullName });
      if (!result.error) {
        alert('Account created! Please check your email to verify your account.');
      }
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            QuickCorpID - Hong Kong Business Identity
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || formError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {formError || error}
            </div>
          )}
          
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthContext;
