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
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [affectedTasksForShift, setAffectedTasksForShift] = useState<Task[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [expandedLeaves, setExpandedLeaves] = useState<Record<string, boolean>>({});

  // Calendar state for month navigation
  const [overviewStartDate, setOverviewStartDate] = useState(new Date());
  
  // Default to manager view to show calendar
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');

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
    handleApproveLeave(selectedLeave);
    setRedeployOpen(false);
    setSelectedLeave(null);
    toast({ title: "✅ Complete", description: `Tasks redeployed to ${selectedEmployee} and leave approved.` });
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
      const shiftsCount = result.data?.actions?.shifted || affectedTasksForShift.length;

      // Refresh data from backend
      await refreshLeaves();

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
    <div className="w-full min-h-screen h-full flex flex-col bg-[#F5F5F4] animate-in fade-in duration-500 pb-20 p-8">
      {/* HEADER SECTION */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-normal text-slate-900 tracking-tight">Leave Management</h1>
          <Button 
            onClick={() => setActivePersona(activePersona === 'manager' ? 'employee' : 'manager')}
            className="bg-black hover:bg-slate-800 text-white px-8 py-3 rounded-full font-medium transition-all shadow-md"
          >
            {activePersona === 'manager' ? 'Request Leave' : 'Back to Overview'}
          </Button>
        </div>
      </div>

      {/* ACTIVE LEAVE REQUESTS SECTION - MANAGER VIEW ONLY */}
      {activePersona === 'manager' && (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-xl font-normal text-slate-900 mb-6 tracking-tight">Active Leave Requests</h2>
            {leaves.length === 0 ? (
              <div className="text-center p-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="font-medium">No leave requests found.</p>
                <p className="text-xs mt-1">Requests submitted by your team will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Table for Leave Requests */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="text-left py-4 px-0 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date Range</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        <th className="text-right py-4 px-0 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => {
                        const affectedTasks = tasks.filter(t => {
                          if (t.assignee !== leave.name || t.isCancelled) return false;
                          const lStart = new Date(leave.startDate);
                          const tStart = new Date(t.created_date);
                          const tEnd = new Date(t.due_date);
                          return lStart >= tStart && lStart <= tEnd;
                        });

                        const durationDays = Math.ceil(
                          (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (86400000)
                        ) + 1;
                        const durationHours = durationDays * 8;

                        const initials = leave.name
                          .split(' ')
                          .map(word => word[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        const getStatusColor = () => {
                          if (leave.status === 'Approved') return 'bg-green-50';
                          if (leave.status === 'Rejected') return 'bg-slate-50';
                          return 'bg-white';
                        };

                        const getStatusDot = () => {
                          if (leave.status === 'Approved') return 'bg-green-500';
                          if (leave.status === 'Rejected') return 'bg-red-500';
                          return 'bg-amber-500';
                        };

                        return (
                          <tr key={leave.id} className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${getStatusColor()}`}>
                            <td className="py-5 px-0">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-slate-700">{initials}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">{leave.name}</p>
                                  <p className="text-xs text-slate-500">{leave.reason}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <p className="text-sm text-slate-700 font-normal">{leave.startDate} - {leave.endDate}</p>
                            </td>
                            <td className="py-5 px-6">
                              <p className="text-sm text-slate-700 font-normal">{durationHours} hours</p>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot()}`}></span>
                                <span className="text-sm font-normal text-slate-700 capitalize">{leave.status}</span>
                              </div>
                            </td>
                            <td className="py-5 px-0 text-right">
                              {leave.status === 'Pending' ? (
                                <div className="flex justify-end gap-3">
                                  <Button 
                                    size="sm" 
                                    className="bg-black hover:bg-slate-800 text-white px-6 py-2 rounded-full text-sm font-medium transition-all"
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setAffectedTasksForShift(affectedTasks);
                                      setApproveDialogOpen(true);
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="text-slate-700 border border-slate-300 hover:bg-slate-100 px-6 py-2 rounded-full text-sm font-medium transition-all bg-white"
                                    onClick={() => handleRejectLeave(leave)}
                                  >
                                    Deny
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 font-normal">No actions available</p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {/* TEAM CALENDAR - MANAGER VIEW ONLY */}
      {activePersona === 'manager' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-normal text-slate-900 tracking-tight">Team Calendar</h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-full border border-slate-200 shadow-inner">
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-white hover:shadow-sm" onClick={handlePrevOverview}>
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-full" onClick={handleResetOverview}>
                {overviewStartDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-white hover:shadow-sm" onClick={handleNextOverview}>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="p-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0 border border-slate-200 rounded-xl overflow-hidden">
              {(() => {
                const calendarDays = [];
                const year = overviewStartDate.getFullYear();
                const month = overviewStartDate.getMonth();
                
                // Get first day of month and number of days
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday = 0
                
                // Add empty cells for days before month starts
                for (let i = 0; i < adjustedFirstDay; i++) {
                  calendarDays.push(null);
                }
                
                // Add all days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  calendarDays.push(new Date(year, month, day));
                }
                
                return calendarDays.map((dateObj, idx) => {
                  if (!dateObj) {
                    return <div key={`empty-${idx}`} className="min-h-24 bg-slate-50 border-b border-r border-slate-200 p-2"></div>;
                  }
                  
                  const dateStr = dateObj.toISOString().split('T')[0];
                  const dayLeaves = leaves.filter(l => {
                    if (l.status !== 'Approved') return false;
                    const s = new Date(l.startDate);
                    s.setHours(0, 0, 0, 0);
                    const e = new Date(l.endDate);
                    e.setHours(23, 59, 59, 999);
                    const d = new Date(dateStr);
                    d.setHours(0, 0, 0, 0);
                    return d >= s && d <= e;
                  });
                  
                  const isToday = new Date().toDateString() === dateObj.toDateString();
                  const isLastDayOfWeek = (idx + 1) % 7 === 0;
                  const isLastRow = idx >= calendarDays.length - 7;
                  
                  return (
                    <div 
                      key={dateStr}
                      className={`min-h-24 p-2 bg-white ${!isLastDayOfWeek ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''} border-slate-200 flex flex-col ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                        {dateObj.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayLeaves.slice(0, 3).map(leave => (
                          <div 
                            key={leave.id}
                            className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full font-medium truncate hover:bg-slate-300 transition-colors relative"
                            title={leave.name}
                          >
                            <div className="absolute inset-0 rounded-full opacity-30 repeat-bg" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.5) 2px, rgba(255,255,255,.5) 4px)'}}></div>
                            <span className="relative">{leave.name}</span>
                          </div>
                        ))}
                        {dayLeaves.length > 3 && (
                          <div className="text-xs px-2 py-1 text-slate-600 font-medium">
                            +{dayLeaves.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE VIEW */}
      {activePersona === 'employee' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-normal text-slate-900 mb-6 tracking-tight">Apply for Leave</h2>
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
        </div>
      )}

      <LeaveApplicationDialog 
        open={applyOpen} 
        onOpenChange={setApplyOpen} 
        currentUser={currentUser} 
        onSubmit={handleApplyLeave} 
      />

      {/* Approve Dialog */}
      {approveDialogOpen && selectedLeave && (() => {
        // Calculate dynamic data
        const uniqueProjects = [...new Set(affectedTasksForShift.map(t => t.projectName || 'Unknown'))];
        const totalTasksHours = affectedTasksForShift.reduce((sum, t) => sum + (t.hours || 0), 0);
        const durationDays = Math.ceil((new Date(selectedLeave.endDate).getTime() - new Date(selectedLeave.startDate).getTime()) / 86400000) + 1;
        const totalHoursLost = durationDays * 8;
        
        return (
        <>
          <div className="fixed inset-0 z-50 bg-white/30 backdrop-blur-lg" />
          <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
            <DialogContent className="sm:max-w-[650px] rounded-3xl bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200 shadow-2xl overflow-hidden p-0">
                <DialogHeader className="px-8 pt-8">
                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    PTO Impact Analysis
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 mt-3 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{selectedLeave.name}</span>
                    <span>·</span>
                    <span>{selectedLeave.startDate} - {selectedLeave.endDate}</span>
                    <span>·</span>
                    <span className="font-medium text-indigo-600">{selectedLeave.reason} ({durationDays * 8}h)</span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="px-8 space-y-6 py-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl text-center border border-blue-200 shadow-sm">
                      <p className="text-3xl font-bold text-blue-900">{uniqueProjects.length}</p>
                      <p className="text-xs text-blue-700 font-semibold mt-2">Projects Affected</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl text-center border border-amber-200 shadow-sm">
                      <p className="text-3xl font-bold text-amber-900">{totalHoursLost}h</p>
                      <p className="text-xs text-amber-700 font-semibold mt-2">Total Hours Lost</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl text-center border border-red-200 shadow-sm">
                      <p className="text-3xl font-bold text-red-600">{affectedTasksForShift.length}</p>
                      <p className="text-xs text-red-600 font-semibold mt-2">Critical Tasks</p>
                    </div>
                  </div>

                  {/* Affected Projects Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 px-1 flex items-center gap-2">
                      <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                      Affected Projects
                    </h4>
                    
                    {affectedTasksForShift.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-600">
                        No tasks affected by this leave.
                      </div>
                    ) : (
                      affectedTasksForShift.map((task, idx) => {
                        const isAtRisk = task.hours > 8;
                        const health = Math.max(30, 100 - (task.hours * 5));
                        const timelineImpact = isAtRisk ? `Extend by ${Math.ceil(task.hours / 8)}-${Math.ceil(task.hours / 4)} days` : 'No significant impact';
                        
                        return (
                          <div key={task.id} className={`p-4 bg-gradient-to-r ${isAtRisk ? 'from-pink-50 via-white to-slate-50 border-pink-200' : 'from-green-50 via-white to-slate-50 border-green-200'} rounded-2xl border shadow-sm space-y-3`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {isAtRisk && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">CRITICAL</span>}
                                  <p className="font-bold text-slate-900 text-base">{task.projectName || `Task ${idx + 1}`}</p>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Assignee: {task.assignee || 'Unassigned'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">Health {Math.round(health)}%</p>
                                <p className={`text-xs font-semibold ${isAtRisk ? 'text-amber-600' : 'text-green-600'}`}>{isAtRisk ? '⚠️ At Risk' : '✓ On Track'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-2 bg-white rounded-lg border border-slate-200">
                                <p className="text-slate-600">Hours Lost</p>
                                <p className="font-bold text-slate-900 text-lg">{task.hours}h</p>
                              </div>
                              <div className="p-2 bg-white rounded-lg border border-slate-200">
                                <p className="text-slate-600">Timeline Impact</p>
                                <p className={`font-bold ${isAtRisk ? 'text-red-600' : 'text-green-600'}`}>{timelineImpact}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* View Detailed Impact */}
                  <div className="border-t border-slate-300 pt-4">
                    <button 
                      onClick={() => setExpandedLeaves(prev => ({ ...prev, [selectedLeave.id]: !prev[selectedLeave.id] }))}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors hover:bg-blue-50/50 px-3 py-2 rounded-xl"
                    >
                      <span>{expandedLeaves[selectedLeave.id] ? '▼' : '▶'}</span>
                      View All Affected Tasks ({affectedTasksForShift.length} items)
                    </button>
                    {expandedLeaves[selectedLeave.id] && affectedTasksForShift.length > 0 && (
                      <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                        {affectedTasksForShift.map(t => (
                          <div key={t.id} className="text-xs p-3 bg-gradient-to-r from-white to-slate-50 border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors">
                            <p className="font-semibold text-slate-900 line-clamp-1">📌 {t.taskName}</p>
                            <p className="text-slate-500 text-xs mt-1">📅 Due: {t.due_date} | ⏱️ {t.hours}h</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-8 pb-8 flex gap-3 justify-end pt-6 border-t border-slate-300">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleRejectLeave(selectedLeave);
                      setApproveDialogOpen(false);
                      setSelectedLeave(null);
                    }}
                    className="text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800 hover:border-red-400 px-6 py-2.5 rounded-full font-semibold transition-all"
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleApproveLeave(selectedLeave);
                      setApproveDialogOpen(false);
                      setSelectedLeave(null);
                    }}
                    className="text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400 px-6 py-2.5 rounded-full font-semibold transition-all"
                  >
                    Approve Only
                  </Button>
                  <Button 
                    onClick={() => {
                      handleShiftTasks(selectedLeave);
                      setApproveDialogOpen(false);
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    Approve and Shift
                  </Button>
                </div>
            </DialogContent>
          </Dialog>
        </>
        );
      })()}

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
                  <button onClick={() => setRedeployOpen(false)} className="px-8 h-10 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-full font-medium transition-all">
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
              <Button variant="outline" onClick={() => setShiftOpen(false)} className="px-6 rounded-full">Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 px-6 rounded-full" onClick={() => performShiftTasks(selectedLeave)}>Confirm & Shift</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}