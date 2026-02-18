import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithJira: () => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Save Google user email to database
  const saveGoogleUserEmail = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('oauth_users')
        .insert([{
          email: userEmail.toLowerCase().trim(),
          provider: 'google',
          authenticated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        // Check if it's a duplicate email error (that's fine, user already saved)
        if (error.code === '23505' || error.message?.includes('unique')) {
          console.log('[OAuth Email] User already in database');
          return true;
        }
        console.error('[OAuth Email] Error saving email:', error);
        return false;
      }
      console.log('[OAuth Email] Email saved successfully:', data);
      return true;
    } catch (err) {
      console.error('[OAuth Email] Unexpected error:', err);
      return false;
    }
  };

  useEffect(() => {
    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
        console.log('[Auth] Session check:', session ? 'User authenticated' : 'No session');
      } catch (error) {
        console.error('[Auth] Error checking session:', error instanceof Error ? error.message : error);
        // Even if auth check fails, allow access (user might be Jira-authenticated)
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes (including OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event, session ? 'authenticated' : 'not authenticated');
        
        // Important: Set session and user state immediately when auth state changes
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user just authenticated via Google, save their email
        if (event === 'SIGNED_IN' && session?.user?.email) {
          // Check if this is a Google OAuth login (app_metadata.provider is set by Supabase)
          const isGoogleAuth = session?.user?.app_metadata?.provider === 'google';
          if (isGoogleAuth) {
            console.log('[Auth] Saving Google user email:', session.user.email);
            await saveGoogleUserEmail(session.user.email);
          }
        }
        
        // Ensure loading is false after auth state change
        setLoading(false);
        
        // When user authenticates via OAuth, they'll be on the redirect page
        // Just update state - ProtectedRoute will handle navigation
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    // Use environment-specific redirect URL
    // This is the URL users will be redirected to after authenticating with Google
    // IMPORTANT: This must match the URL configured in Google OAuth Console and Supabase
    let redirectUrl: string;
    
    if (import.meta.env.DEV) {
      redirectUrl = `${window.location.origin}/auth/callback`;
    } else {
      // In production, use the actual domain from window.location.origin
      // This ensures it works regardless of the deployment domain
      redirectUrl = window.location.origin + '/auth/callback';
    }

    console.log('[OAuth] Signing in with Google, redirect to:', redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // CRITICAL: This redirectTo must match Google Console AND Supabase URL config
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error('[Google OAuth Error]', error);
      throw error;
    }
    // Note: This function will redirect the page to Google
    // The actual authentication happens after Google redirects back
  };

  const signInWithJira = () => {
    // Jira OAuth flow - redirects to backend which handles Atlassian OAuth
    // Backend will manage token storage and session
    console.log('[OAuth] Signing in with Jira');
    window.location.href = `${window.location.origin}/api/jira/auth/connect`;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithJira,
    signOut,
    resetPassword,
    updatePassword,
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
