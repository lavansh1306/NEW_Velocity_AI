import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Task, 
  LeaveRequest, 
  EmployeeProfile, 
  LeaveBalance 
} from '@/components/leave-management/types';

interface LeaveDataState {
  tasks: Task[];
  employees: EmployeeProfile[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  currentUser: EmployeeProfile | null;
  currentOrgId: string | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshTime: number;
}

export function useLeaveManagementData() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<LeaveDataState>({
    tasks: [],
    employees: [],
    leaves: [],
    balances: [],
    currentUser: null,
    currentOrgId: null,
    isLoading: true,
    error: null,
    lastRefreshTime: 0,
  });

  /**
   * Core Fetch Function
   * Strictly pulls from Supabase tables based on authenticated organization_id
   */
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Get the current user's profile and organization context
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, organization_id, email, name, role, capacity_hours_per_week, is_active')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error("User record not found in database. Ensure the user exists in the 'users' table.");
      }

      const orgId = userData.organization_id;

      // 2. Execute parallel queries for all module data
      const [leavesRes, balancesRes, tasksRes, employeesRes] = await Promise.all([
        // Fetch Leave Requests with related User and Leave Type names
        supabase
          .from('leave_requests')
          .select(`
            id, organization_id, user_id, leave_type_id, start_date, end_date, reason, status,
            users ( name ),
            leave_types ( name )
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false }),

        // Fetch Leave Balances for the current user
        supabase
          .from('employee_leave_balances')
          .select(`
            *,
            leave_types ( name, annual_quota )
          `)
          .eq('user_id', userData.id),

        // Fetch Tasks (Jira Issues) linked to the organization
        supabase
          .from('jira_issues')
          .select('*')
          .eq('organization_id', orgId),

        // Fetch all active employees in the organization
        supabase
          .from('users')
          .select('id, organization_id, email, name, role, capacity_hours_per_week, is_active')
          .eq('organization_id', orgId)
          .eq('is_active', true)
      ]);

      // Check for query errors
      if (leavesRes.error) throw leavesRes.error;
      if (balancesRes.error) throw balancesRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (employeesRes.error) throw employeesRes.error;

      // 3. Data Transformation / Mapping to Frontend Types
      const formattedLeaves: LeaveRequest[] = (leavesRes.data || []).map((l: any) => ({
        id: l.id,
        organization_id: l.organization_id,
        user_id: l.user_id,
        leave_type_id: l.leave_type_id,
        name: l.users?.name || 'Unknown User',
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason || '',
        status: l.status,
        leave_type_name: l.leave_types?.name || 'Unspecified'
      }));

      const formattedTasks: Task[] = (tasksRes.data || []).map((issue: any) => ({
        id: issue.id,
        projectName: issue.site_url || 'Internal Project',
        taskName: issue.summary,
        assignee: issue.assignee_email || 'Unassigned',
        hours: (issue.original_estimate_seconds || 0) / 3600,
        status: issue.status || 'Open',
        created_date: issue.created_at,
        due_date: issue.due_date
      }));

      // 4. Update State
      setState({
        tasks: formattedTasks,
        employees: employeesRes.data || [],
        leaves: formattedLeaves,
        balances: balancesRes.data || [],
        currentUser: userData as EmployeeProfile,
        currentOrgId: orgId,
        isLoading: false,
        error: null,
        lastRefreshTime: Date.now(),
      });

    } catch (err: any) {
      console.error('[LeaveManagementData Hook Error]:', err.message);
      setState(prev => ({ 
        ...prev, 
        error: err.message, 
        isLoading: false 
      }));
    }
  }, [user]);

  // Initial load when auth is ready
  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  /**
   * Action: Add Leave Request
   * Strictly uses active session IDs
   */
  const addLeaveRequest = useCallback(async (request: {
    startDate: string;
    endDate: string;
    reason: string;
    leave_type_id: string;
  }) => {
    if (!state.currentOrgId || !state.currentUser?.id) {
      throw new Error("Active organization session required.");
    }

    const { error } = await supabase.from('leave_requests').insert([{
      organization_id: state.currentOrgId,
      user_id: state.currentUser.id,
      leave_type_id: request.leave_type_id,
      start_date: request.startDate,
      end_date: request.endDate,
      reason: request.reason,
      status: 'pending' // Forced default for new requests
    }]);

    if (error) throw error;
    
    // Refresh full state to reflect new request and updated 'pending' balance
    await fetchData();
  }, [state.currentOrgId, state.currentUser, fetchData]);

  return { 
    ...state, 
    refresh: fetchData, 
    addLeaveRequest 
  };
}