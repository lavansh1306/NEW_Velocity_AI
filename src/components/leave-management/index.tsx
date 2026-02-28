import React, { useState, useEffect } from 'react';
import { Users, Zap, AlertCircle, Database, RefreshCw, CalendarDays, Clock, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

// Supabase and Auth
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Imports from your existing structure
import { Task, LeaveRequest, EmployeeProfile } from './types';
import { ImpactAnalysisDialog } from './ImpactAnalysisDialog';
import { LeaveApplicationDialog } from './LeaveApplicationDialog';
import { EmployeeLeavePortal } from './EmployeeLeavePortal';
import { CapacityAnalysis } from './CapacityAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

// NEW: Import the normalized data fetching hook
import { useLeaveManagementData } from '@/hooks/useLeaveManagementData';

export default function LeaveManagementTab() {
  const { toast } = useToast();
  
  // NEW: Use the centralized data fetching hook instead of managing state directly
  const {
    tasks,
    employees,
    leaves,
    currentUser,
    currentOrgId,
    isLoading: isLoadingData,
    dataSource,
    refreshLeaves,
    addLeaveRequest,
  } = useLeaveManagementData();

  const { user, loading: authLoading } = useAuth();

  // UI state - separate from data fetching
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [redeployOpen, setRedeployOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [affectedTasksForShift, setAffectedTasksForShift] = useState<Task[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [expandedLeaves, setExpandedLeaves] = useState<Record<string, boolean>>({});

  // NEW: Movable Calendar State for Manager View
  const [overviewStartDate, setOverviewStartDate] = useState(new Date());
  
  // Default to employee view for better UX - users see their leave portal first
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('employee');

  // ------------------------------------------------------------------
  // HARDENED SUBMISSION & MANAGER ACTIONS
  // ------------------------------------------------------------------
  const handleApplyLeave = async (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    try {
      const employeeName = (request as any).employeeName || request.name;
      
      if (!employeeName || !currentOrgId) {
        toast({ title: "❌ Error", description: "Missing user or organization data.", variant: "destructive" });
        return;
      }

      await addLeaveRequest(request);
      toast({ title: "✅ Success", description: `Leave request submitted.` });
    } catch (err: any) {
      toast({ title: "❌ Submission Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleApproveLeave = async (leave: LeaveRequest) => {
    try {
      const actor = currentUser || 'Manager';
      const entry = { ts: new Date().toISOString(), actor, action: 'Approved', details: 'Manual Approval' };

      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved' })
        .eq('id', leave.id);
      
      if (error) throw error;
      await refreshLeaves();
      toast({ title: "✅ Approved", description: "Leave status updated." });
    } catch (err: any) {
      toast({ title: "❌ Approval Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRejectLeave = async (leave: LeaveRequest) => {
    try {
      const actor = currentUser || 'Manager';
      const entry = { ts: new Date().toISOString(), actor, action: 'Rejected', details: 'Request Denied' };

      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', leave.id);
      
      if (error) throw error;
      await refreshLeaves();
      toast({ title: "❌ Rejected", description: "Leave request denied." });
    } catch (err: any) {
      toast({ title: "❌ Rejection Failed", description: err.message, variant: "destructive" });
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
    const lStart = new Date(leave.startDate); lStart.setHours(0,0,0,0);
    const lEnd = new Date(leave.endDate); lEnd.setHours(23,59,59,999);
    
    const affectedForShift = tasks.filter(t => {
      if (t.assignee !== leave.name || t.isCancelled) return false;
      const tStart = new Date(t.created_date);
      const tEnd = new Date(t.due_date);
      return tStart <= lEnd && tEnd >= lStart;
    });
    
    setAffectedTasksForShift(affectedForShift);
    setSelectedLeave(leave);
    setShiftOpen(true);
  };

  const performShiftTasks = async (leave: LeaveRequest) => {
    try {
      const durationDays = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (86400000)) + 1;
      const affectedForShift = affectedTasksForShift;
        
      const response = await fetch('/api/leave-approval/approve-and-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leave.id,
          org_id: currentOrgId,
          name: leave.name,
          startDate: leave.startDate,
          endDate: leave.endDate,
          reason: leave.reason,
          status: leave.status
        })
      });

      if (!response.ok) throw new Error(`Backend error: ${response.status}`);

      const result = await response.json();
      const shiftsCount = result.data?.actions?.shifted || affectedForShift.length;
      const actor = currentUser || 'Manager';
      const detail = `Auto-shifted ${shiftsCount} task(s) by ${durationDays} days`;
      
      setLeaves(prev => prev.map(l => l.id === leave.id ? { 
        ...l, 
        status: 'Approved', 
        history: [...(l.history||[]), { ts: new Date().toISOString(), actor, action: 'Shifted', details: detail }] 
      } : l));
      
      setLeaveUpdateCount(prev => prev + 1);

      if (currentOrgId) {
        await fetchSupabaseLeaves(currentOrgId);
        const { data: updatedTasks } = await supabase.from('jira_issues').select('*').eq('org_id', currentOrgId).limit(500);
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

      toast({ title: "✅ Success", description: `Leave approved and ${shiftsCount} tasks shifted.` });
      setShiftOpen(false);
      setSelectedLeave(null);
      setAffectedTasksForShift([]);
    } catch (err: any) {
      toast({ title: "❌ Shift Failed", description: err.message, variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // MOVABLE MANAGER CALENDAR LOGIC
  // ------------------------------------------------------------------
  const handlePrevOverview = () => {
    const newDate = new Date(overviewStartDate);
    newDate.setDate(newDate.getDate() - 14); // Move back 2 weeks
    setOverviewStartDate(newDate);
  };

  const handleNextOverview = () => {
    const newDate = new Date(overviewStartDate);
    newDate.setDate(newDate.getDate() + 14); // Move forward 2 weeks
    setOverviewStartDate(newDate);
  };

  const handleResetOverview = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setOverviewStartDate(today);
  };

  const getOverviewDays = () => {
    const arr: { date: string; leaves: LeaveRequest[] }[] = [];
    const iteratorDate = new Date(overviewStartDate);
    iteratorDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const d = new Date(iteratorDate);
      d.setDate(iteratorDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayLeaves = leaves.filter(l => {
        if (l.status !== 'Approved') return false;
        const s = new Date(l.startDate); s.setHours(0,0,0,0);
        const e = new Date(l.endDate); e.setHours(23,59,59,999);
        const dd = new Date(dateStr); dd.setHours(0,0,0,0);
        return dd >= s && dd <= e;
      });
      arr.push({ date: dateStr, leaves: dayLeaves });
    }
    return arr;
  };

  // Don't block rendering - show content with fade-in instead
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-slate-500 font-light">Logging in...</div>
      </div>
    );
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!user && !isDevelopment) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div className="text-slate-700 font-light text-center">
          <p className="font-semibold">Not authenticated</p>
          <p className="text-sm text-slate-500">Please log in to access Leave Management</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen h-full flex flex-col space-y-8 bg-[#F5F5F4] animate-in fade-in duration-500 pb-20 p-8">
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
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-medium text-slate-800 mb-6 flex items-center gap-2">📋 Team Leave Requests</h3>
            
            {/* Movable Calendar Overview */}
            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Team Absence Overview</h4>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    Showing 30 days starting from {overviewStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-inner">
                  <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-white hover:shadow-sm" onClick={handlePrevOverview}>
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm" onClick={handleResetOverview}>
                    Today
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-white hover:shadow-sm" onClick={handleNextOverview}>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-10 md:grid-cols-15 gap-1.5 text-[10px]">
                {getOverviewDays().map(day => {
                  const dateObj = new Date(day.date);
                  const isToday = new Date().toDateString() === dateObj.toDateString();
                  
                  return (
                    <div 
                      key={day.date} 
                      title={`${day.date} — ${day.leaves.length} approved leave(s)`} 
                      className={`h-9 rounded flex flex-col items-center justify-center transition-colors border ${
                        day.leaves.length > 0 
                          ? 'bg-red-50 border-red-200 text-red-700 cursor-help shadow-sm' 
                          : isToday 
                            ? 'bg-blue-50 border-blue-300 text-blue-800 ring-1 ring-blue-300 shadow-sm' 
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}
                    >
                      <span className="font-semibold">{dateObj.getDate()}</span>
                      <div className="flex gap-0.5 mt-0.5">
                        {day.leaves.length > 0 ? (
                          day.leaves.slice(0,3).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          ))
                        ) : isToday ? (
                          <span className="text-[8px] font-bold text-blue-600 tracking-tighter">TDY</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {leaves.length === 0 ? (
              <div className="text-center p-12 text-slate-500 bg-white/60 rounded-xl border border-dashed border-indigo-200">
                <AlertCircle className="w-10 h-10 mx-auto text-indigo-300 mb-3" />
                <p className="font-medium">No leave requests found.</p>
                <p className="text-xs mt-1">Requests submitted by your team will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                    <div key={leave.id} className={`p-5 rounded-xl border transition-all ${leave.status === 'Approved' ? 'bg-white border-green-200 shadow-sm' : leave.status === 'Rejected' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-amber-200 shadow-md ring-1 ring-amber-100'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg text-slate-900">{leave.name}</h4>
                            <Badge variant={leave.status === 'Approved' ? 'default' : leave.status === 'Rejected' ? 'destructive' : 'secondary'} className={`${leave.status === 'Approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : leave.status === 'Pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : ''}`}>
                              {leave.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-2">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <CalendarDays className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{leave.startDate}</span> to <span className="font-medium">{leave.endDate}</span>
                            </div>
                            <div className="text-slate-600">
                              <span className="text-slate-400 mr-1">Reason:</span> {leave.reason}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          <Button size="sm" variant="ghost" onClick={() => setExpandedLeaves(prev => ({ ...prev, [leave.id]: !prev[leave.id] }))}>
                            {isExpanded ? 'Hide Impact' : `View Impact (${affectedTasks.length} tasks)`}
                          </Button>
                          
                          {leave.status === 'Pending' && (
                            <div className="flex gap-2 border-l pl-2 border-slate-200">
                              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleRejectLeave(leave)}>Reject</Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveLeave(leave)}>Approve Only</Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => handleShiftTasks(leave)}>
                                <Zap className="w-3.5 h-3.5 mr-1.5" /> Approve & Shift
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <h5 className="text-sm font-semibold text-slate-700 mb-3">Tasks overlapping with this leave:</h5>
                          {affectedTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {affectedTasks.map(t => (
                                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{t.taskName}</p>
                                    <p className="text-xs text-slate-500 mt-1">Due: {t.due_date}</p>
                                  </div>
                                  <Badge variant="outline" className="bg-white">{t.hours}h</Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
                              No active tasks found for this employee during these dates.
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

      {/* Redeploy Modal */}
      {redeployOpen && selectedLeave && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setRedeployOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-[#121212]">Redeploy Tasks</h2>
                      <p className="text-sm text-gray-600 mt-1">Select an employee to redeploy tasks to.</p>
                    </div>
                  </div>
                  <button onClick={() => setRedeployOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>
                
                <div className="mb-6 space-y-2 max-h-[50vh] overflow-y-auto">
                  {getAvailableEmployeesOnDate(selectedLeave.startDate).map(emp => (
                    <button
                      key={emp.name}
                      onClick={() => handleRedeploy(emp.name)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer group"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-[#121212]">{emp.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Available capacity</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${emp.load < 50 ? 'bg-green-100 text-green-700' : emp.load < 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {Math.round(emp.load)}% load
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-6 flex gap-3 justify-end">
                  <button onClick={() => setRedeployOpen(false)} className="px-6 h-11 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-light transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Shift Tasks Modal */}
      {shiftOpen && selectedLeave && (
        <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Approve Leave & Shift Tasks
              </DialogTitle>
              <DialogDescription>
                This will approve {selectedLeave.name}'s leave and push back the deadlines of all overlapping tasks.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4 max-h-[40vh] overflow-y-auto pr-2 space-y-3">
              {affectedTasksForShift.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No tasks need shifting.</p>
              ) : (
                affectedTasksForShift.map(task => {
                  const durationDays = Math.ceil((new Date(selectedLeave.endDate).getTime() - new Date(selectedLeave.startDate).getTime()) / (86400000)) + 1;
                  const newDueDate = new Date(new Date(task.due_date).getTime() + durationDays * 86400000).toISOString().split('T')[0];
                  
                  return (
                    <div key={task.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center">
                      <div className="max-w-[60%]">
                        <p className="font-medium text-sm truncate">{task.taskName}</p>
                      </div>
                      <div className="text-xs flex items-center gap-2">
                        <span className="text-slate-500 line-through">{task.due_date}</span>
                        <span className="text-blue-500 font-bold">→ {newDueDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShiftOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => performShiftTasks(selectedLeave)}>Confirm & Shift</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}