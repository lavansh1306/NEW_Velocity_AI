import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  setCurrentOrgId,
  setCurrentOrgRole,
  setCurrentOrgName,
} from '@/lib/orgContext';

// ---- Types ----

export interface TeamMember {
  name: string;
  email: string;
  role: string;
}

export interface OrgSettings {
  workHoursPerWeek: number;
  workDaysPerWeek: number;
  weekStartDay: 'sunday' | 'monday';
  fiscalYearStart: 'January' | 'April' | 'July' | 'October';
  targetUtilization: number;
}

export interface Holiday {
  name: string;
  date: string; // YYYY-MM-DD
}

interface OnboardingContextType {
  orgId: string | null;
  orgName: string | null;
  inviteCode: string | null;
  loading: boolean;
  error: string | null;
  createOrganization: (name: string) => Promise<string>;
  saveTeamMembers: (members: TeamMember[]) => Promise<void>;
  saveSettings: (settings: OrgSettings) => Promise<void>;
  saveHolidays: (holidays: Holiday[]) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinWithInviteCode: (code: string) => Promise<void>;
  clearError: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Generate a short readable invite code like "ACME-X8J9"
function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Clean prefix: uppercase, only alphanumeric, max 8 chars
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'TEAM';
  return `${cleanPrefix}-${code}`;
}

// Generate a URL-safe slug from org name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'my-team';
}

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, refreshOrg } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Step 1: Create org + add current user as owner
  const createOrganization = useCallback(async (name: string): Promise<string> => {
    if (!user) throw new Error('You must be logged in');
    setLoading(true);
    setError(null);

    try {
      // Wait briefly for Supabase's internal session lock to settle
      // after auth state changes (signup/login). This prevents AbortError.
      await new Promise(r => setTimeout(r, 300));

      const slug = slugify(name);

      // Check if slug already exists, append random suffix if so
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: finalSlug,
        })
        .select('id, name, slug')
        .single();

      if (orgError) throw orgError;

      // Add current user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          org_id: org.id,
          user_id: user.id,
          role: 'owner',
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        });

      if (memberError) throw memberError;

      // Set org context globally
      setOrgId(org.id);
      setOrgName(org.name);
      setCurrentOrgId(org.id);
      setCurrentOrgRole('owner');
      setCurrentOrgName(org.name);

      // Also generate a default invite code for this org
      const code = generateCode(name);
      const { error: inviteError } = await supabase
        .from('org_invites')
        .insert({
          org_id: org.id,
          invite_code: code,
          created_by: user.id,
          role: 'employee',
        });

      if (!inviteError) {
        setInviteCode(code);
      }

      console.log(`[Onboarding] Org created: ${org.name} (${org.id}), invite: ${code}`);
      return org.id;
    } catch (err: any) {
      const msg = err.message || 'Failed to create organization';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Step 2: Save team members as pending invites
  const saveTeamMembers = useCallback(async (members: TeamMember[]) => {
    if (!orgId || !user) return;
    setLoading(true);
    setError(null);

    try {
      // Filter out empty entries
      const validMembers = members.filter(m => m.email.trim());
      if (validMembers.length === 0) return;

      // Upsert pending invites (on conflict with org_id + email, update)
      const rows = validMembers.map(m => ({
        org_id: orgId,
        email: m.email.trim().toLowerCase(),
        display_name: m.name.trim(),
        role: 'employee', // all invited members start as employees
        invited_by: user.id,
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('pending_member_invites')
        .upsert(rows, { onConflict: 'org_id,email' });

      if (insertError) throw insertError;
      console.log(`[Onboarding] Saved ${rows.length} team member invites`);
    } catch (err: any) {
      const msg = err.message || 'Failed to save team members';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orgId, user]);

  // Step 3: Save work settings
  const saveSettings = useCallback(async (settings: OrgSettings) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .upsert({
          org_id: orgId,
          work_hours_per_week: settings.workHoursPerWeek,
          work_days_per_week: settings.workDaysPerWeek,
          week_start_day: settings.weekStartDay,
          fiscal_year_start: settings.fiscalYearStart,
          target_utilization: settings.targetUtilization,
        }, { onConflict: 'org_id' });

      if (settingsError) throw settingsError;
      console.log('[Onboarding] Settings saved');
    } catch (err: any) {
      const msg = err.message || 'Failed to save settings';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Step 4: Save holidays
  const saveHolidays = useCallback(async (holidays: Holiday[]) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // Remove existing holidays first, then insert new
      await supabase
        .from('organization_holidays')
        .delete()
        .eq('org_id', orgId);

      if (holidays.length > 0) {
        const rows = holidays.map(h => ({
          org_id: orgId,
          name: h.name,
          date: h.date,
          country_template: 'US',
        }));

        const { error: insertError } = await supabase
          .from('organization_holidays')
          .insert(rows);

        if (insertError) throw insertError;
      }
      console.log(`[Onboarding] Saved ${holidays.length} holidays`);
    } catch (err: any) {
      const msg = err.message || 'Failed to save holidays';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Generate (another) invite code
  const generateInviteCode = useCallback(async (): Promise<string> => {
    if (!orgId || !user) throw new Error('No organization');
    setLoading(true);
    setError(null);

    try {
      const code = generateCode(orgName || 'TEAM');

      const { error: inviteError } = await supabase
        .from('org_invites')
        .insert({
          org_id: orgId,
          invite_code: code,
          created_by: user.id,
          role: 'employee',
        });

      if (inviteError) throw inviteError;
      setInviteCode(code);
      return code;
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite code');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orgId, orgName, user]);

  // Join: validate an invite code and add user to that org
  const joinWithInviteCode = useCallback(async (code: string) => {
    if (!user) throw new Error('You must be logged in');
    setLoading(true);
    setError(null);

    try {
      // Look up the invite code
      const { data: invite, error: lookupError } = await supabase
        .from('org_invites')
        .select('id, org_id, role, max_uses, use_count, expires_at, is_active')
        .eq('invite_code', code.trim().toUpperCase())
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!invite) throw new Error('Invalid invite code. Please check and try again.');
      if (!invite.is_active) throw new Error('This invite code is no longer active.');
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite code has expired.');
      }
      if (invite.max_uses && invite.use_count >= invite.max_uses) {
        throw new Error('This invite code has reached its maximum uses.');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', invite.org_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        // Already a member — just set context and proceed
        console.log('[Onboarding] User already a member of this org');
      } else {
        // Add user as member
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            org_id: invite.org_id,
            user_id: user.id,
            role: invite.role || 'employee',
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          });

        if (memberError) throw memberError;

        // Increment use_count
        await supabase
          .from('org_invites')
          .update({ use_count: (invite.use_count || 0) + 1 })
          .eq('id', invite.id);
      }

      // Look up the org name
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', invite.org_id)
        .single();

      // Set org context
      setOrgId(invite.org_id);
      setOrgName(org?.name || '');
      setCurrentOrgId(invite.org_id);
      setCurrentOrgRole(invite.role || 'employee');
      setCurrentOrgName(org?.name || '');

      // Also update pending invite if exists
      await supabase
        .from('pending_member_invites')
        .update({ status: 'accepted' })
        .eq('org_id', invite.org_id)
        .eq('email', (user.email || '').toLowerCase());

      // Refresh AuthContext org state
      await refreshOrg();

      console.log(`[Onboarding] Joined org: ${org?.name} (${invite.org_id})`);
    } catch (err: any) {
      const msg = err.message || 'Failed to join team';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refreshOrg]);

  return (
    <OnboardingContext.Provider value={{
      orgId,
      orgName,
      inviteCode,
      loading,
      error,
      createOrganization,
      saveTeamMembers,
      saveSettings,
      saveHolidays,
      generateInviteCode,
      joinWithInviteCode,
      clearError,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
