import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  setCurrentOrgId,
  setCurrentOrgRole,
  setCurrentOrgName,
} from '@/lib/orgContext';
import { apiUrl } from '@/lib/api';

// ---- Types ----

export interface TeamMember {
  name: string;
  email: string;
  role: string; // Specific job title (e.g. Engineer)
  type?: string; // High-level category (e.g. employee, contractor)
  skills?: string[];
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
  teamId: string | null;
  orgName: string | null;
  inviteCode: string | null;
  loading: boolean;
  error: string | null;
  createOrganization: (name: string, teamName?: string) => Promise<string>;
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
  const [teamId, setTeamId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Step 1: Create org + create default team + add current user as team lead
  const createOrganization = useCallback(async (name: string, teamName?: string): Promise<string> => {
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

      // Create default team for this organization
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          organization_id: org.id,
          name: teamName?.trim() || `${name} Team`,
        })
        .select('id')
        .single();

      if (teamError) {
        console.error('[Onboarding] Failed to create team:', teamError);
        throw teamError;
      }

      console.log('[Onboarding] Team created:', team.id);

      // Check if user record already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // Create user record in the users table (required for FK constraint) only if not exists
      if (!existingUser) {
        const { data: appUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            organization_id: org.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'admin',
            is_active: true,
          })
          .select('id')
          .single();

        if (userError) {
          console.error('[Onboarding] Failed to create user record:', userError);
          throw userError;
        }

        console.log('[Onboarding] User record created:', appUser.id);
      } else {
        console.log('[Onboarding] User record already exists:', existingUser.id);
      }

      // Add current user as team lead
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'lead',
        });

      if (memberError) {
        console.error('[Onboarding] Failed to add user as team lead:', memberError);
        throw memberError;
      }

      console.log('[Onboarding] User added as team lead');

      // Set org & team context globally
      setOrgId(org.id);
      setTeamId(team.id);
      setOrgName(org.name);
      setCurrentOrgId(org.id);
      setCurrentOrgRole('owner');
      setCurrentOrgName(org.name);

      // Generate default invite code and update organization directly
      try {
        const code = generateCode(name);
        console.log('[Onboarding] Updating organization with invite code:', code);
        
        const { error: inviteError } = await supabase
          .from('organizations')
          .update({
            invite_code: code,
            invite_role: 'owner',
            invite_is_active: true,
            invite_use_count: 0,
            invite_created_by: user.id,
            invite_updated_at: new Date().toISOString(),
          })
          .eq('id', org.id);

        if (inviteError) throw inviteError;
        
        setInviteCode(code);
        console.log('[Onboarding] ✓ Invite code successfully persisted directly to database:', code);
      } catch (err) {
        console.error('[Onboarding] Failed to create and persist invite code:', err);
        throw new Error(`Could not generate invite code: ${err instanceof Error ? err.message : String(err)}`);
      }

      console.log(`[Onboarding] Org created: ${org.name} (${org.id}), team: ${team.id}`);
      return org.id;
    } catch (err: any) {
      const msg = err.message || 'Failed to create organization';
      console.error('[Onboarding] Error in createOrganization:', err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Step 2: Save team member invitations to both users and team_members tables
  const saveTeamMembers = useCallback(async (members: TeamMember[]) => {
    console.log('[Onboarding] saveTeamMembers called with:', { teamId, orgId, members });
    
    if (!teamId || !orgId || !user) {
      console.error('[Onboarding] Missing required data:', { teamId, orgId, userExists: !!user });
      throw new Error('Organization or Team not created. Please create organization first.');
    }
    setLoading(true);
    setError(null);

    try {
      // Filter out empty entries
      const validMembers = members.filter(m => m.email.trim());
      if (validMembers.length === 0) {
        console.log('[Onboarding] No valid team members to save');
        return;
      }

      console.log(`[Onboarding] Attempting to save ${validMembers.length} team member(s)`, validMembers);

      // Check which emails already exist in users table for this org
      const { data: existingEmailsData, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('organization_id', orgId)
        .in('email', validMembers.map(m => m.email.trim().toLowerCase()));

      if (checkError) {
        console.error('[Onboarding] Error checking existing emails:', checkError);
      }

      const existingEmailMap = new Map(
        (existingEmailsData || []).map(u => [u.email, u.id])
      );

      console.log('[Onboarding] Existing emails:', Array.from(existingEmailMap.keys()));

      // Prepare new users to insert
      const newUsers = validMembers
        .filter(m => !existingEmailMap.has(m.email.trim().toLowerCase()))
        .map(m => ({
          organization_id: orgId,
          email: m.email.trim().toLowerCase(),
          name: m.name.trim(),
          role: m.type || 'employee',
          is_active: true,
        }));

      console.log(`[Onboarding] Inserting ${newUsers.length} new user(s)...`);

      // Insert new users
      let insertedUsers: any[] = [];
      if (newUsers.length > 0) {
        const { data: insertedData, error: userInsertError } = await supabase
          .from('users')
          .insert(newUsers)
          .select('id, email');

        if (userInsertError) {
          console.error('[Onboarding] Failed to insert users:', userInsertError);
          throw userInsertError;
        }

        insertedUsers = insertedData || [];
        console.log(`[Onboarding] Successfully inserted ${insertedUsers.length} user(s)`, insertedUsers);
      }

      // Build team_members rows with both new and existing users
      const teamMembersRows = validMembers.map(m => {
        const email = m.email.trim().toLowerCase();
        const userId = existingEmailMap.get(email) || insertedUsers.find(u => u.email === email)?.id;

        console.log(`[Onboarding] Team member row for ${email}:`, { userId, email, role: m.role });

        return {
          team_id: teamId,
          user_id: userId,
          email: email,
          display_name: m.name.trim(),
          role: m.role?.trim() || 'member',
          status: userId ? 'active' : 'invited',
        };
      });

      console.log(`[Onboarding] Team members rows to insert:`, teamMembersRows);

      // Check which team members already exist
      const existingTeamMembers = await supabase
        .from('team_members')
        .select('user_id, email')
        .eq('team_id', teamId)
        .in('email', teamMembersRows.map(r => r.email));

      const existingSet = new Set(
        (existingTeamMembers.data || []).map(tm => tm.email)
      );

      // Filter out already existing team members
      const newTeamMembers = teamMembersRows.filter(tm => !existingSet.has(tm.email));

      if (newTeamMembers.length === 0) {
        console.log('[Onboarding] All team members already exist');
        return;
      }

      // Insert team members
      const { error: teamMemberError, data: teamMemberData } = await supabase
        .from('team_members')
        .insert(newTeamMembers);

      if (teamMemberError) {
        console.error('[Onboarding] Failed to save team members:', {
          error: teamMemberError,
          message: teamMemberError.message,
          details: teamMemberError.details,
          hint: teamMemberError.hint,
          rows: newTeamMembers,
        });
        throw teamMemberError;
      }

      console.log(`[Onboarding] Successfully saved ${newTeamMembers.length} team member(s)`, teamMemberData);

      // --- SAVE SKILLS ---
      const skillsRows = validMembers.flatMap(m => {
        const email = m.email.trim().toLowerCase();
        const userId = existingEmailMap.get(email) || insertedUsers.find((u: any) => u.email === email)?.id;
        
        if (!userId || !m.skills || m.skills.length === 0) return [];

        return m.skills.map(skill => ({
          user_id: userId,
          skill_name: skill,
          source: 'dataset_matched',
          confidence_score: 0.8
        }));
      });

      if (skillsRows.length > 0) {
        console.log(`[Onboarding] Inserting ${skillsRows.length} user skill(s)...`);
        const { error: skillsError } = await supabase
          .from('user_skills')
          .insert(skillsRows);

        if (skillsError) {
          console.error('[Onboarding] Failed to save user skills:', skillsError);
          throw skillsError;
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save team members';
      console.error('[Onboarding] Error in saveTeamMembers:', {
        error: err,
        message: msg,
        stack: err.stack,
      });
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [teamId, orgId, user]);

  // Step 3: Save work settings
  const saveSettings = useCallback(async (settings: OrgSettings) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      console.log('[Onboarding] Saving organization settings:', settings);
      
      const { error: settingsError } = await supabase
        .from('organizations')
        .update({
          work_hours_per_week: settings.workHoursPerWeek,
          work_days_per_week: settings.workDaysPerWeek,
          week_starts_on: settings.weekStartDay,
          fiscal_year_start: settings.fiscalYearStart?.toLowerCase(),
          target_utilization: settings.targetUtilization,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (settingsError) {
        console.error('[Onboarding] Failed to save settings:', settingsError);
        throw settingsError;
      }
      console.log('[Onboarding] Settings saved successfully');
    } catch (err: any) {
      const msg = err.message || 'Failed to save settings';
      console.error('[Onboarding] Error in saveSettings:', err);
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
      console.log('[Onboarding] Saving holidays:', holidays);
      
      // Delete existing holidays for this org
      const { error: deleteError } = await supabase
        .from('holidays')
        .delete()
        .eq('organization_id', orgId);

      if (deleteError) {
        console.error('[Onboarding] Failed to delete existing holidays:', deleteError);
        throw deleteError;
      }

      if (holidays.length > 0) {
        const rows = holidays.map(h => ({
          organization_id: orgId,
          name: h.name,
          date: h.date,
        }));

        console.log('[Onboarding] Inserting new holidays:', rows);

        const { error: insertError } = await supabase
          .from('holidays')
          .insert(rows);

        if (insertError) {
          console.error('[Onboarding] Failed to insert holidays:', insertError);
          throw insertError;
        }
      }
      console.log(`[Onboarding] Saved ${holidays.length} holiday(s) successfully`);
    } catch (err: any) {
      const msg = err.message || 'Failed to save holidays';
      console.error('[Onboarding] Error in saveHolidays:', err);
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
      console.log('[Onboarding] Updating organization with new invite code:', code);
      
      const { error: inviteError } = await supabase
        .from('organizations')
        .update({
          invite_code: code,
          invite_role: 'employee',
          invite_is_active: true,
          invite_use_count: 0,
          invite_created_by: user.id,
          invite_updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (inviteError) throw inviteError;
      
      setInviteCode(code);
      console.log('[Onboarding] ✓ New invite code generated and updated directly:', code);
      return code;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate invite code';
      console.error('[Onboarding] Error in generateInviteCode:', err);
      setError(msg);
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
      // Call server-side join endpoint (server will perform DB writes)
      const resp = await fetch(apiUrl('/api/invites/join'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), userId: user.id, email: user.email, displayName: user.user_metadata?.full_name }),
      });
      const body = await resp.json();
      if (!resp.ok || !body.success) {
        const err = body?.error || 'Failed to join with invite code';
        console.error('[Onboarding] Server join failed:', err);
        throw new Error(err);
      }

      // Server returns organizationId, teamId, orgName, role
      const { organizationId, teamId, orgName, role } = body;

      // Set org context locally
      setOrgId(organizationId);
      setTeamId(teamId);
      setOrgName(orgName || '');
      setCurrentOrgId(organizationId);
      setCurrentOrgRole(role || 'employee');
      setCurrentOrgName(orgName || '');

      // Refresh AuthContext org state
      await refreshOrg();

      console.log('[Onboarding] Joined org via server:', organizationId, teamId);

      console.log(`[Onboarding] Joined org: ${orgName} (${organizationId}), team: ${teamId}`);
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
      teamId,
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
