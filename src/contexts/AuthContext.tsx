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

  /**
   * Look up the user's org membership from the 'users' table.
   * Based on your schema: users table has organization_id and links to organizations(name).
   */
  const lookupOrg = async (userId: string) => {
    try {
      console.log('[Auth] Looking up org for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('organization_id, role, organizations(name)')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] lookupOrg database error:', error.message);
        return;
      }

      if (!data || !data.organization_id) {
        console.log('[Auth] No organization_id found in users table for:', userId);
        return;
      }

      const name = (data as any).organizations?.name || 'My Organization';
      
      // Update local storage/context helpers
      setCurrentOrgId(data.organization_id);
      setCurrentOrgRole(data.role || 'employee');
      setCurrentOrgName(name);
      
      // Update state
      setOrgIdState(data.organization_id);
      setOrgRoleState(data.role || 'employee');
      setOrgNameState(name);
      
      console.log(`[Auth] Org resolved: ${name} (${data.organization_id})`);
    } catch (err) {
      console.warn('[Auth] lookupOrg unexpected error:', err);
    }
  };

  /**
   * Syncs the Google Auth user data into your 'public.users' table.
   * This prevents 404/406 errors by ensuring a record exists where the app expects it.
   */
  const saveGoogleUserEmail = async (userEmail: string, userId: string, fullName?: string) => {
    try {
      console.log('[Auth] Syncing Google user to public.users table...');
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: userEmail.toLowerCase().trim(),
          name: fullName || '',
          role: 'employee',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('[Auth Save] Error saving to users table:', error.message);
        return false;
      }
      
      console.log('[Auth Save] Success:', data);
      return true;
    } catch (err) {
      console.error('[Auth Save] Unexpected error:', err);
      return false;
    }
  };

  const refreshOrg = async () => {
    if (user?.id) await lookupOrg(user.id);
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
          const isGoogleAuth = session.user.app_metadata?.provider === 'google';

          // Use setTimeout to move async DB work outside the synchronous auth callback
          setTimeout(async () => {
            try {
              if (isGoogleAuth) {
                await saveGoogleUserEmail(userEmail, userId, fullName);
              }
              await lookupOrg(userId);
            } catch (err) {
              console.warn('[Auth] Background sync failed:', err);
            }
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          clearCurrentOrg();
          setOrgIdState(null);
          setOrgRoleState(null);
          setOrgNameState(null);
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
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('[OAuth] Redirecting to Google, target callback:', redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};