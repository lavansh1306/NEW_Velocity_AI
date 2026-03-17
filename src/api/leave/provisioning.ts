/**
 * Leave provisioning helpers.
 * Auto-create leave_types for an org and employee_leave_balances for a user.
 * Idempotent — safe to call multiple times.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_LEAVE_TYPES } from '../../constants/leaveDefaults.js';

// ---------- Singleton client ----------
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('[LeaveProvisioning] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(url, key);
  return _client;
}

/**
 * Ensure default leave types exist for an organization.
 * Returns the leave type rows (existing or newly created).
 */
export async function ensureLeaveTypesExist(organizationId: string) {
  const client = getClient();

  // Check if leave types already exist for this org
  const { data: existing, error: fetchErr } = await client
    .from('leave_types')
    .select('id, name, annual_quota')
    .eq('organization_id', organizationId);

  if (fetchErr) {
    console.error('[LeaveProvisioning] Error fetching leave types:', fetchErr.message);
    throw fetchErr;
  }

  if (existing && existing.length > 0) {
    console.log(`[LeaveProvisioning] Leave types already exist for org ${organizationId} (${existing.length})`);
    return existing;
  }

  // Insert default leave types
  const rows = DEFAULT_LEAVE_TYPES.map(lt => ({
    organization_id: organizationId,
    name: lt.name,
    annual_quota: lt.annual_quota,
  }));

  const { data: inserted, error: insertErr } = await client
    .from('leave_types')
    .insert(rows)
    .select('id, name, annual_quota');

  if (insertErr) {
    console.error('[LeaveProvisioning] Error inserting leave types:', insertErr.message);
    throw insertErr;
  }

  console.log(`[LeaveProvisioning] Created ${inserted?.length || 0} leave types for org ${organizationId}`);
  return inserted || [];
}

/**
 * Ensure leave balances exist for a user for the current year.
 * Creates one employee_leave_balances row per leave type.
 */
export async function ensureLeaveBalancesExist(organizationId: string, userId: string) {
  const client = getClient();
  const currentYear = new Date().getFullYear();

  // First ensure leave types exist
  const leaveTypes = await ensureLeaveTypesExist(organizationId);

  // Check if balances already exist for this user + year
  const { data: existing, error: fetchErr } = await client
    .from('employee_leave_balances')
    .select('id, leave_type_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('year', currentYear);

  if (fetchErr) {
    // Table might not exist yet — just warn and return empty
    if (fetchErr.code === '42P01') {
      console.warn('[LeaveProvisioning] employee_leave_balances table missing');
      return [];
    }
    console.error('[LeaveProvisioning] Error fetching balances:', fetchErr.message);
    throw fetchErr;
  }

  const existingTypeIds = new Set((existing || []).map((b: any) => b.leave_type_id));

  // Only insert balances for leave types that don't have one yet
  const missing = leaveTypes.filter(lt => !existingTypeIds.has(lt.id));

  if (missing.length === 0) {
    console.log(`[LeaveProvisioning] Leave balances already exist for user ${userId} year ${currentYear}`);
    return existing || [];
  }

  const rows = missing.map(lt => ({
    organization_id: organizationId,
    user_id: userId,
    leave_type_id: lt.id,
    year: currentYear,
    total_allocated: lt.annual_quota,
    used_days: 0,
    pending_days: 0,
  }));

  const { data: inserted, error: insertErr } = await client
    .from('employee_leave_balances')
    .insert(rows)
    .select();

  if (insertErr) {
    console.error('[LeaveProvisioning] Error inserting balances:', insertErr.message);
    throw insertErr;
  }

  console.log(`[LeaveProvisioning] Created ${inserted?.length || 0} leave balances for user ${userId}`);
  return [...(existing || []), ...(inserted || [])];
}
