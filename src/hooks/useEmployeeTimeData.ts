/**
 * Hook for employee time data.
 * Fetches leave requests, types, balances, and holidays from the backend API.
 * Includes a fallback to mock data when the user is not yet fully in the system.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/employeeTimeApi';
import { toast } from 'sonner';
import { 
  timesheetWeeks as mockTimesheetWeeks, 
  pastWeeksSummary as mockPastWeeks,
} from '@/data/mockData';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';
import type { TimesheetWeekMeta, PastWeekSummary, WeekRowData } from '@/types';

// ---------- Types ----------

export interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  leave_type_id: string;
  leave_type_name: string | null;
  created_at: string;
}

export interface LeaveType {
  id: string;
  name: string;
  default_days: number;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  leave_type_id: string;
  leave_type_name: string | null;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
}

export interface UseEmployeeTimeDataReturn {
  // Data
  leaveRequests: LeaveRequest[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  holidays: Holiday[];
  timesheetWeeks: Record<number, TimesheetWeekMeta>;
  pastWeeksSummary: PastWeekSummary[];
  currentWeekOffset: number;

  // State
  loading: boolean;
  error: string | null;
  isMockData: boolean;

  // Actions
  refetch: () => Promise<void>;
  createLeaveRequest: (payload: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }) => Promise<boolean>;
  withdrawLeaveRequest: (requestId: string) => Promise<boolean>;
  setWeekOffset: (offset: number) => void;
  saveTimesheetEntry: (payload: any) => Promise<boolean>;
  submitTimesheet: (offset: number) => Promise<boolean>;
}

// ---------- Hook ----------

export function useEmployeeTimeData(): UseEmployeeTimeDataReturn {
  const { session, orgId } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [timesheetWeeks, setTimesheetWeeks] = useState<Record<number, TimesheetWeekMeta>>({});
  const [pastWeeksSummary, setPastWeeksSummary] = useState<PastWeekSummary[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  const fetchAll = useCallback(async () => {
    // If no session or orgId, we are definitely showing mock data or nothing
    if (!session?.access_token || !orgId) {
      setIsMockData(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [reqData, typesData, balancesData, holidaysData] = await Promise.all([
        api.fetchLeaveRequests(),
        api.fetchLeaveTypes(),
        api.fetchLeaveBalances(),
        api.fetchHolidays(),
      ]);

      setLeaveRequests(reqData || []);
      setLeaveTypes(typesData || []);
      setLeaveBalances(balancesData || []);
      setHolidays(holidaysData || []);
      console.log(`[useEmployeeTimeData] Holidays fetched: ${holidaysData?.length || 0}`);
      
      setIsMockData(false);
    } catch (err: any) {
      console.error('[useEmployeeTimeData] Fetch error:', err?.message || err);
      if (err?.status === 403 || err?.message?.includes('403')) {
        setIsMockData(true);
        setTimesheetWeeks(mockTimesheetWeeks);
        setPastWeeksSummary(mockPastWeeks);
      } else {
        setError(err?.message || 'Failed to load time data');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, orgId]);

  const fetchTimesheetForOffset = useCallback(async (offset: number) => {
    if (isMockData) return;
    setTimesheetLoading(true);
    try {
      const monday = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 });
      const sunday = endOfWeek(monday, { weekStartsOn: 1 });
      const startStr = format(monday, 'yyyy-MM-dd');
      const endStr = format(sunday, 'yyyy-MM-dd');

      const entries = await api.fetchTimesheetEntries(startStr, endStr);
      
      // Aggregate entries into rows (grouped by project/task)
      const rowsMap: Record<string, WeekRowData> = {};
      let weekStatus = 'Draft';

      entries.forEach((entry: any) => {
        const key = `${entry.project_id || 'no-proj'}-${entry.task_name || entry.description || 'no-task'}`;
        if (!rowsMap[key]) {
          rowsMap[key] = {
            id: entry.id, // Primary ID for one of the entries
            type: entry.project_id ? 'project' : 'adhoc',
            project: entry.project_id || 'Manual Entry',
            task: entry.task_name || entry.description || 'Activity',
            suggested: [0, 0, 0, 0, 0, 0, 0],
            hours: [0, 0, 0, 0, 0, 0, 0]
          };
        }
        
        // Map work_date to day index (0=Mon, 6=Sun)
        const date = new Date(entry.work_date);
        const dayIndex = (date.getDay() + 6) % 7;
        rowsMap[key].hours[dayIndex] = Number(entry.hours_logged);
        
        // If any entry is submitted, mark the week as such (simple logic)
        if (entry.status !== 'Draft') {
          weekStatus = entry.status;
        }
      });

      setTimesheetWeeks(prev => ({
        ...prev,
        [offset]: {
          status: weekStatus,
          rows: Object.values(rowsMap)
        }
      }));

      // Update past summary (simplified: just this week for now)
      setPastWeeksSummary(prev => {
        const existingOffset = prev.findIndex(p => p.offset === offset);
        const totalHours = Object.values(rowsMap).reduce((sum, r) => sum + r.hours.reduce((a, b) => a + b, 0), 0);
        const newSummary: PastWeekSummary = {
          offset,
          label: offset === 0 ? 'This Week' : `Week of ${format(monday, 'MMM d')}`,
          hours: totalHours,
          status: weekStatus as any
        };
        
        if (existingOffset >= 0) {
          const updated = [...prev];
          updated[existingOffset] = newSummary;
          return updated;
        }
        return [...prev, newSummary].sort((a, b) => b.offset - a.offset);
      });

    } catch (err: any) {
      console.error('[useEmployeeTimeData] Timesheet fetch error:', err);
    } finally {
      setTimesheetLoading(false);
    }
  }, [isMockData]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isMockData && session?.access_token) {
      fetchTimesheetForOffset(currentWeekOffset);
    }
  }, [currentWeekOffset, isMockData, session?.access_token, fetchTimesheetForOffset]);

  const createLeaveRequest = useCallback(
    async (payload: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }): Promise<boolean> => {
      if (isMockData) {
        toast.error('Cannot submit request in Demo/Mock mode');
        return false;
      }
      try {
        await api.submitLeaveRequest(payload);
        await fetchAll();
        return true;
      } catch (err: any) {
        console.error('[useEmployeeTimeData] Create error:', err?.message || err);
        setError(err?.message || 'Failed to create leave request');
        return false;
      }
    },
    [fetchAll, isMockData],
  );

  const handleWithdraw = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (isMockData) return false;
      try {
        await api.withdrawLeaveRequest(requestId);
        await fetchAll();
        return true;
      } catch (err: any) {
        console.error('[useEmployeeTimeData] Withdraw error:', err?.message || err);
        setError(err?.message || 'Failed to withdraw leave request');
        return false;
      }
    },
    [fetchAll, isMockData],
  );

  const saveTimesheetEntry = useCallback(async (payload: any) => {
    if (isMockData) return false;
    try {
      await api.upsertTimesheetEntry(payload);
      await fetchTimesheetForOffset(currentWeekOffset);
      return true;
    } catch (err: any) {
      toast.error('Failed to save entry');
      return false;
    }
  }, [isMockData, currentWeekOffset, fetchTimesheetForOffset]);

  const submitTimesheet = useCallback(async (offset: number) => {
    if (isMockData) return false;
    try {
      const monday = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 });
      const sunday = endOfWeek(monday, { weekStartsOn: 1 });
      const startStr = format(monday, 'yyyy-MM-dd');
      const endStr = format(sunday, 'yyyy-MM-dd');

      await api.submitTimesheet(startStr, endStr);
      await fetchTimesheetForOffset(offset);
      toast.success('Timesheet submitted!');
      return true;
    } catch (err: any) {
      toast.error('Failed to submit timesheet');
      return false;
    }
  }, [isMockData, fetchTimesheetForOffset]);

  return {
    leaveRequests,
    leaveTypes,
    leaveBalances,
    holidays,
    timesheetWeeks,
    pastWeeksSummary,
    currentWeekOffset,
    loading: loading || timesheetLoading,
    error,
    isMockData,
    refetch: fetchAll,
    createLeaveRequest,
    withdrawLeaveRequest: handleWithdraw,
    setWeekOffset: setCurrentWeekOffset,
    saveTimesheetEntry,
    submitTimesheet,
  };
}
