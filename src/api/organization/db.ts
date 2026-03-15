/**
 * Database access layer for organization-related settings.
 * Uses a server-side Supabase client (SERVICE_ROLE_KEY) — bypasses RLS,
 * so callers MUST pass verified IDs from the auth middleware.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------- Singleton client ----------
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('[OrganizationDB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(url, key);
  return _client;
}

// ---------- Organization Settings ----------

export async function getOrganizationSettings(orgId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) {
    console.error('[OrganizationDB] getOrganizationSettings error:', error.message);
    throw error;
  }
  return data;
}

export async function updateOrganizationSettings(orgId: string, settings: any) {
  const client = getClient();
  
  // Sanitize settings to only allow updating specific columns
  const allowedColumns = [
    'name',
    'work_hours_per_week',
    'work_days_per_week',
    'fiscal_year_start',
    'target_utilization',
    'overload_threshold',
    'ai_low_confidence_threshold',
    'ai_health_score_warning',
    'ai_timeline_risk_days'
  ];

  const updatePayload: any = {};
  for (const key of allowedColumns) {
    if (settings[key] !== undefined) {
      updatePayload[key] = settings[key];
    }
  }

  const { data, error } = await client
    .from('organizations')
    .update({
      ...updatePayload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
    .select()
    .single();

  if (error) {
    console.error('[OrganizationDB] updateOrganizationSettings error:', error.message);
    throw error;
  }
  return data;
}

// ---------- Holiday Management ----------

export async function getHolidays(orgId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('holidays')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: true });

  if (error) {
    console.error('[OrganizationDB] getHolidays error:', error.message);
    throw error;
  }
  return data || [];
}

export async function addHoliday(holiday: { organization_id: string; name: string; date: string }) {
  const client = getClient();
  const { data, error } = await client
    .from('holidays')
    .insert(holiday)
    .select()
    .single();

  if (error) {
    console.error('[OrganizationDB] addHoliday error:', error.message);
    throw error;
  }
  return data;
}

export async function deleteHoliday(holidayId: string, orgId: string) {
  const client = getClient();
  const { error } = await client
    .from('holidays')
    .delete()
    .eq('id', holidayId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('[OrganizationDB] deleteHoliday error:', error.message);
    throw error;
  }
  return true;
}
