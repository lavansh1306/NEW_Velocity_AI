import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  setCurrentOrgId,
  setCurrentOrgRole,
  setCurrentOrgName,
  clearCurrentOrg,
  getCurrentOrgId,
  getCurrentOrgRole,
  getCurrentOrgName,
} from '@/lib/orgContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  orgId: string | null;
  orgRole: string | null;
  orgName: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithJira: () => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgIdState] = useState<string | null>(getCurrentOrgId());
  const [orgRole, setOrgRoleState] = useState<string | null>(getCurrentOrgRole());
  const [orgName, setOrgNameState] = useState<string | null>(getCurrentOrgName());

  // Look up the user's org membership from Supabase
  const lookupOrg = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('org_id, role, organizations(name)')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error || !data) {
        console.log('[Auth] No org membership found for user', userId);
        return;
      }

      const name = (data as any).organizations?.name || '';
      setCurrentOrgId(data.org_id);
      setCurrentOrgRole(data.role);
      setCurrentOrgName(name);
      setOrgIdState(data.org_id);
      setOrgRoleState(data.role);
      setOrgNameState(name);
      console.log(`[Auth] Org resolved: ${name} (${data.org_id}), role=${data.role}`);
    } catch (err) {
      console.warn('[Auth] lookupOrg error:', err);
    }
  };

  /** Re-fetch org membership (e.g. after Jira connect completes) */
  const refreshOrg = async () => {
    if (user?.id) await lookupOrg(user.id);
  };

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
        // Hydrate org context if we have a session and orgId isn't already set
        if (session?.user?.id && !getCurrentOrgId()) {
          await lookupOrg(session.user.id);
        }
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
          // Look up org membership
          await lookupOrg(session.user.id);
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
    const redirectUrl = import.meta.env.DEV
      ? `${window.location.origin}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;

    // Log for debugging email delivery issues
    console.log('[Auth] Sign-up response:', {
      userId: data?.user?.id,
      emailConfirmedAt: data?.user?.email_confirmed_at,
      identities: data?.user?.identities?.length,
    });

    // If user already exists (identities is empty), throw a helpful error
    if (data?.user?.identities?.length === 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
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
    // Pass supabaseUserId so the backend can create/link the org
    console.log('[OAuth] Signing in with Jira');
    const userId = user?.id;
    const qs = userId ? `?supabaseUserId=${encodeURIComponent(userId)}` : '';
    window.location.href = `${window.location.origin}/api/jira/auth/connect${qs}`;
  };

  const signOut = async () => {
    clearCurrentOrg();
    setOrgIdState(null);
    setOrgRoleState(null);
    setOrgNameState(null);
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
    orgId,
    orgRole,
    orgName,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithJira,
    signOut,
    resetPassword,
    updatePassword,
    refreshOrg,
  }), [user, session, loading, orgId, orgRole, orgName]);

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
