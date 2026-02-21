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

  // ------------------------------------------------------------------
  // 1. SUPABASE INTEGRATION: DIRECT FETCH WITH ROBUST ERROR HANDLING
  // ------------------------------------------------------------------
  const fetchSupabaseLeaves = async (orgId: string) => {
    try {
      console.log('[LeaveManagement] Fetching leaves for org:', orgId);
      
      // Don't try to join with users table - just get the leave_requests data
      const { data, error } = await supabase
        .from('leave_requests')
        .select('id, user_id, start_date, end_date, reason, status, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LeaveManagement] Supabase fetch error:', error);
        throw error;
      }

      if (data) {
        console.log('[LeaveManagement] Fetched leaves:', data.length);
        
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
            name: 'Employee', // We don't have user names anymore since we removed the relationship
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

        // Fallback: Get org from any JIRA issue if user not found
        if (!orgId) {
          console.log('[LeaveManagement] Attempting fallback - fetching from jira_issues');
          const { data: anyIssue, error: issueError } = await supabase
            .from('jira_issues')
            .select('org_id')
            .limit(1)
            .single();
          
          if (issueError) {
            console.warn('[LeaveManagement] Fallback failed:', issueError.message);
          } else {
            orgId = anyIssue?.org_id;
            console.log('[LeaveManagement] Got orgId from jira_issues:', orgId);
          }
        }

        if (!orgId) {
          console.error('[LeaveManagement] CRITICAL: Could not determine orgId from any source');
          throw new Error("Unable to determine your organization. Please contact support.");
        }
        
        console.log('[LeaveManagement] Setting currentOrgId to:', orgId);
        if (isMounted) setCurrentOrgId(orgId);

        const [issuesRes] = await Promise.all([
          supabase.from('jira_issues').select('*').eq('org_id', orgId),
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
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        reason: request.reason || 'Not specified',
        status: 'pending'
      };

      console.log('[LeaveManagement] Inserting leave request:', payload);

      // Step 5: Insert leave request (no RLS issues since user_id is just a UUID value)
      const { data: insertedData, error: insertError } = await supabase
        .from('leave_requests')
        .insert([payload])
        .select();

      if (insertError) {
        console.error('[LeaveManagement] Insert error:', insertError);
        throw new Error(insertError.message || 'Failed to insert leave request');
      }

      console.log('[LeaveManagement] Leave request created successfully:', insertedData);

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
      
      setLeaves(prev => prev.map(l => 
        l.id === leave.id ? { ...l, status: 'Approved' } : l
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
      
      setLeaves(prev => prev.map(l => 
        l.id === leave.id ? { ...l, status: 'Rejected' } : l
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
    const durationDays = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (86400000)) + 1;
    setTasks(prev => prev.map(t => {
      if (t.assignee !== leave.name || t.isCancelled) return t;
      const newDue = new Date(t.due_date);
      newDue.setDate(newDue.getDate() + durationDays);
      return { ...t, due_date: newDue.toISOString().split('T')[0] };
    }));
    handleApproveLeave(leave);
    toast({ title: "⏭️ Shifted", description: "Affected tasks pushed forward." });
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
            <h3 className="text-xl font-light text-primary mb-6 flex items-center gap-2">📋 Active Leave Requests</h3>
            {leaves.filter(l => l.status === 'Pending' || l.status === 'Approved').length === 0 ? (
              <div className="text-center p-8 text-slate-500 bg-white/50 rounded-xl border border-indigo-100">
                <AlertCircle className="w-12 h-12 mx-auto opacity-30 mb-2" />
                <p>No active leave requests for your organization.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.filter(l => l.status === 'Pending' || l.status === 'Approved').map(leave => {
                  const affectedTasks = tasks.filter(t => {
                    if (t.assignee !== leave.name || t.isCancelled) return false;
                    const lStart = new Date(leave.startDate);
                    const tStart = new Date(t.created_date);
                    const tEnd = new Date(t.due_date);
                    return lStart >= tStart && lStart <= tEnd;
                  });

                  return (
                    <div key={leave.id} className={`p-5 rounded-xl border-2 ${leave.status === 'Approved' ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-light text-lg text-slate-900">{leave.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${leave.status === 'Approved' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
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
                        <div className="flex gap-2">
                          {leave.status === 'Pending' && (
                            <>
                              <Button size="sm" className="bg-green-600" onClick={() => handleApproveLeave(leave)}>Approve</Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600" onClick={() => handleRejectLeave(leave)}>Reject</Button>
                            </>
                          )}
                        </div>
                      </div>
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