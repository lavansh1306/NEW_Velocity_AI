/**
 * Database access layer for auth-related data.
 * Uses a server-side Supabase client (SERVICE_ROLE_KEY).
 * All callers MUST pass verified IDs from the auth middleware.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------- Singleton client ----------
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('[AuthDB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(url, key);
  return _client;
}

// ---------- Org Lookup ----------

export async function getUserOrgDetails(userId: string) {
  const client = getClient();
  
  const { data, error } = await client
    .from('users')
    .select(`
      id,
      organization_id,
      role,
      email,
      organizations (
        id,
        name,
        onboarding_complete
      )
    `)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[AuthDB] getUserOrgDetails error:', error.message);
    throw error;
  }

  if (!data || !data.organization_id) {
    throw new Error('User has no organization assigned');
  }

  return {
    userId: data.id,
    organizationId: data.organization_id,
    organizationName: (data as any).organizations?.name || 'My Organization',
    role: data.role || 'employee',
    email: data.email,
    onboardingComplete: (data as any).organizations?.onboarding_complete ?? false,
  };
}
