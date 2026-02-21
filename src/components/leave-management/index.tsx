import React, { useState, useEffect } from 'react';
import { Users, Zap, AlertCircle, Database, RefreshCw } from 'lucide-react'; 
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

// Supabase and Auth
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Imports from your existing structure
import { Task, LeaveRequest, TimeLog, EmployeeProfile } from './types';
import { ImpactAnalysisDialog } from './ImpactAnalysisDialog';
import { TimeLoggingDialog } from './TimeLoggingDialog';
import { TimesheetUploadDialog } from './TimeSheetUploadDialog';
import { LeaveApplicationDialog } from './LeaveApplicationDialog';
import { EmployeeLeavePortal } from './EmployeeLeavePortal';
import { CapacityAnalysis } from './CapacityAnalysis';

export default function LeaveManagementTab() {
  const { user } = useAuth();
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Aarav Sharma"); 
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataSource, setDataSource] = useState<'JIRA' | 'CSV'>('CSV');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveUpdateCount, setLeaveUpdateCount] = useState(0);

  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [redeployOpen, setRedeployOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  // ------------------------------------------------------------------
  // 1. SUPABASE INTEGRATION: DIRECT FETCH
  // ------------------------------------------------------------------
  const fetchSupabaseLeaves = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          start_date,
          end_date,
          reason,
          status,
          users ( name, email )
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedLeaves: LeaveRequest[] = data.map((l: any) => ({
          id: l.id,
          name: l.users?.name || l.users?.email || 'Unknown User',
          startDate: l.start_date,
          endDate: l.end_date,
          reason: l.reason,
          status: l.status ? (l.status.charAt(0).toUpperCase() + l.status.slice(1)) : 'Pending'
        }));
        setLeaves(formattedLeaves);
      }
    } catch (err: any) {
      if (!err.message?.includes('AbortError')) {
        console.error("[Supabase] Error fetching leaves:", err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true; 

    const fetchAllData = async () => {
      setIsLoadingData(true);

      let loadedTasks: Task[] = [];
      let loadedEmployees: EmployeeProfile[] = [];
      let source: 'JIRA' | 'CSV' = 'CSV';

      const getStableDay = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash) % 5;
      };

      try {
        let orgId = null;

        // 1. Try to find the user's explicit org from their email
        if (user?.email) {
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id, name')
            .eq('email', user.email)
            .single();

          if (userData?.organization_id) {
            orgId = userData.organization_id;
            if (isMounted) setCurrentUser(userData.name || user.email);
          }
        }

        // 2. FAILSAFE: If user isn't fully linked in DB yet, grab ANY org that has Jira issues
        if (!orgId) {
          console.log("[LeaveManagement] Using global org fallback to ensure data loads...");
          const { data: anyIssue } = await supabase
            .from('jira_issues')
            .select('org_id')
            .limit(1)
            .single();
            
          if (anyIssue?.org_id) {
            orgId = anyIssue.org_id;
          }
        }

        if (!orgId) {
           console.warn("[LeaveManagement] Database is entirely empty.");
           throw new Error("Empty DB");
        }

        if (isMounted) {
          setCurrentOrgId(orgId);
        }

        // 3. Fetch Tasks and Leaves from Supabase in Parallel
        const [issuesRes, leavesRes] = await Promise.all([
          supabase.from('jira_issues').select('*').eq('org_id', orgId),
          fetchSupabaseLeaves(orgId)
        ]);

        if (issuesRes.error && !issuesRes.error.message?.includes('AbortError')) {
          console.error("Error fetching Jira issues from DB:", issuesRes.error);
        }

        // 4. Process Jira Tasks from Database
        if (issuesRes.data && issuesRes.data.length > 0) {
          const uniqueEmployees = new Map<string, EmployeeProfile>();
          
          loadedTasks = issuesRes.data.map((issue: any, index: number) => {
            const assignee = issue.assignee || 'Unassigned';
            
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
              day: getStableDay(issue.issue_key), 
              requiredSkills: [issue.issue_type || 'Task'],
              isReallocated: false,
              isCancelled: ['closed', 'done', 'resolved'].includes(issue.status?.toLowerCase()),
              totalLogged: issue.time_spent_seconds ? (issue.time_spent_seconds / 3600) : 0,
              logs: [],
              created_date: issue.created_date?.split('T')[0] || new Date().toISOString().split('T')[0],
              due_date: issue.due_date?.split('T')[0] || new Date().toISOString().split('T')[0]
            };
          });

          loadedEmployees = Array.from(uniqueEmployees.values());
          source = 'JIRA';
          
          // Ensure we have a default user selected if none was found
          if (isMounted && loadedEmployees.length > 0 && !user?.email) {
             setCurrentUser(loadedEmployees[0].name);
          }
        }
        
      } catch (error: any) {
        console.error("[LeaveManagement] Error loading data:", error);
      } finally {
        if (isMounted) {
          setTasks(loadedTasks);
          setEmployees(loadedEmployees);
          setDataSource(source);
          setIsLoadingData(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false; 
    };
  }, [user]);

  const handleImportTasks = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  };

  const getAvailableEmployeesOnDate = (date: string): { name: string; load: number }[] => {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    return employees
      .map(emp => {
        const empTasks = tasks.filter(t => {
          if (t.assignee !== emp.name || t.isCancelled) return false;

          const startDate = new Date(t.created_date || t.day ? new Date() : new Date());
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(t.due_date || t.day ? new Date() : new Date());
          endDate.setHours(23, 59, 59, 999);

          return dateObj >= startDate && dateObj <= endDate;
        });

        const currentLoad = empTasks.reduce((sum, t) => sum + (t.hours / 8), 0) * 20; 
        return { name: emp.name, load: Math.min(100, currentLoad) };
      })
      .filter(emp => emp.load < 80) 
      .sort((a, b) => a.load - b.load); 
  };

  // ------------------------------------------------------------------
  // SUPABASE DATABASE MUTATIONS WITH OPTIMISTIC UI 
  // ------------------------------------------------------------------

  const handleApplyLeave = async (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    if (!currentOrgId) {
      toast({ title: "Error", description: "Organization ID not found.", variant: "destructive" });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newLeave: LeaveRequest = { id: tempId, ...request, status: 'Pending' };
    setLeaves(prev => [newLeave, ...prev]); 
    
    try {
      const { error } = await supabase.from('leave_requests').insert([{
        org_id: currentOrgId,
        user_id: user?.id || null, // Will be null if using failsafe, which is fine
        start_date: request.startDate,
        end_date: request.endDate,
        reason: request.reason,
        status: 'pending'
      }]);

      if (error) throw error;

      toast({
        title: "✓ Leave Request Submitted",
        description: `Your leave request has been securely saved to the database.`,
      });
      fetchSupabaseLeaves(currentOrgId); 
    } catch (err: any) {
      console.error("Leave Insert Error:", err);
      setLeaves(prev => prev.filter(l => l.id !== tempId)); 
      toast({ title: "Error", description: err.message || "Failed to submit request.", variant: "destructive" });
    }
  };

  const handleApproveLeave = async (leave: LeaveRequest) => {
    setLeaves(prev => prev.map(l => l.id === leave.id ? { ...l, status: 'Approved' } : l));
    setLeaveUpdateCount(leaveUpdateCount + 1);
    
    try {
      const { error } = await supabase.from('leave_requests').update({ status: 'approved' }).eq('id', leave.id);
      if (error) throw error;
      toast({ title: "✓ Leave Approved", description: "Database updated successfully." });
    } catch (err) {
      console.error(err);
      if (currentOrgId) fetchSupabaseLeaves(currentOrgId); 
    }
  };

  const handleRejectLeave = async (leave: LeaveRequest) => {
    setLeaves(prev => prev.map(l => l.id === leave.id ? { ...l, status: 'Rejected' } : l));
    
    try {
      const { error } = await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', leave.id);
      if (error) throw error;
      toast({ title: "✗ Leave Rejected", description: "Database updated successfully." });
    } catch (err) {
      console.error(err);
      if (currentOrgId) fetchSupabaseLeaves(currentOrgId);
    }
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
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate || leave.startDate);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    setTasks(prev => prev.map(t => {
      if (t.assignee !== leave.name || t.isCancelled) return t;

      const taskEnd = new Date(t.due_date || new Date());
      if (taskEnd >= startDate) {
        const newStart = new Date(t.created_date || new Date());
        newStart.setDate(newStart.getDate() + durationDays);
        const newDue = new Date(taskEnd);
        newDue.setDate(newDue.getDate() + durationDays);

        return {
          ...t,
          created_date: newStart.toISOString().split('T')[0],
          due_date: newDue.toISOString().split('T')[0],
          day: (t.day + durationDays) % 5
        };
      }
      return t;
    }));

    handleApproveLeave(leave);
    toast({ title: "⏭️ Tasks Shifted", description: `Tasks shifted forward by ${durationDays} day(s).` });
  };

  const confirmReallocation = () => {
    if (!selectedLeave) return;
    setTasks(prev => {
      const newTasks = [...prev];
      newTasks.filter(t => t.assignee === selectedLeave.name && !t.isReallocated).forEach(t => t.isCancelled = true);
      return newTasks;
    });
    handleApproveLeave(selectedLeave);
    setScenarioOpen(false);
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-slate-500 font-light">Loading Workforce Data from Supabase...</div>
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
          
          {/* DATA SOURCE INDICATORS */}
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
          {/* ACTIVE LEAVES DASHBOARD */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-light text-primary mb-6 flex items-center gap-2">
              📋 Active Leave Requests
            </h3>
            
            {leaves.filter(l => l.status !== 'Rejected').length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto opacity-30 mb-2" />
                <p>No active leave requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.filter(l => l.status !== 'Rejected').map(leave => {
                  const employeeTasks = tasks.filter(t => t.assignee === leave.name && !t.isCancelled);
                  const affectedTasks = employeeTasks.filter(t => {
                    const startDate = new Date(t.created_date || new Date());
                    const endDate = new Date(t.due_date || new Date());
                    const leaveDate = new Date(leave.startDate);
                    return leaveDate >= startDate && leaveDate <= endDate;
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
                            <div>
                              <p className="text-slate-600"><strong>Leave Date:</strong> {new Date(leave.startDate).toLocaleDateString()}</p>
                              {leave.endDate && <p className="text-slate-600"><strong>End Date:</strong> {new Date(leave.endDate).toLocaleDateString()}</p>}
                            </div>
                            <div>
                              <p className="text-slate-600"><strong>Reason:</strong> {leave.reason}</p>
                              <p className="text-slate-600"><strong>Affected Tasks:</strong> {affectedTasks.length}</p>
                            </div>
                          </div>
                          
                          {affectedTasks.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-bold text-slate-700 mb-2">Tasks that will be affected:</p>
                              <div className="flex flex-wrap gap-2">
                                {affectedTasks.slice(0, 3).map(task => (
                                  <span key={task.id} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded">
                                    {task.taskName.substring(0, 30)}...
                                  </span>
                                ))}
                                {affectedTasks.length > 3 && <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded">+{affectedTasks.length - 3} more</span>}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {leave.status !== 'Rejected' && (
                          <div className="flex gap-2 flex-wrap justify-end min-w-[280px]">
                            {leave.status === 'Pending' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => handleApproveLeave(leave)}>
                                  ✓ Approve
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => handleRejectLeave(leave)}>
                                  ✕ Reject
                                </Button>
                              </>
                            )}
                            
                            {affectedTasks.length > 0 && leave.status === 'Pending' && (
                              <>
                                <Button 
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                  onClick={() => {
                                    setSelectedLeave(leave);
                                    setRedeployOpen(true);
                                  }}
                                >
                                  🔄 Redeploy
                                </Button>
                                <Button 
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                                  onClick={() => handleShiftTasks(leave)}
                                >
                                  ⏭️ Shift Tasks
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div key={leaveUpdateCount} className="w-full">
            <CapacityAnalysis 
              employees={employees}
              approvedLeaves={leaves.filter(l => l.status === 'Approved')}
              onRefresh={() => currentOrgId && fetchSupabaseLeaves(currentOrgId)}
            />
          </div>
        </div>
      )}

      {activePersona === 'employee' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-700 flex justify-between">
            <span>✓ Employee View Loaded | Tasks: {tasks.length} | Current User: {currentUser}</span>
            <span className="font-bold underline cursor-pointer" onClick={() => setApplyOpen(true)}>Apply for Leave</span>
          </div>
          
          {tasks.length > 0 ? (
            <EmployeeLeavePortal
              tasks={tasks}
              employees={employees}
              currentUserEmail={currentUser}
              onLeaveRequest={(data) => handleApplyLeave({ ...data, name: data.employeeName })}
            />
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-600 mb-3 opacity-50" />
              <h3 className="text-lg font-bold text-amber-900 mb-2">No Tasks Available</h3>
              <p className="text-sm text-amber-700">
                No tasks found in your connected database. Create some Jira tickets and sync them first.
              </p>
            </div>
          )}
        </div>
      )}

      <ImpactAnalysisDialog open={scenarioOpen} onOpenChange={setScenarioOpen} predictions={predictions} onConfirm={confirmReallocation} />
      <LeaveApplicationDialog 
        open={applyOpen} 
        onOpenChange={setApplyOpen} 
        currentUser={currentUser} 
        onSubmit={(data) => {
           handleApplyLeave(data);
           setApplyOpen(false);
        }} 
      />

      {redeployOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-light text-slate-900 mb-4">🔄 Redeploy Tasks</h3>
            <p className="text-sm text-slate-600 mb-4">
              Select an available employee to reassign {selectedLeave.name}'s tasks on {new Date(selectedLeave.startDate).toLocaleDateString()}
            </p>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6">
              {getAvailableEmployeesOnDate(selectedLeave.startDate).map(emp => (
                <button
                  key={emp.name}
                  onClick={() => handleRedeploy(emp.name)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{emp.name}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      {Math.round(emp.load)}% loaded
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-full rounded-full ${emp.load > 60 ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${emp.load}%` }}
                    />
                  </div>
                </button>
              ))}
              
              {getAvailableEmployeesOnDate(selectedLeave.startDate).length === 0 && (
                <div className="text-center p-6 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="text-sm">No available employees on this date</p>
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setRedeployOpen(false);
                setSelectedLeave(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}