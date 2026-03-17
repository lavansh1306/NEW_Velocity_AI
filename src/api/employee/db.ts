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
    .select('id, user_id, status, leave_type_id, start_date, end_date')
    .eq('id', requestId)
    .maybeSingle();

  if (fetchError) {
    console.error('[EmployeeDB] withdrawLeaveRequest fetch error:', fetchError.message);
    throw fetchError;
  }

  if (!existing) throw new Error('Leave request not found');
  if (existing.user_id !== userId) throw new Error('Not authorized to withdraw this request');
  if (existing.status !== 'pending' && existing.status !== 'approved') {
    throw new Error('Only pending or approved requests can be withdrawn');
  }

  const wasApproved = existing.status === 'approved';

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

  // Restore leave balance if the request was already approved
  if (wasApproved && existing.leave_type_id && existing.start_date && existing.end_date) {
    const start = new Date(existing.start_date);
    const end = new Date(existing.end_date);
    const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentYear = new Date().getFullYear();

    const { data: balance } = await client
      .from('employee_leave_balances')
      .select('id, used_days')
      .eq('user_id', userId)
      .eq('leave_type_id', existing.leave_type_id)
      .eq('year', currentYear)
      .maybeSingle();

    if (balance) {
      const newUsed = Math.max(0, (balance.used_days || 0) - leaveDays);
      await client
        .from('employee_leave_balances')
        .update({ used_days: newUsed })
        .eq('id', balance.id);
      console.log(`[EmployeeDB] Restored ${leaveDays} day(s) to balance for user ${userId}`);
    }
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
  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  // Fetch balances and approved leave requests in parallel
  const [balancesRes, leavesRes] = await Promise.all([
    client
      .from('employee_leave_balances')
      .select(`*, leave_types ( name )`)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('year', currentYear),
    client
      .from('leave_requests')
      .select('leave_type_id, start_date, end_date')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('start_date', yearStart)
      .lte('start_date', yearEnd),
  ]);

  if (balancesRes.error) {
    if (balancesRes.error.code === '42P01') {
      console.warn('[EmployeeDB] employee_leave_balances table missing, returning empty []');
      return [];
    }
    console.error('[EmployeeDB] getLeaveBalances error:', balancesRes.error.message);
    throw balancesRes.error;
  }

  // Compute actual used days per leave type from approved requests
  const usedByType: Record<string, number> = {};
  for (const req of (leavesRes.data || [])) {
    if (!req.leave_type_id || !req.start_date || !req.end_date) continue;
    const start = new Date(req.start_date);
    const end = new Date(req.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    usedByType[req.leave_type_id] = (usedByType[req.leave_type_id] || 0) + days;
  }

  return (balancesRes.data || []).map((row: any) => {
    const total = row.total_allocated || row.total_days || row.annual_quota || 0;
    const used = usedByType[row.leave_type_id] || 0;
    return {
      id: row.id,
      leave_type_id: row.leave_type_id,
      leave_type_name: row.leave_types?.name ?? null,
      total_days: total,
      used_days: used,
      remaining_days: Math.max(0, total - used),
    };
  });
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

// ---------- Dashboard Data ----------

export async function getEmployeeTasks(organizationId: string, userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('tasks')
    .select(`
      id,
      name,
      status,
      due_date,
      project_id,
      projects ( name )
    `)
    .eq('assignee_id', userId)
    .order('due_date', { ascending: true });

  if (error) {
    console.warn('[EmployeeDB] getEmployeeTasks warning:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.name,
    project: row.projects?.name ?? 'Unassigned',
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
  }));
}

export async function getEmployeeAlerts(organizationId: string, userId: string) {
  // alerts table exists but is empty, return empty array
  return [];
}

export async function getEmployeeActivities(organizationId: string, userId: string, limit: number = 5) {
  // activities table exists but is empty, return empty array
  return [];
}

export async function getUserProfile(organizationId: string, userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[EmployeeDB] getUserProfile error:', error.message);
    throw error;
  }
  return data;
}

export async function getUserProjects(organizationId: string, userId: string) {
  const client = getClient();
  
  // First get all project IDs where user has tasks
  const { data: taskData, error: taskError } = await client
    .from('tasks')
    .select('project_id')
    .eq('assignee_id', userId);

  if (taskError) {
    console.warn('[EmployeeDB] getUserProjects warning fetching tasks:', taskError.message);
    return [];
  }

  const projectIds = [...new Set((taskData || []).map((t: any) => t.project_id))];
  
  if (projectIds.length === 0) {
    return [];
  }

  // Then fetch project details for those IDs
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .in('id', projectIds);

  if (error) {
    console.warn('[EmployeeDB] getUserProjects warning fetching projects:', error.message);
    return [];
  }
  return data || [];
}
