import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Generate a short readable invite code like "ACME-X8J9"
function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanPrefix = (prefix || 'TEAM').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'TEAM';
  return `${cleanPrefix}-${code}`;
}

/**
 * Create/generate an invite code and store it on the existing `organizations` table.
 * This avoids creating a new table; it writes into columns on the organizations row.
 */
export async function createInviteForOrganization(
  organizationId: string,
  createdBy: string | null = null,
  role: 'owner' | 'manager' | 'employee' = 'employee'
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.error('[InvitesDB] No Supabase client');
    return null;
  }

  // Read organization name for a readable prefix (table is `organizations` in current DB)
  const { data: org } = await client
    .from('organizations')
    .select('id, name, invite_code')
    .eq('id', organizationId)
    .maybeSingle();

  const prefix = org?.name || 'TEAM';
  const code = generateCode(prefix);

  // Update organizations row with invite fields. Columns may be added via ALTER TABLE SQL.
  const { error: updateError } = await client
    .from('organizations')
    .update({
      invite_code: code,
      invite_role: role,
      invite_is_active: true,
      invite_use_count: 0,
      invite_created_by: createdBy || null,
      invite_updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (updateError) {
    console.error('[InvitesDB] Failed to update organization with invite:', updateError.message || updateError);
    return null;
  }

  return code;
}

export async function getInviteForOrg(organizationId: string) {
  const client = getClient();
  if (!client) return null;
  const { data } = await client
    .from('organizations')
    .select('id, name, invite_code, invite_role, invite_is_active, invite_use_count, invite_created_by, invite_updated_at')
    .eq('id', organizationId)
    .maybeSingle();
  return data || null;
}

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

  // Find organization by invite_code stored on organizations row
  const { data: org, error: orgError } = await client
    .from('organizations')
    .select('id, name, invite_code, invite_role, invite_is_active, invite_use_count')
    .eq('invite_code', code.trim().toUpperCase())
    .maybeSingle();

  if (orgError) {
    console.error('[InvitesDB] Error looking up invite code:', orgError.message || orgError);
    return null;
  }
  if (!org) {
    console.warn('[InvitesDB] Invite code not found:', code);
    return null;
  }
  if (!org.invite_is_active) {
    console.warn('[InvitesDB] Invite not active:', code);
    return null;
  }

  const role = org.invite_role || 'employee';

  // Find default team for org
  // Find default team for org (create one if missing)
  const { data: foundTeam, error: teamError } = await client
    .from('teams')
    .select('id')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (teamError) {
    console.error('[InvitesDB] Error looking up default team for org:', org.id, teamError.message || teamError);
    return null;
  }

  let defaultTeam = foundTeam || null;
  if (!defaultTeam) {
    // Create a default team for this organization so join can proceed
    const teamName = `${org.name || 'Team'} Team`;
    const { data: newTeam, error: createTeamError } = await client
      .from('teams')
      .insert({ organization_id: org.id, name: teamName })
      .select('id')
      .single();

    if (createTeamError || !newTeam) {
      console.error('[InvitesDB] Failed to create default team for org:', org.id, createTeamError?.message || createTeamError);
      return null;
    }
    defaultTeam = newTeam;
    console.log('[InvitesDB] Created default team for org:', org.id, defaultTeam.id);
  }

  // Ensure user exists in users table
  const { data: existingUser } = await client
    .from('users')
    .select('id')
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
      console.error('[InvitesDB] Failed to create user record:', createUserError.message || createUserError);
      return null;
    }
  }

  // Add to team_members if not exists
  const { data: existingMember } = await client
    .from('team_members')
    .select('id')
    .eq('team_id', defaultTeam.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberError } = await client.from('team_members').insert({
      team_id: defaultTeam.id,
      user_id: userId,
      role: 'member',
    });
    if (memberError) {
      console.error('[InvitesDB] Failed to add team member:', memberError.message || memberError);
      return null;
    }

    // Increment invite use count on organizations
    await client
      .from('organizations')
      .update({ invite_use_count: (org.invite_use_count || 0) + 1 })
      .eq('id', org.id);
  }

  // Update pending_team_members if exists
  await client
    .from('pending_team_members')
    .update({ status: 'accepted' })
    .eq('team_id', defaultTeam.id)
    .eq('email', (email || '').toLowerCase());

  return { organizationId: org.id, teamId: defaultTeam.id, orgName: org.name, role };
}

