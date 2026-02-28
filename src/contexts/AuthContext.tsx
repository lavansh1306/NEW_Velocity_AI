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
    // Use onAuthStateChange as the SOLE session source.
    // Supabase v2 fires INITIAL_SESSION synchronously on subscribe,
    // so we never need a separate getSession() call (which can race & hang).
    let initialDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State changed:', event, session ? 'authenticated' : 'not authenticated');

        // Set session and user state immediately (synchronous — safe inside callback)
        setSession(session);
        setUser(session?.user ?? null);

        // On the very first callback, mark loading as done
        if (!initialDone) {
          initialDone = true;
          setLoading(false);
        }

        // IMPORTANT: Never await async DB operations inside onAuthStateChange.
        // Supabase v2 uses navigator.locks internally; awaiting here deadlocks
        // the lock and causes AbortError on subsequent DB queries.
        // Instead, defer async work outside the callback.
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const userId = session.user.id;
          const userEmail = session.user.email;
          const isGoogleAuth = session.user.app_metadata?.provider === 'google';

          setTimeout(async () => {
            try {
              if (isGoogleAuth) {
                console.log('[Auth] Saving Google user email:', userEmail);
                await saveGoogleUserEmail(userEmail);
              }
              // Look up org membership
              await lookupOrg(userId);
            } catch (err) {
              console.warn('[Auth] Deferred auth work failed:', err);
            }
          }, 0);
        }

        // Ensure loading is false after any auth state change
        setLoading(false);
      }
    );

    // Safety net: if onAuthStateChange never fires (e.g. no stored session), unblock loading
    const safetyTimeout = setTimeout(() => {
      if (!initialDone) {
        console.warn('[Auth] Safety timeout: no auth event after 4s, unblocking');
        initialDone = true;
        setLoading(false);
      }
    }, 4000);

    return () => {
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // No email verification — user is ready to go immediately
      },
    });
    if (error) throw error;

    console.log('[Auth] Sign-up response:', {
      userId: data?.user?.id,
      emailConfirmedAt: data?.user?.email_confirmed_at,
      identities: data?.user?.identities?.length,
      session: !!data?.session,
    });

    // If user already exists (identities is empty), throw a helpful error
    if (data?.user?.identities?.length === 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // When "Confirm email" is OFF in Supabase, signUp() already returns a session.
    // Only call signInWithPassword as a fallback if no session was returned.
    if (!data?.session) {
      console.log('[Auth] No session from signUp, attempting signInWithPassword...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        console.warn('[Auth] Auto sign-in after signup failed:', signInError.message);
      }
    } else {
      console.log('[Auth] Session created directly from signUp, skipping redundant signIn');
      // Manually update state since onAuthStateChange may lag
      setSession(data.session);
      setUser(data.session.user);
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
