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

// ---------- Task Actions ----------

export async function updateTaskStatus(taskId: string, userId: string, status: string) {
  const client = getClient();

  // Verify ownership
  const { data: task, error: fetchErr } = await client
    .from('tasks')
    .select('id, assignee_id')
    .eq('id', taskId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!task) throw new Error('Task not found');
  if (task.assignee_id !== userId) throw new Error('Not authorized to update this task');

  const { data, error } = await client
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addTaskBlocker(
  taskId: string,
  userId: string,
  blockerDescription: string,
  blockingUserName?: string,
) {
  const client = getClient();

  // Verify ownership
  const { data: task, error: fetchErr } = await client
    .from('tasks')
    .select('id, assignee_id')
    .eq('id', taskId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!task) throw new Error('Task not found');
  if (task.assignee_id !== userId) throw new Error('Not authorized');

  // Insert blocker
  const { data: blocker, error: blockerErr } = await client
    .from('task_blockers')
    .insert({
      task_id: taskId,
      blocker_description: blockerDescription,
      blocking_user_name: blockingUserName || null,
      created_by: userId,
    })
    .select()
    .single();

  if (blockerErr) throw blockerErr;

  // Mark task as blocked
  await client.from('tasks').update({ is_blocked: true }).eq('id', taskId);

  return blocker;
}

export async function resolveTaskBlocker(blockerId: string, taskId: string, userId: string) {
  const client = getClient();

  // Verify ownership
  const { data: task } = await client
    .from('tasks')
    .select('id, assignee_id')
    .eq('id', taskId)
    .maybeSingle();

  if (!task || task.assignee_id !== userId) throw new Error('Not authorized');

  await client
    .from('task_blockers')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', blockerId);

  // Check if any unresolved blockers remain
  const { data: remaining } = await client
    .from('task_blockers')
    .select('id')
    .eq('task_id', taskId)
    .eq('resolved', false);

  if (!remaining || remaining.length === 0) {
    await client.from('tasks').update({ is_blocked: false }).eq('id', taskId);
  }

  return { success: true };
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
  const client = getClient();
  const alerts: Array<{
    id: string; type: 'warning' | 'info' | 'success';
    icon: string; title: string; description: string;
    secondaryText?: string; actionLabel?: string; actionPath?: string;
    bgColor: string; borderColor: string;
    _severity: number; // internal sort key (lower = more urgent)
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split('T')[0];

  try {
    // Run all queries in parallel
    const [overdueRes, upcomingRes, timesheetRes, balancesRes, leavesRes, pendingLeavesRes] = await Promise.all([
      // 1. Overdue tasks
      client
        .from('tasks')
        .select('id, name, due_date, projects ( name )')
        .eq('assignee_id', userId)
        .not('status', 'ilike', '%completed%')
        .not('status', 'ilike', '%done%')
        .not('status', 'ilike', '%abandoned%')
        .lt('due_date', todayISO)
        .order('due_date', { ascending: true })
        .limit(5),

      // 2. Upcoming deadlines (next 3 days)
      client
        .from('tasks')
        .select('id, name, due_date, projects ( name )')
        .eq('assignee_id', userId)
        .not('status', 'ilike', '%completed%')
        .not('status', 'ilike', '%done%')
        .not('status', 'ilike', '%abandoned%')
        .gte('due_date', todayISO)
        .lte('due_date', new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5),

      // 3. Timesheet check — any entries for current week?
      (() => {
        const dayOfWeek = today.getDay(); // 0=Sun
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today.getTime() + mondayOffset * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
        return client
          .from('timesheets')
          .select('id, status')
          .eq('organization_id', organizationId)
          .eq('user_id', userId)
          .gte('work_date', weekStart.toISOString().split('T')[0])
          .lte('work_date', weekEnd.toISOString().split('T')[0])
          .limit(1);
      })(),

      // 4. Leave balances (current year)
      client
        .from('employee_leave_balances')
        .select('id, leave_type_id, total_allocated, leave_types ( name )')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('year', today.getFullYear()),

      // 5. Approved leave requests for used-days calc
      client
        .from('leave_requests')
        .select('leave_type_id, start_date, end_date')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .gte('start_date', `${today.getFullYear()}-01-01`)
        .lte('start_date', `${today.getFullYear()}-12-31`),

      // 6. Pending leave requests older than 2 days
      client
        .from('leave_requests')
        .select('id, leave_type_id, start_date, end_date, created_at, leave_types ( name )')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('created_at', new Date(today.getTime() - 2 * 86400000).toISOString())
        .limit(5),
    ]);

    // --- 1. Overdue tasks ---
    for (const task of (overdueRes.data || [])) {
      if (!task.due_date) continue;
      const daysOverdue = Math.floor((today.getTime() - new Date(task.due_date).getTime()) / 86400000);
      const projectName = (task as any).projects?.name || 'Unknown Project';
      alerts.push({
        id: `overdue-${task.id}`,
        type: 'warning',
        icon: '🔴',
        title: 'Overdue Task',
        description: `${task.name} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`,
        secondaryText: projectName,
        actionLabel: 'View Projects',
        actionPath: '/app/employee/my-projects',
        bgColor: 'bg-[#FEF2F2]',
        borderColor: 'border-[#FECACA]',
        _severity: 1,
      });
    }

    // --- 2. Upcoming deadlines ---
    for (const task of (upcomingRes.data || [])) {
      if (!task.due_date) continue;
      const daysUntil = Math.ceil((new Date(task.due_date).getTime() - today.getTime()) / 86400000);
      const projectName = (task as any).projects?.name || 'Unknown Project';
      const label = daysUntil === 0 ? 'due today' : `due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
      alerts.push({
        id: `upcoming-${task.id}`,
        type: 'warning',
        icon: '🟡',
        title: 'Upcoming Deadline',
        description: `${task.name} ${label}`,
        secondaryText: projectName,
        actionLabel: 'View Projects',
        actionPath: '/app/employee/my-projects',
        bgColor: 'bg-[#FFFBEB]',
        borderColor: 'border-[#FDE68A]',
        _severity: 2,
      });
    }

    // --- 3. Pending timesheet (Wed–Fri only) ---
    const dayOfWeek = today.getDay();
    if (dayOfWeek >= 3 && dayOfWeek <= 5) {
      const hasEntries = (timesheetRes.data || []).length > 0;
      const allSubmitted = hasEntries && (timesheetRes.data || []).every((e: any) => e.status === 'Submitted');
      if (!hasEntries || !allSubmitted) {
        const mondayOffset = 1 - dayOfWeek;
        const weekStart = new Date(today.getTime() + mondayOffset * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 4 * 86400000);
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        alerts.push({
          id: `timesheet-${weekStart.toISOString().split('T')[0]}`,
          type: 'warning',
          icon: '⏰',
          title: 'Timesheet Due',
          description: `Submit your timesheet for ${fmt(weekStart)} – ${fmt(weekEnd)} by Friday`,
          actionLabel: 'Open Timesheet',
          actionPath: '/app/employee/time',
          bgColor: 'bg-[#FFFBEB]',
          borderColor: 'border-[#D6D3D1]',
          _severity: 3,
        });
      }
    }

    // --- 4. Low leave balance ---
    const usedByType: Record<string, number> = {};
    for (const req of (leavesRes.data || [])) {
      if (!req.leave_type_id || !req.start_date || !req.end_date) continue;
      const days = Math.ceil((new Date(req.end_date).getTime() - new Date(req.start_date).getTime()) / 86400000) + 1;
      usedByType[req.leave_type_id] = (usedByType[req.leave_type_id] || 0) + days;
    }
    for (const bal of (balancesRes.data || [])) {
      const total = (bal as any).total_allocated || 0;
      const used = usedByType[bal.leave_type_id] || 0;
      const remaining = Math.max(0, total - used);
      const typeName = (bal as any).leave_types?.name || 'Leave';
      if (remaining <= 2) {
        alerts.push({
          id: `low-leave-${bal.leave_type_id}`,
          type: 'info',
          icon: '📋',
          title: 'Low Leave Balance',
          description: `You have ${remaining === 0 ? 'no' : `only ${remaining}`} ${typeName} day${remaining !== 1 ? 's' : ''} remaining`,
          actionLabel: 'View Balance',
          actionPath: '/app/employee/time?tab=leave',
          bgColor: 'bg-[#F0FDFA]',
          borderColor: 'border-[#99F6E4]',
          _severity: 4,
        });
      }
    }

    // --- 5. Pending leave requests (> 2 days old) ---
    for (const leave of (pendingLeavesRes.data || [])) {
      const typeName = (leave as any).leave_types?.name || 'Leave';
      const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daysPending = Math.floor((today.getTime() - new Date(leave.created_at).getTime()) / 86400000);
      alerts.push({
        id: `pending-leave-${leave.id}`,
        type: 'info',
        icon: '📋',
        title: 'Leave Request Pending',
        description: `Your ${typeName} request for ${fmt(leave.start_date)} – ${fmt(leave.end_date)} is awaiting approval`,
        secondaryText: `Pending for ${daysPending} day${daysPending !== 1 ? 's' : ''}`,
        actionLabel: 'View Request',
        actionPath: '/app/employee/time?tab=leave',
        bgColor: 'bg-[#F0FDFA]',
        borderColor: 'border-[#99F6E4]',
        _severity: 5,
      });
    }
  } catch (err: any) {
    console.error('[EmployeeDB] getEmployeeAlerts error:', err?.message);
    // Non-fatal: return whatever we have so far
  }

  // Sort by severity, limit to 10
  alerts.sort((a, b) => a._severity - b._severity);
  return alerts.slice(0, 10).map(({ _severity, ...alert }) => alert);
}

export async function getEmployeeActivities(organizationId: string, userId: string, limit: number = 5) {
  const client = getClient();
  const activities: Array<{ id: string; timestamp: string; description: string; _sortDate: string }> = [];

  try {
    // Fetch recent leave requests and timesheet entries in parallel
    const [leaveRes, timesheetRes] = await Promise.all([
      client
        .from('leave_requests')
        .select('id, status, start_date, end_date, created_at, leave_types ( name )')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),

      client
        .from('timesheets')
        .select('id, work_date, status, updated_at')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'Submitted')
        .order('updated_at', { ascending: false })
        .limit(limit),
    ]);

    const fmtTime = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      if (diffDays === 0) return `Today, ${time}`;
      if (diffDays === 1) return `Yesterday, ${time}`;
      return `${diffDays} days ago`;
    };

    const fmtDate = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Leave request activities
    for (const lr of (leaveRes.data || [])) {
      const typeName = (lr as any).leave_types?.name || 'Leave';
      const range = `${fmtDate(lr.start_date)} – ${fmtDate(lr.end_date)}`;
      let desc = '';
      if (lr.status === 'pending') desc = `Requested ${typeName} for ${range}`;
      else if (lr.status === 'approved') desc = `${typeName} for ${range} was approved`;
      else if (lr.status === 'rejected') desc = `${typeName} for ${range} was declined`;
      else if (lr.status === 'withdrawn') desc = `Withdrew ${typeName} request for ${range}`;
      else desc = `${typeName} request updated (${lr.status})`;

      activities.push({
        id: `leave-${lr.id}`,
        timestamp: fmtTime(lr.created_at),
        description: desc,
        _sortDate: lr.created_at,
      });
    }

    // Timesheet submission activities (group by week)
    const seenWeeks = new Set<string>();
    for (const ts of (timesheetRes.data || [])) {
      const weekKey = ts.work_date?.slice(0, 7); // month-level dedup
      if (seenWeeks.has(weekKey)) continue;
      seenWeeks.add(weekKey);
      activities.push({
        id: `timesheet-${ts.id}`,
        timestamp: fmtTime(ts.updated_at || ts.work_date),
        description: `Submitted timesheet for week of ${fmtDate(ts.work_date)}`,
        _sortDate: ts.updated_at || ts.work_date,
      });
    }
  } catch (err: any) {
    console.error('[EmployeeDB] getEmployeeActivities error:', err?.message);
  }

  // Sort by most recent, limit
  activities.sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());
  return activities.slice(0, limit).map(({ _sortDate, ...a }) => a);
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
