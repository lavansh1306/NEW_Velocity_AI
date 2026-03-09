import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Task, LeaveRequest, EmployeeProfile, LeaveBalance } from '@/components/leave-management/types';

interface LeaveDataState {
  tasks: Task[];
  employees: EmployeeProfile[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  currentUser: string;
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
    currentUser: 'Loading...',
    currentOrgId: null,
    isLoading: true,
    error: null,
    lastRefreshTime: 0,
  });

  const isMountedRef = useRef(true);

  /**
   * Fetch Leave Balances & Requests
   */
  const fetchLeaveSystemData = useCallback(async (orgId: string, userId: string) => {
    try {
      // 1. Fetch Requests with Joins
      const { data: requestData, error: reqError } = await supabase
        .from('leave_requests')
        .select(`
          id, organization_id, user_id, leave_type_id, start_date, end_date, reason, status,
          users ( name ),
          leave_types ( name )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;

      // 2. Fetch User Balances
      const { data: balanceData, error: balError } = await supabase
        .from('employee_leave_balances')
        .select(`
          id, leave_type_id, total_allocated, used_days, pending_days,
          leave_types ( name, annual_quota )
        `)
        .eq('user_id', userId);

      if (balError) throw balError;

      const formattedLeaves: LeaveRequest[] = (requestData || []).map((l: any) => ({
        id: l.id,
        organization_id: l.organization_id,
        user_id: l.user_id,
        leave_type_id: l.leave_type_id,
        name: l.users?.name || 'Unknown',
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason || '',
        status: l.status,
        leave_type_name: l.leave_types?.name
      }));

      return { leaves: formattedLeaves, balances: balanceData || [] };
    } catch (err) {
      console.error('[LeaveData] Fetch Error:', err);
      return { leaves: [], balances: [] };
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Get current user's DB record to find their organization_id
        const { data: dbUser, error: userError } = await supabase
          .from('users')
          .select('id, organization_id, name')
          .eq('id', user?.id) // Using auth.uid()
          .single();

        if (userError || !dbUser) throw new Error('User or Organization not found');

        const orgId = dbUser.organization_id;
        
        // Fetch Jira tasks and Leave data in parallel
        const [tasksRes, leaveData] = await Promise.all([
          supabase.from('jira_issues').select('*').eq('organization_id', orgId),
          fetchLeaveSystemData(orgId, dbUser.id)
        ]);

        // Map Jira issues to Task interface
        const loadedTasks = (tasksRes.data || []).map((issue: any) => ({
          id: issue.id,
          projectName: issue.site_url || 'Jira Project',
          taskName: issue.summary,
          assignee: issue.assignee_email,
          hours: issue.original_estimate_seconds / 3600 || 0,
          day: 0,
          requiredSkills: [issue.priority],
          isCancelled: issue.status === 'Done'
        }));

        setState(prev => ({
          ...prev,
          currentOrgId: orgId,
          currentUser: dbUser.name,
          tasks: loadedTasks,
          leaves: leaveData.leaves,
          balances: leaveData.balances,
          isLoading: false,
          lastRefreshTime: Date.now()
        }));

      } catch (err: any) {
        setState(prev => ({ ...prev, error: err.message, isLoading: false }));
      }
    };

    init();
  }, [user, authLoading, fetchLeaveSystemData]);

  const addLeaveRequest = useCallback(async (request: {
    startDate: string;
    endDate: string;
    reason: string;
    leave_type_id: string;
  }) => {
    if (!state.currentOrgId || !user?.id) return;

    const { error } = await supabase.from('leave_requests').insert([{
      organization_id: state.currentOrgId,
      user_id: user.id,
      leave_type_id: request.leave_type_id,
      start_date: request.startDate,
      end_date: request.endDate,
      reason: request.reason,
      status: 'pending'
    }]);

    if (error) throw error;
    
    // Refresh only the leave part of the state
    const newData = await fetchLeaveSystemData(state.currentOrgId, user.id);
    setState(prev => ({ ...prev, ...newData }));
  }, [state.currentOrgId, user, fetchLeaveSystemData]);

  return { ...state, addLeaveRequest };
}