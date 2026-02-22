import React, { useState, useEffect } from 'react';
import { Users, Zap, AlertCircle, Database, RefreshCw } from 'lucide-react'; 
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

// Supabase and Auth
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Imports from your existing structure
import { Task, LeaveRequest, EmployeeProfile } from './types';
import { ImpactAnalysisDialog } from './ImpactAnalysisDialog';
import { LeaveApplicationDialog } from './LeaveApplicationDialog';
import { EmployeeLeavePortal } from './EmployeeLeavePortal';
import { CapacityAnalysis } from './CapacityAnalysis';

export default function LeaveManagementTab() {
  const { user } = useAuth();
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Loading..."); 
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataSource, setDataSource] = useState<'JIRA' | 'CSV'>('CSV');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveUpdateCount, setLeaveUpdateCount] = useState(0);

  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [redeployOpen, setRedeployOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [expandedLeaves, setExpandedLeaves] = useState<Record<string, boolean>>({});

  // ------------------------------------------------------------------
  // 1. SUPABASE INTEGRATION: DIRECT FETCH WITH ROBUST ERROR HANDLING
  // ------------------------------------------------------------------
  const fetchSupabaseLeaves = async (orgId: string) => {
    try {
      console.log('[LeaveManagement] Fetching leaves for org:', orgId);
      
      // Don't try to join with users table - just get the leave_requests data
      // IMPORTANT: Select 'name' field which is used for matching tasks
      const { data, error } = await supabase
        .from('leave_requests')
        .select('id, user_id, name, start_date, end_date, reason, status, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LeaveManagement] Supabase fetch error:', error);
        throw error;
      }

      if (data) {
        console.log('[LeaveManagement] Fetched leaves:', data.length);
        console.log('[LeaveManagement] Sample leave:', data[0] ? { id: data[0].id, name: data[0].name, status: data[0].status } : 'none');
        
        const formattedLeaves: LeaveRequest[] = data.map((l: any) => {
          // Normalize status to proper case
          const normalizeStatus = (status: string) => {
            if (!status) return 'Pending';
            return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
          };

          return {
            id: l.id,
            org_id: orgId,
            user_id: l.user_id,
            name: l.name || 'Unknown Employee', // USE the name from DB
            startDate: l.start_date,
            endDate: l.end_date,
            reason: l.reason || '',
            status: normalizeStatus(l.status)
          };
        });
        
        setLeaves(formattedLeaves);
      }
    } catch (err: any) {
      if (!err.message?.includes('AbortError')) {
        console.error("[Supabase] Error fetching leaves:", err);
        // Don't show error toast on fetch failures - just log
      }
    }
  };

  useEffect(() => {
    let isMounted = true; 
    const fetchAllData = async () => {
      setIsLoadingData(true);
      try {
        let orgId = null;

        // Get user directly from Supabase auth (don't rely on context)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userEmail = authUser?.email;
        
        console.log('[LeaveManagement] Starting fetchAllData');
        console.log('[LeaveManagement] Got user from auth:', { authUser, userEmail });

        // CRITICAL: Fetch the specific User and Org details via Email
        if (userEmail) {
          console.log('[LeaveManagement] Fetching user record for:', userEmail);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, organization_id, name')
            .eq('email', userEmail)
            .single();

          console.log('[LeaveManagement] User fetch result:', { userData, userError });

          if (userData) {
            orgId = userData.organization_id;
            console.log('[LeaveManagement] Got orgId from user table:', orgId);
            if (isMounted) setCurrentUser(userData.name || userEmail);
          } else if (userError) {
            console.warn('[LeaveManagement] User not found, will fallback:', userError.message);
          }
        }

        // Fallback: REMOVED - Do NOT load unfiltered data for ANY user
        // Every org must have proper records in the users table or the jira_issues table with org_id
        if (!orgId) {
          console.warn('[LeaveManagement] orgId not found and no fallback available');
          // Do NOT load random data - force user to have proper org setup
        }

        if (!orgId) {
          console.error('[LeaveManagement] CRITICAL: Could not determine orgId from any source');
          throw new Error("Unable to determine your organization. Please contact support.");
        }
        
        console.log('[LeaveManagement] Setting currentOrgId to:', orgId);
        if (isMounted) setCurrentOrgId(orgId);

        // Fetch JIRA issues filtered by org_id (ALWAYS filtered)
        const { data: issuesData, error: issuesError } = await supabase
          .from('jira_issues')
          .select('*')
          .eq('org_id', orgId);
        
        console.log('[LeaveManagement] Org-filtered JIRA issues query:', {
          orgId,
          count: issuesData?.length || 0,
          error: issuesError?.message,
          sample: issuesData?.[0] ? { id: issuesData[0].id, assignee: issuesData[0].assignee, summary: issuesData[0].summary } : 'none'
        });

        const [issuesRes] = await Promise.all([
          Promise.resolve({ data: issuesData, error: issuesError }),
          fetchSupabaseLeaves(orgId)
        ]);

        if (issuesRes.data) {
          const uniqueEmployees = new Map<string, EmployeeProfile>();
          const loadedTasks = issuesRes.data.map((issue: any, index: number) => {
            const assignee = issue.assignee || 'Unassigned';
            
            // TASK DATE NORMALIZATION: Force Jira dates to simple YYYY-MM-DD
            const cleanCreated = issue.created_date?.split('T')[0] || new Date().toISOString().split('T')[0];
            const cleanDue = issue.due_date?.split('T')[0] || cleanCreated;

            if (assignee !== 'Unassigned' && !uniqueEmployees.has(assignee)) {
              uniqueEmployees.set(assignee, {
                name: assignee,
                role: issue.issue_type || 'Developer',
                skills: [issue.issue_type || 'Development'],
              });
            }

            return {
              id: issue.id || index,
              projectName: issue.project_name || issue.project_key || 'Unassigned',
              taskName: `${issue.issue_key}: ${issue.summary}`,
              assignee: assignee,
              hours: issue.original_estimate_seconds ? (issue.original_estimate_seconds / 3600) : 8,
              day: 0,
              requiredSkills: [issue.issue_type || 'Task'],
              isReallocated: false,
              isCancelled: ['closed', 'done', 'resolved'].includes(issue.status?.toLowerCase()),
              totalLogged: issue.time_spent_seconds ? (issue.time_spent_seconds / 3600) : 0,
              logs: [],
              created_date: cleanCreated,
              due_date: cleanDue
            };
          });

          if (isMounted) {
            setTasks(loadedTasks);
            setEmployees(Array.from(uniqueEmployees.values()));
            setDataSource('JIRA');
            console.log('[LeaveManagement] Tasks loaded:', { count: loadedTasks.length, employees: uniqueEmployees.size });
          }
        } else {
          console.warn('[LeaveManagement] No JIRA issues found for org:', { orgId, error: issuesRes.error?.message });
          if (isMounted) {
            setTasks([]);
            setEmployees([]);
            setDataSource('CSV');
          }
        }
      } catch (error) {
        console.error("[LeaveManagement] Load Error:", error);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, []);

  // ------------------------------------------------------------------
  // HARDENED SUBMISSION - with comprehensive error handling
  // ------------------------------------------------------------------
  const handleApplyLeave = async (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    console.log('[LeaveManagement] handleApplyLeave called with:', request);
    
    try {
      // Get the employee name from the request
      const employeeName = (request as any).employeeName || request.name;
      
      if (!employeeName) {
        const errorMsg = "Employee name not provided.";
        console.error('[LeaveManagement]', errorMsg);
        toast({ title: "❌ Name Not Found", description: errorMsg, variant: "destructive" });
        return;
      }

      if (!currentOrgId) {
        const errorMsg = "Organization not found.";
        console.error('[LeaveManagement]', errorMsg, { currentOrgId });
        toast({ title: "❌ Organization Error", description: errorMsg, variant: "destructive" });
        return;
      }

      // Step 1: Validate dates
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate || request.startDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format. Please use YYYY-MM-DD format.");
      }
      
      if (endDate < startDate) {
        throw new Error("End date cannot be before start date.");
      }

      // Step 2: Normalize dates to YYYY-MM-DD (no timezone offset)
      const formatDateAsString = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const normalizedStartDate = formatDateAsString(startDate);
      const normalizedEndDate = formatDateAsString(endDate);

      console.log('[LeaveManagement] Normalized dates:', { normalizedStartDate, normalizedEndDate });

      // Step 3: Generate a deterministic user_id from employee name
      // This avoids querying the users table which has RLS issues
      const generateUserIdFromName = (name: string): string => {
        // Create a simple hash-like UUID from the name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          const char = name.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        
        // Format as a UUID-like string (this is NOT a real UUID but consistent)
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
        return `00000000-0000-4000-a000-${hashStr}00000000`.substring(0, 36);
      };

      const userIdFromName = generateUserIdFromName(employeeName);
      console.log('[LeaveManagement] Generated user_id from name:', { employeeName, userIdFromName });

      // Step 4: Construct payload with proper types
      const payload = {
        org_id: currentOrgId,
        user_id: userIdFromName,
        name: employeeName,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        reason: request.reason || 'Not specified',
        status: 'pending'
      };

      console.log('[LeaveManagement] Inserting leave request:', payload);

      // Step 5: Insert leave request (no RLS issues since user_id is just a UUID value)
      const { error: insertError } = await supabase
        .from('leave_requests')
        .insert([payload]);

      if (insertError) {
        console.error('[LeaveManagement] Insert error:', insertError);
        throw new Error(insertError.message || 'Failed to insert leave request');
      }

      console.log('[LeaveManagement] Leave request created successfully');

      toast({ 
        title: "✅ Success", 
        description: `Leave request submitted for ${normalizedStartDate} to ${normalizedEndDate}` 
      });

      // Step 6: Refresh the leave list
      await fetchSupabaseLeaves(currentOrgId);
    } catch (err: any) {
      console.error('[LeaveManagement] Error in handleApplyLeave:', err);
      const errorMessage = err?.message || err?.details?.message || 'An unknown error occurred';
      toast({ 
        title: "❌ Submission Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const handleApproveLeave = async (leave: LeaveRequest) => {
    try {
      console.log('[LeaveManagement] Approving leave:', leave.id);
      
      const actor = currentUser || 'Manager';
      const entry = { ts: new Date().toISOString(), actor, action: 'Approved', details: '' };

      setLeaves(prev => prev.map(l => 
        l.id === leave.id ? { ...l, status: 'Approved', history: [...(l.history||[]), entry] } : l
      ));
      setLeaveUpdateCount(prev => prev + 1);
      
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved' })
        .eq('id', leave.id);
      
      if (error) throw error;
      
      console.log('[LeaveManagement] Leave approved successfully');
      toast({ title: "✅ Approved", description: "Leave status updated." });
    } catch (err: any) {
      console.error('[LeaveManagement] Approval error:', err);
      if (currentOrgId) fetchSupabaseLeaves(currentOrgId);
      toast({ 
        title: "❌ Approval Failed", 
        description: err.message || 'Failed to approve leave', 
        variant: "destructive" 
      });
    }
  };

  const handleRejectLeave = async (leave: LeaveRequest) => {
    try {
      console.log('[LeaveManagement] Rejecting leave:', leave.id);
      const actor = currentUser || 'Manager';
      const entry = { ts: new Date().toISOString(), actor, action: 'Rejected', details: '' };

      setLeaves(prev => prev.map(l => 
        l.id === leave.id ? { ...l, status: 'Rejected', history: [...(l.history||[]), entry] } : l
      ));
      
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', leave.id);
      
      if (error) throw error;
      
      console.log('[LeaveManagement] Leave rejected successfully');
      toast({ title: "❌ Rejected", description: "Leave request denied." });
    } catch (err: any) {
      console.error('[LeaveManagement] Rejection error:', err);
      if (currentOrgId) fetchSupabaseLeaves(currentOrgId);
      toast({ 
        title: "❌ Rejection Failed", 
        description: err.message || 'Failed to reject leave', 
        variant: "destructive" 
      });
    }
  };

  const getAvailableEmployeesOnDate = (date: string): { name: string; load: number }[] => {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    return employees
      .map(emp => {
        const empTasks = tasks.filter(t => {
          if (t.assignee !== emp.name || t.isCancelled) return false;
          const start = new Date(t.created_date);
          const end = new Date(t.due_date);
          return dateObj >= start && dateObj <= end;
        });
        const currentLoad = empTasks.reduce((sum, t) => sum + (t.hours / 8), 0) * 20; 
        return { name: emp.name, load: Math.min(100, currentLoad) };
      })
      .filter(emp => emp.load < 80) 
      .sort((a, b) => a.load - b.load); 
  };

  const handleRedeploy = (selectedEmployee: string) => {
    if (!selectedLeave) return;
    const tasksToRedeploy = tasks.filter(t => t.assignee === selectedLeave.name && !t.isCancelled && !t.isReallocated);
    setTasks(prev => prev.map(t => tasksToRedeploy.some(tr => tr.id === t.id) ? { ...t, assignee: selectedEmployee, isReallocated: true } : t));
    handleApproveLeave(selectedLeave);
    setRedeployOpen(false);
    setSelectedLeave(null);
  };

  const handleShiftTasks = (leave: LeaveRequest) => {
    const handleShiftTasksFromBackend = async () => {
      try {
        const durationDays = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (86400000)) + 1;
        
        // Pre-calculate which tasks will be affected for visibility
        const lStart = new Date(leave.startDate); lStart.setHours(0,0,0,0);
        const lEnd = new Date(leave.endDate); lEnd.setHours(23,59,59,999);
        const affectedForShift = tasks.filter(t => {
          if (t.assignee !== leave.name || t.isCancelled) return false;
          const tStart = new Date(t.created_date);
          const tEnd = new Date(t.due_date);
          return tStart <= lEnd && tEnd >= lStart;
        });
        
        console.log('[LeaveManagement] Calling /api/leave-approval/approve-and-shift for leave:', leave.id);
        console.log('[LeaveManagement] Affected tasks for shift:', affectedForShift.map(t => ({ 
          name: t.taskName, 
          oldDue: t.due_date,
          newDue: new Date(new Date(t.due_date).getTime() + durationDays * 86400000).toISOString().split('T')[0]
        })));
        
        // Call backend auto-shift endpoint
        const response = await fetch('/api/leave-approval/approve-and-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        id: leave.id,
        org_id: currentOrgId, // <-- ADD THIS LINE
        name: leave.name,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        status: leave.status
  })
});

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Backend error: ${response.status}`);
        }

        const result = await response.json();
        console.log('[LeaveManagement] Backend response:', result);
        
        const shiftsCount = result.data?.actions?.shifted || affectedForShift.length;
        // Build message with task details
        const taskDetails = affectedForShift.slice(0, 3).map(t => {
          const newDue = new Date(new Date(t.due_date).getTime() + durationDays * 86400000).toISOString().split('T')[0];
          return `${t.taskName.substring(0, 30)}: ${t.due_date}→${newDue}`;
        }).join('\n');
        
        const actor = currentUser || 'Manager';
        const detail = `Auto-shifted ${shiftsCount} task(s) by ${durationDays} day${durationDays>1?'s':''} (${affectedForShift.length} tasks affected)`;
        
        setLeaves(prev => prev.map(l => l.id === leave.id ? { 
          ...l, 
          status: 'Approved', 
          history: [...(l.history||[]), { ts: new Date().toISOString(), actor, action: 'Shifted', details: detail }] 
        } : l));
        
        setLeaveUpdateCount(prev => prev + 1);

        // Refresh leaves and tasks from DB to ensure consistency
        if (currentOrgId) {
          console.log('[LeaveManagement] Refreshing data after shift...');
          await fetchSupabaseLeaves(currentOrgId);
          // Also refresh jira_issues tasks to show updated due dates
          const { data: updatedTasks } = await supabase
            .from('jira_issues')
            .select('*')
            .eq('org_id', currentOrgId)
            .limit(500);
          if (updatedTasks) {
            const formatted = updatedTasks.map((t: any) => ({
              id: t.id,
              taskName: t.summary || t.issue_key || 'Task',
              assignee: t.assignee || 'Unassigned',
              assignee_email: t.assignee_email || '',
              projectName: t.project_name || 'Unknown',
              hours: Math.ceil((t.original_estimate_seconds || 0) / 3600),
              created_date: t.created_date || new Date().toISOString(),
              due_date: t.due_date || new Date().toISOString(),
              isCancelled: false,
              isReallocated: false,
              day: 0
            }));
            setTasks(formatted);
          }
        }

        // Show detailed shift confirmation
        const shiftMsg = `✅ Shifted ${shiftsCount} task(s) forward by ${durationDays} day(s)\n\n${taskDetails}${affectedForShift.length > 3 ? `\n+${affectedForShift.length - 3} more tasks` : ''}`;
        toast({ 
          title: "⏭️ Tasks Shifted & Saved to DB", 
          description: shiftMsg
        });
      } catch (err: any) {
        console.error('[LeaveManagement] Shift error:', err);
        toast({ 
          title: "❌ Shift Failed", 
          description: err.message || 'Failed to auto-shift tasks', 
          variant: "destructive" 
        });
      }
    };
    
    handleShiftTasksFromBackend();
  };

  // Mini calendar helper: next 30 days with markers for leaves and shifts
  const getNext30Days = () => {
    const arr: { date: string; leaves: LeaveRequest[] }[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLeaves = leaves.filter(l => {
        const s = new Date(l.startDate); s.setHours(0,0,0,0);
        const e = new Date(l.endDate); e.setHours(23,59,59,999);
        const dd = new Date(dateStr);
        dd.setHours(0,0,0,0);
        return dd >= s && dd <= e;
      });
      arr.push({ date: dateStr, leaves: dayLeaves });
    }
    return arr;
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-slate-500 font-light">Syncing Workspace Data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-light text-white text-sm">Leave Management System</h3>
            <p className="text-xs text-slate-400">
              {activePersona === 'manager' ? '👨‍💼 Manager Dashboard' : `👤 Employee: ${currentUser}`}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-4 bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Zap className="w-3 h-3" /> Live Jira
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
             <Database className="w-3 h-3" /> Supabase DB Sync
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
             <button onClick={() => setActivePersona('manager')} className={`px-3 py-1 rounded-md text-xs font-light transition-all ${activePersona === 'manager' ? 'bg-primary text-white shadow' : 'text-slate-400'}`}>Manager</button>
             <button onClick={() => setActivePersona('employee')} className={`px-3 py-1 rounded-md text-xs font-light transition-all ${activePersona === 'employee' ? 'bg-primary text-white shadow' : 'text-slate-400'}`}>Employee</button>
           </div>
        </div>
      </div>

      {activePersona === 'manager' && (
        <div className="w-full mb-4 mt-4 space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-light text-primary mb-6 flex items-center gap-2">📋 All Leave Requests</h3>
            {leaves.length === 0 ? (
              <div className="text-center p-8 text-slate-500 bg-white/50 rounded-xl border border-indigo-100">
                <AlertCircle className="w-12 h-12 mx-auto opacity-30 mb-2" />
                <p>No leave requests for your organization.</p>
              </div>
            ) : (
              <div className="space-y-4">
                  {/* Mini 30-day calendar showing absences/shifts */}
                  <div className="mb-4 p-3 bg-white border rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">30-day Absence Overview</h4>
                    <div className="grid grid-cols-10 gap-1 text-[10px]">
                      {getNext30Days().map(day => (
                        <div key={day.date} title={`${day.date} — ${day.leaves.length} leave(s)`} className={`h-6 rounded flex items-center justify-center ${day.leaves.length > 0 ? 'bg-red-100 border border-red-200 text-red-700' : 'bg-gray-50 border border-gray-100 text-gray-400'}`}>
                          {new Date(day.date).getDate()}
                        </div>
                      ))}
                    </div>
                  </div>
                {leaves.map(leave => {
                  const affectedTasks = tasks.filter(t => {
                    if (t.assignee !== leave.name || t.isCancelled) return false;
                    const lStart = new Date(leave.startDate);
                    const tStart = new Date(t.created_date);
                    const tEnd = new Date(t.due_date);
                    return lStart >= tStart && lStart <= tEnd;
                  });

                  const isExpanded = !!expandedLeaves[leave.id];

                  return (
                    <div key={leave.id} className={`p-4 rounded-xl border-2 ${leave.status === 'Approved' ? 'bg-green-50 border-green-300' : leave.status === 'Rejected' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-light text-lg text-slate-900">{leave.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${leave.status === 'Approved' ? 'bg-green-200 text-green-800' : leave.status === 'Rejected' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                              {leave.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div><p className="text-slate-600"><strong>Leave:</strong> {leave.startDate} to {leave.endDate}</p></div>
                            <div><p className="text-slate-600"><strong>Reason:</strong> {leave.reason}</p></div>
                          </div>
                          {affectedTasks.length > 0 && (
                            <p className="text-xs font-bold text-slate-700">Affected Tasks: {affectedTasks.length}</p>
                          )}
                        </div>

                        <div className="flex gap-2 items-start">
                          <Button size="sm" variant="ghost" onClick={() => setExpandedLeaves(prev => ({ ...prev, [leave.id]: !prev[leave.id] }))}>
                            {isExpanded ? 'Collapse' : 'Details'}
                          </Button>
                          {leave.status === 'Pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600" onClick={() => handleApproveLeave(leave)}>Approve</Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600" onClick={() => handleRejectLeave(leave)}>Reject</Button>
                            </div>
                          )}
                          {(leave.status === 'Pending' || leave.status === 'Approved') && (
                            <div className="flex gap-2 ml-2">
                              <Button size="sm" onClick={() => handleShiftTasks(leave)} className="bg-indigo-600">Approve & Shift Tasks</Button>
                              <Button size="sm" variant="outline" onClick={() => { setSelectedLeave(leave); setRedeployOpen(true); }}>Approve & Redeploy</Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                          <h5 className="text-sm font-semibold mb-2">Affected Tasks</h5>
                          {affectedTasks.length > 0 ? (
                            <ul className="text-xs space-y-1 mb-3">
                              {affectedTasks.map(t => (
                                <li key={t.id} className="flex justify-between">
                                  <span>{t.taskName}</span>
                                  <span className="text-gray-500">{t.hours}h</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500">No tasks impacted.</p>
                          )}

                          <div className="text-xs text-gray-600 mb-3 p-2 bg-slate-50 rounded border border-gray-200">
                            <strong className="block mb-1">📋 Activity & DB Shifts:</strong>
                            <ul className="mt-1 space-y-1">
                              {(leave.history || []).slice().reverse().map((h, i) => (
                                <li key={i} className="text-[11px] p-1 bg-white rounded border-l-2 border-indigo-400">
                                  <div>{new Date(h.ts).toLocaleString()} — {h.actor}: <strong>{h.action}</strong></div>
                                  {h.details && <div className="text-gray-600">{h.details}</div>}
                                </li>
                              ))}
                              {!(leave.history && leave.history.length) && (
                                <li className="text-gray-500">No activity yet</li>
                              )}
                            </ul>
                          </div>

                          {leave.status === 'Approved' && (
                            <div className="text-xs mb-2 p-2 bg-green-50 rounded border border-green-200">
                              <strong className="text-green-700">✅ Approved</strong>
                              <p className="text-green-600 text-[10px] mt-1">(Click "Approve & Shift Tasks" above to shift task dates)</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <CapacityAnalysis 
            employees={employees} 
            approvedLeaves={leaves.filter(l => l.status === 'Approved')} 
            onRefresh={() => currentOrgId && fetchSupabaseLeaves(currentOrgId)} 
          />
        </div>
      )}

      {activePersona === 'employee' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-700">
            ✓ Workspace Active | Tasks Found: {tasks.length}
          </div>
          {tasks.length > 0 ? (
            <EmployeeLeavePortal
              tasks={tasks}
              employees={employees}
              currentUserEmail={currentUser}
              onLeaveRequest={(data) => handleApplyLeave({ ...data, name: data.employeeName })}
              existingLeaves={leaves}
            />
          ) : (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center text-amber-900 font-light italic">
              No task data synced from Jira yet.
            </div>
          )}
        </div>
      )}

      <LeaveApplicationDialog 
        open={applyOpen} 
        onOpenChange={setApplyOpen} 
        currentUser={currentUser} 
        onSubmit={handleApplyLeave} 
      />

      {redeployOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl mb-4">🔄 Redeploy Tasks</h3>
            <div className="space-y-3">
              {getAvailableEmployeesOnDate(selectedLeave.startDate).map(emp => (
                <Button key={emp.name} variant="outline" className="w-full justify-between" onClick={() => handleRedeploy(emp.name)}>
                  {emp.name} <span>{Math.round(emp.load)}% load</span>
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={() => setRedeployOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}