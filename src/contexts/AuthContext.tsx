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
  orgLoading: boolean;
  orgId: string | null;
  orgRole: string | null;
  orgName: string | null;
  onboardingComplete: boolean | null;
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
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgId, setOrgIdState] = useState<string | null>(getCurrentOrgId());
  const [orgRole, setOrgRoleState] = useState<string | null>(getCurrentOrgRole());
  const [orgName, setOrgNameState] = useState<string | null>(getCurrentOrgName());
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  /**
   * Look up the user's org membership from the backend API.
   * The API validates the JWT and returns org details from the database.
   */
  const lookupOrg = async (userId: string, accessToken?: string) => {
    try {
      console.log('[Auth] Looking up org for user:', userId);

      let organizationId: string | null = null;
      let organizationName = 'My Organization';
      let role = 'employee';
      let onboardingDone = false;

      // Try backend API first if we have a token
      if (accessToken) {
        const response = await fetch('/api/auth/lookup-org', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            organizationId = result.data.organizationId;
            organizationName = result.data.organizationName || 'My Organization';
            role = result.data.role || 'employee';
            onboardingDone = result.data.onboardingComplete ?? false;
          }
        } else {
          console.warn('[Auth] API lookup-org failed, falling back to direct Supabase query');
        }
      }

      // Fallback: query Supabase directly (used when API fails or no token)
      if (!organizationId) {
        const { data } = await supabase
          .from('users')
          .select('organization_id, role, organizations(id, name, onboarding_complete)')
          .eq('id', userId)
          .maybeSingle();

        if (data?.organization_id) {
          organizationId = data.organization_id;
          role = data.role || 'employee';
          organizationName = (data as any).organizations?.name || 'My Organization';
          onboardingDone = (data as any).organizations?.onboarding_complete ?? false;
        }
      }

      if (!organizationId) {
        console.warn('[Auth] No org found for user:', userId);
        return;
      }

      setCurrentOrgId(organizationId);
      setCurrentOrgRole(role);
      setCurrentOrgName(organizationName);
      setOrgIdState(organizationId);
      setOrgRoleState(role);
      setOrgNameState(organizationName);
      setOnboardingComplete(onboardingDone);

      console.log(`[Auth] Org resolved: ${organizationName} (${organizationId})`);
    } catch (err) {
      console.warn('[Auth] lookupOrg error:', err instanceof Error ? err.message : err);
    }
  };

  /**
   * Syncs the Google Auth user to public.users table
   * NOTE: The Supabase auth trigger automatically creates the user with a default organization
   * This function just logs the result for debugging
   */
  const saveGoogleUserEmail = async (userEmail: string, userId: string, fullName?: string) => {
    try {
      console.log('[Auth] Google user created by database trigger:',  { userId, userEmail, fullName });
      console.log('[Auth] Organization auto-created by trigger');
      return true;
    } catch (err: any) {
      console.error('[Auth] ❌ Error in saveGoogleUserEmail:', err.message);
      return false;
    }
  };

  const refreshOrg = async () => {
    if (user?.id && session?.access_token) {
      await lookupOrg(user.id, session.access_token);
    }
  };

  useEffect(() => {
    let initialDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State changed:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (!initialDone) {
          initialDone = true;
          setLoading(false);
        }

        if (event === 'SIGNED_IN' && session?.user) {
          const userId = session.user.id;
          const userEmail = session.user.email!;
          const fullName = session.user.user_metadata?.full_name;
          const accessToken = session.access_token;
          const isGoogleAuth = session.user.app_metadata?.provider === 'google';

          // Use setTimeout to move async DB work outside the synchronous auth callback
          setOrgLoading(true);
          setTimeout(async () => {
            try {
              if (isGoogleAuth) {
                await saveGoogleUserEmail(userEmail, userId, fullName);
              }
              await lookupOrg(userId, accessToken);
            } catch (err) {
              console.warn('[Auth] Background sync failed:', err);
            } finally {
              setOrgLoading(false);
            }
          }, 0);
        }

        if (event === 'INITIAL_SESSION' && session?.user && !getCurrentOrgId()) {
          setOrgLoading(true);
          setTimeout(async () => {
            try {
              await lookupOrg(session.user.id, session.access_token);
            } catch (err) {
              console.warn('[Auth] Background org lookup failed:', err);
            } finally {
              setOrgLoading(false);
            }
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          clearCurrentOrg();
          setOrgIdState(null);
          setOrgRoleState(null);
          setOrgNameState(null);
          setOnboardingComplete(null);
        }

        setLoading(false);
      }
    );

    const safetyTimeout = setTimeout(() => {
      if (!initialDone) {
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
    });
    if (error) throw error;
    if (data?.user?.identities?.length === 0) {
      throw new Error('An account with this email already exists.');
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
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('[OAuth] 1. Starting Google OAuth flow');
      console.log('[OAuth] 2. Redirect URL:', redirectUrl);
      console.log('[OAuth] 3. Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[OAuth] Error during signInWithOAuth:', {
          code: error.status,
          message: error.message,
          cause: (error as any).cause,
          details: error
        });
        throw error;
      }

      console.log('[OAuth] 4. OAuth call successful, redirecting to:', data?.url);
      console.log('[OAuth] 5. User should be redirected now...');
    } catch (err: any) {
      console.error('[OAuth] CRITICAL ERROR in signInWithGoogle:', {
        message: err.message,
        status: err.status,
        details: err,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  };

  const signInWithJira = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jiraLoginInitiated', 'true');
    }
    const userId = user?.id;
    const qs = userId ? `?supabaseUserId=${encodeURIComponent(userId)}` : '';
    window.location.href = `${window.location.origin}/api/jira/auth/connect${qs}`;
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

  const value = useMemo(() => ({
    user,
    session,
    loading,
    orgLoading,
    orgId,
    orgRole,
    orgName,
    onboardingComplete,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithJira,
    signOut,
    resetPassword,
    updatePassword,
    refreshOrg,
  }), [user, session, loading, orgLoading, orgId, orgRole, orgName, onboardingComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};