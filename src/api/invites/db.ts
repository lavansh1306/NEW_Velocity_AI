import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateInviteCode, normalizeInviteCode } from '../../lib/inviteCodeGenerator.js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.warn('[InvitesDB] Missing SUPABASE_URL or keys — DB disabled');
    return null;
  }
  _client = createClient(url, key);
  return _client;
}

/**
 * Create/regenerate an invite code for a TEAM.
 * (Previously stored on organizations — now on teams.)
 */
export async function createInviteForTeam(
  teamId: string,
  createdBy: string | null = null,
  role: 'owner' | 'manager' | 'employee' = 'employee'
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.error('[InvitesDB] No Supabase client');
    return null;
  }

  const { data: team } = await client
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .maybeSingle();

  const code = generateInviteCode(team?.name || 'TEAM');

  const { error } = await client
    .from('teams')
    .update({
      invite_code: code,
      invite_role: role,
      invite_is_active: true,
      invite_use_count: 0,
      invite_created_by: createdBy || null,
      invite_created_at: new Date().toISOString(),
    })
    .eq('id', teamId);

  if (error) {
    console.error('[InvitesDB] Failed to update team with invite:', error.message);
    return null;
  }

  return code;
}

/**
 * Backwards-compatible: create invite for an org's first team.
 */
export async function createInviteForOrganization(
  organizationId: string,
  createdBy: string | null = null,
  role: 'owner' | 'manager' | 'employee' = 'employee'
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  // Find first team for this org
  const { data: team } = await client
    .from('teams')
    .select('id')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!team) {
    console.error('[InvitesDB] No team found for org:', organizationId);
    return null;
  }

  return createInviteForTeam(team.id, createdBy, role);
}

export async function getInviteForOrg(organizationId: string) {
  const client = getClient();
  if (!client) return null;

  // Return invite info from the org's first team
  const { data } = await client
    .from('teams')
    .select('id, name, invite_code, invite_role, invite_is_active, invite_use_count, invite_created_by, invite_created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data || null;
}

/**
 * Join with invite code — now looks up TEAMS, not organizations.
 */
export async function joinWithInviteCodeServer(
  code: string,
  userId: string,
  email?: string | null,
  displayName?: string | null
): Promise<{ organizationId: string; teamId: string; orgName: string; role: string } | null> {
  const client = getClient();
  if (!client) {
    console.error('[InvitesDB] No Supabase client');
    return null;
  }

  const normalized = normalizeInviteCode(code);

  // 1. Find team by invite_code
  const { data: team, error: teamError } = await client
    .from('teams')
    .select('id, name, organization_id, invite_code, invite_role, invite_is_active, invite_use_count')
    .eq('invite_code', normalized)
    .maybeSingle();

  if (teamError) {
    console.error('[InvitesDB] Error looking up invite code:', teamError.message);
    return null;
  }
  if (!team) {
    console.warn('[InvitesDB] Invite code not found:', code);
    return null;
  }
  if (!team.invite_is_active) {
    console.warn('[InvitesDB] Invite not active:', code);
    return null;
  }

  // 2. Get organization info
  const { data: org } = await client
    .from('organizations')
    .select('id, name')
    .eq('id', team.organization_id)
    .single();

  if (!org) {
    console.error('[InvitesDB] Organization not found for team:', team.id);
    return null;
  }

  const role = team.invite_role || 'employee';

  // 3. Ensure user exists in users table
  const { data: existingUser } = await client
    .from('users')
    .select('id, organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingUser) {
    const { error: createUserError } = await client.from('users').insert({
      id: userId,
      organization_id: org.id,
      email: email || null,
      name: displayName || (email ? email.split('@')[0] : 'User'),
      role: 'employee',
      is_active: true,
    });
    if (createUserError) {
      console.error('[InvitesDB] Failed to create user record:', createUserError.message);
      return null;
    }
  }

  // 4. Add to team_members if not already a member
  const { data: existingMember } = await client
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingMember) {
    // Check if this is the user's first team (→ primary)
    const { data: userTeams } = await client
      .from('team_members')
      .select('id')
      .eq('user_id', userId);

    const isPrimary = !userTeams || userTeams.length === 0;

    const { error: memberError } = await client.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role: 'member',
      is_primary: isPrimary,
      joined_via_invite: true,
      joined_at: new Date().toISOString(),
    });
    if (memberError) {
      console.error('[InvitesDB] Failed to add team member:', memberError.message);
      return null;
    }

    // Increment invite use count on team
    await client
      .from('teams')
      .update({ invite_use_count: (team.invite_use_count || 0) + 1 })
      .eq('id', team.id);
  }

  // 5. Update pending_team_members if exists
  await client
    .from('pending_team_members')
    .update({ status: 'accepted' })
    .eq('team_id', team.id)
    .eq('email', (email || '').toLowerCase());

  return { organizationId: org.id, teamId: team.id, orgName: org.name, role };
}
