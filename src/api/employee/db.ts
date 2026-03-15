/**
 * Database access layer for employee-related data.
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
    throw new Error('[EmployeeDB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(url, key);
  return _client;
}

// ---------- Leave Requests ----------

export interface CreateLeaveRequestPayload {
  organization_id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;   // ISO date
  end_date: string;     // ISO date
  reason?: string;
}

export async function getLeaveRequests(organizationId: string, userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('leave_requests')
    .select(`
      id,
      start_date,
      end_date,
      reason,
      status,
      leave_type_id,
      created_at,
      leave_types ( name )
    `)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[EmployeeDB] getLeaveRequests error:', error.message);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    start_date: row.start_date,
    end_date: row.end_date,
    reason: row.reason,
    status: row.status,
    leave_type_id: row.leave_type_id,
    leave_type_name: row.leave_types?.name ?? null,
    created_at: row.created_at,
  }));
}

export async function createLeaveRequest(payload: CreateLeaveRequestPayload) {
  const client = getClient();
  const { data, error } = await client
    .from('leave_requests')
    .insert({
      organization_id: payload.organization_id,
      user_id: payload.user_id,
      leave_type_id: payload.leave_type_id,
      start_date: payload.start_date,
      end_date: payload.end_date,
      reason: payload.reason || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[EmployeeDB] createLeaveRequest error:', error.message);
    throw error;
  }
  return data;
}

export async function withdrawLeaveRequest(requestId: string, userId: string) {
  const client = getClient();

  // First verify the request belongs to this user
  const { data: existing, error: fetchError } = await client
    .from('leave_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .maybeSingle();

  if (fetchError) {
    console.error('[EmployeeDB] withdrawLeaveRequest fetch error:', fetchError.message);
    throw fetchError;
  }

  if (!existing) throw new Error('Leave request not found');
  if (existing.user_id !== userId) throw new Error('Not authorized to withdraw this request');
  if (existing.status !== 'pending') throw new Error('Only pending requests can be withdrawn');

  const { data, error } = await client
    .from('leave_requests')
    .update({ status: 'withdrawn' })
    .eq('id', requestId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[EmployeeDB] withdrawLeaveRequest update error:', error.message);
    throw error;
  }
  return data;
}

// ---------- Leave Types ----------

export async function getLeaveTypes(organizationId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('leave_types')
    .select('id, name, annual_quota')
    .eq('organization_id', organizationId)
    .order('name');

  if (error) {
    console.error('[EmployeeDB] getLeaveTypes error:', error.message);
    throw error;
  }
  
  // Map back to expected frontend fields
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    default_days: row.annual_quota || 0,
    is_active: true // hardcoded default since column doesn't exist
  }));
}

// ---------- Leave Balances ----------

export async function getLeaveBalances(organizationId: string, userId: string) {
  const client = getClient();
  // Using select('*') to avoid strict column matching errors if schema changes
  const { data, error } = await client
    .from('employee_leave_balances')
    .select(`
      *,
      leave_types ( name )
    `)
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    // If table doesn't exist, just return empty array instead of failing
    if (error.code === '42P01') {
      console.warn('[EmployeeDB] employee_leave_balances table missing, returning empty []');
      return [];
    }
    console.error('[EmployeeDB] getLeaveBalances error:', error.message);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    leave_type_id: row.leave_type_id,
    leave_type_name: row.leave_types?.name ?? null,
    total_days: row.total_days || row.annual_quota || 0, // Fallback fields
    used_days: row.used_days || 0,
    remaining_days: row.remaining_days || 0,
  }));
}

// ---------- Holidays ----------

export async function getHolidays(organizationId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('holidays')
    .select('id, name, date')
    .eq('organization_id', organizationId)
    .order('date', { ascending: true });

  if (error) {
    console.error('[EmployeeDB] getHolidays error:', error.message);
    throw error;
  }
  return data || [];
}

// ---------- Timesheets ----------

export async function getTimesheetEntries(organizationId: string, userId: string, startDate: string, endDate: string) {
  const client = getClient();
  const { data, error } = await client
    .from('timesheets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .gte('work_date', startDate)
    .lte('work_date', endDate);

  if (error) {
    console.error('[EmployeeDB] getTimesheetEntries error:', error.message);
    throw error;
  }
  return data || [];
}

export async function upsertTimesheetEntry(payload: any) {
  const client = getClient();
  
  // If ID exists, it's an update, otherwise insert
  const { data, error } = await client
    .from('timesheets')
    .upsert({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[EmployeeDB] upsertTimesheetEntry error:', error.message);
    throw error;
  }
  return data;
}

export async function bulkUpdateStatus(organizationId: string, userId: string, startDate: string, endDate: string, status: string) {
  const client = getClient();
  const { data, error } = await client
    .from('timesheets')
    .update({ status })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .select();

  if (error) {
    console.error('[EmployeeDB] bulkUpdateStatus error:', error.message);
    throw error;
  }
  return data;
}
