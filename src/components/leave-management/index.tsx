import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, X, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '../ui/avatar';

// Supabase and Auth
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Imports
import { Task, LeaveRequest } from './types';
import { LeaveApplicationDialog } from './LeaveApplicationDialog';
import { EmployeeLeavePortal } from './EmployeeLeavePortal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

// NEW: Hook integration
import { useLeaveManagementData } from '@/hooks/useLeaveManagementData';

export default function LeaveManagementTab() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const {
    tasks,
    employees,
    leaves,
    balances,
    leaveTypes, // NEW
    currentUser,
    currentOrgId,
    isLoading: isLoadingData,
    refresh,
    addLeaveRequest,
  } = useLeaveManagementData();

  // UI state
  const [applyOpen, setApplyOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [affectedTasksForShift, setAffectedTasksForShift] = useState<Task[]>([]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [overviewStartDate, setOverviewStartDate] = useState(new Date());
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');

  // ------------------------------------------------------------------
  // MANAGER ACTIONS (STRICT SCHEMA)
  // ------------------------------------------------------------------
  const handleApproveLeave = async (leave: LeaveRequest) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved' }) // Matches DB check constraint
        .eq('id', leave.id);

      if (error) throw error;
      await refresh();
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
      toast({ title: "✅ Approved", description: "Leave status updated and capacity recalculated." });
    } catch (err: any) {
      toast({ title: "❌ Approval Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRejectLeave = async (leave: LeaveRequest) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' }) // Matches DB check constraint
        .eq('id', leave.id);

      if (error) throw error;
      await refresh();
      toast({ title: "❌ Rejected", description: "Leave request denied." });
    } catch (err: any) {
      toast({ title: "❌ Rejection Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleApplyLeave = async (request: any) => {
    try {
      await addLeaveRequest(request);
      toast({ title: "✅ Success", description: `Leave request submitted.` });
    } catch (err: any) {
      toast({ title: "❌ Submission Failed", description: err.message, variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // APPROVE & SHIFT LOGIC (NEW)
  // ------------------------------------------------------------------
  const handleApproveClick = (leave: LeaveRequest) => {
    const employee = employees.find(e => e.id === leave.user_id);
    const email = employee?.email;
    
    if (!email) {
      setSelectedLeave(leave);
      setApproveDialogOpen(true);
      return;
    }

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    const overlaps = tasks.filter(task => {
      if (task.assignee !== email) return false;
      if (!task.created_date || !task.due_date) return false;
      
      const tStart = new Date(task.created_date);
      const tEnd = new Date(task.due_date);
      
      // Overlap condition
      return tStart <= end && tEnd >= start;
    });

    setAffectedTasksForShift(overlaps);
    setSelectedLeave(leave);
    setApproveDialogOpen(true);
  };

  const handleApproveAndShift = async (leave: LeaveRequest, mode: 'all' | 'single') => {
    try {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const employee = employees.find(e => e.id === leave.user_id);
      const email = employee?.email;
      const userTasks = tasks.filter(t => t.assignee === email);

      const updates = [];

      if (mode === 'all') {
         // Shift ALL tasks starting on or after leave.startDate
         const leaveStart = new Date(leave.startDate);
         const tasksToShift = userTasks.filter(t => t.created_date && new Date(t.created_date) >= leaveStart);
         
         for (const task of tasksToShift) {
            const tStart = new Date(task.created_date!);
            const tEnd = new Date(task.due_date!);
            tStart.setDate(tStart.getDate() + durationDays);
            tEnd.setDate(tEnd.getDate() + durationDays);
            
            updates.push(supabase.from('tasks').update({
               start_date: tStart.toISOString().split('T')[0],
               due_date: tEnd.toISOString().split('T')[0]
            }).eq('id', task.id));
         }
      } else {
         // Delay ONLY respective task
         for (const task of affectedTasksForShift) {
            const tStart = new Date(task.created_date!);
            const tEnd = new Date(task.due_date!);
            tStart.setDate(tStart.getDate() + durationDays);
            tEnd.setDate(tEnd.getDate() + durationDays);
            
            updates.push(supabase.from('tasks').update({
               start_date: tStart.toISOString().split('T')[0],
               due_date: tEnd.toISOString().split('T')[0]
            }).eq('id', task.id));
         }
      }

      // Execute updates
      const results = await Promise.all(updates);
      const failed = results.filter(r => r.error);
      if (failed.length > 0) throw new Error("Some tasks failed to update");

      // Approve leave
      const { error: approveError } = await supabase
        .from('leave_requests')
        .update({ status: 'approved' })
        .eq('id', leave.id);

      if (approveError) throw approveError;

      await refresh();
      setApproveDialogOpen(false);
      toast({ title: "✅ Approved", description: `Leave approved and tasks shifted (${mode}).` });

    } catch (err: any) {
      toast({ title: "❌ Shift Failed", description: err.message, variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // CALENDAR & UI LOGIC
  // ------------------------------------------------------------------
  const handlePrevOverview = () => {
    const newDate = new Date(overviewStartDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setOverviewStartDate(newDate);
  };

  const handleNextOverview = () => {
    const newDate = new Date(overviewStartDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setOverviewStartDate(newDate);
  };

  if (authLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-slate-500 font-light">Synchronizing with Supabase...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen h-full flex flex-col bg-[#FAFAF9] p-12">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-medium text-[#121212] tracking-tight">Leave Management</h2>
            <p className="text-sm text-slate-500 font-light">Organization: {currentOrgId?.slice(0,8)}...</p>
          </div>
          <Button
            onClick={() => setActivePersona(activePersona === 'manager' ? 'employee' : 'manager')}
            className="bg-[#121212] hover:bg-[#262626] rounded-xl text-white shadow-md"
          >
            {activePersona === 'manager' ? 'Switch to Personal Portal' : 'Back to Manager Overview'}
          </Button>
        </div>

        {/* MANAGER VIEW */}
        {activePersona === 'manager' && (
          <div className="space-y-10">
            
            {/* Screenshot 2: Active Leave Requests */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-[#121212]">Active Leave Requests</h3>
                <Button 
                  onClick={() => setApplyOpen(true)}
                  className="bg-[#121212] hover:bg-[#262626] rounded-xl text-white shadow-sm flex items-center gap-2"
                >
                  Request Leave
                </Button>
              </div>

              <div className="bg-white border border-[#E7E5E4] rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                        <th className="p-5 text-xs font-semibold text-[#78716C] uppercase">Employee</th>
                        <th className="p-5 text-xs font-semibold text-[#78716C] uppercase">Date Range</th>
                        <th className="p-5 text-xs font-semibold text-[#78716C] uppercase">Duration</th>
                        <th className="p-5 text-xs font-semibold text-[#78716C] uppercase">Status</th>
                        <th className="p-5 text-xs font-semibold text-[#78716C] uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E5E4]">
                      {leaves.map((leave) => {
                        const start = new Date(leave.startDate);
                        const end = new Date(leave.endDate);
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        const hours = days * 8; // Assuming 8h workday

                        return (
                          <tr key={leave.id} className="hover:bg-[#FAFAF9] transition-colors">
                            <td className="p-5 flex items-center gap-4">
                              <Avatar className="w-10 h-10 border border-[#E7E5E4]">
                                <AvatarFallback className="bg-[#F5F5F4] text-[#121212] text-xs font-semibold">
                                  {leave.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-semibold text-[#121212]">{leave.name}</div>
                                <div className="text-xs text-[#78716C]">{leave.leave_type_name}</div>
                              </div>
                            </td>
                            <td className="p-5 text-sm text-[#121212]">
                              {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="p-5 text-sm text-[#121212]">
                              {hours} hours
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-1.5 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  leave.status === 'approved' ? 'bg-emerald-500' : 
                                  leave.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                                <span className="capitalize">{leave.status}</span>
                              </div>
                            </td>
                            <td className="p-5 text-right">
                              {leave.status === 'pending' ? (
                                <div className="flex gap-4 justify-end items-center">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleApproveClick(leave)}
                                    className="bg-[#121212] hover:bg-[#262626] text-white rounded-lg h-8 px-4 text-xs"
                                  >
                                    Approve
                                  </Button>
                                  <button 
                                    onClick={() => handleRejectLeave(leave)}
                                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                                  >
                                    Deny
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-[#A8A29E]">No actions available</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {leaves.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-[#A8A29E] font-light">No requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Screenshot 1: Team Calendar Grid */}
            <section className="bg-white p-8 rounded-2xl border border-[#E7E5E4] shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-medium text-[#121212]">Team Calendar</h3>
                  <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] rounded-full p-1 shadow-sm">
                    <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-[#F5F5F4] rounded-full text-[#78716C]" onClick={handlePrevOverview}>
                      <ChevronLeft size={16}/>
                    </Button>
                    <span className="text-xs font-bold px-3 text-[#1C1917] uppercase tracking-wider">
                      {overviewStartDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-[#F5F5F4] rounded-full text-[#78716C]" onClick={handleNextOverview}>
                      <ChevronRight size={16}/>
                    </Button>
                  </div>
               </div>

               {/* Calendar Grid */}
               <div className="grid grid-cols-7 gap-px bg-[#E7E5E4] rounded-2xl overflow-hidden border border-[#E7E5E4]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="bg-[#FAFAF9] p-4 text-center text-xs font-semibold text-[#78716C] uppercase border-b border-[#E7E5E4]">
                      {day}
                    </div>
                  ))}
                  
                  {(() => {
                    const year = overviewStartDate.getFullYear();
                    const month = overviewStartDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

                    const cells = [];
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      cells.push(<div key={`empty-${i}`} className="bg-white h-32 p-3 border-r border-b border-[#E7E5E4] opacity-50" />);
                    }

                    for (let i = 1; i <= daysInMonth; i++) {
                      const cellDate = new Date(year, month, i);
                      const isToday = new Date().toDateString() === cellDate.toDateString();

                      // Get leaves on this day
                      const dayLeaves = leaves.filter(l => {
                        if (l.status === 'rejected') return false;
                        const s = new Date(l.startDate); s.setHours(0,0,0,0);
                        const e = new Date(l.endDate); e.setHours(23,59,59,999);
                        return cellDate >= s && cellDate <= e;
                      });

                      // Get tasks on this day
                      const dayTasks = tasks.filter(t => {
                        if (!t.created_date || !t.due_date) return false;
                        const tStart = new Date(t.created_date); tStart.setHours(0,0,0,0);
                        const tEnd = new Date(t.due_date); tEnd.setHours(23,59,59,999);
                        return cellDate >= tStart && cellDate <= tEnd;
                      });

                      cells.push(
                        <div key={i} className={`bg-white h-32 p-3 border-r border-b border-[#E7E5E4] relative hover:bg-[#FAFAF9] transition-colors ${isToday ? 'bg-[#F0FDFA]/20' : ''}`}>
                          <span className={`text-xs font-semibold ${isToday ? 'text-emerald-600' : 'text-[#78716C]'}`}>
                            {i}
                          </span>
                          <div className="mt-2 space-y-1 overflow-y-auto max-h-[82px] hide-scrollbar flex flex-col gap-1">
                            {/* Leaves */}
                            {dayLeaves.map(l => (
                              <div 
                                key={l.id} 
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate border ${
                                  l.status === 'approved' 
                                    ? 'bg-green-50 text-green-800 border-green-200' 
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                                style={{
                                  backgroundImage: l.status === 'pending' 
                                    ? 'linear-gradient(45deg, #FEF3C7 25%, transparent 25%, transparent 50%, #FEF3C7 50%, #FEF3C7 75%, transparent 75%, transparent)' 
                                    : 'none',
                                  backgroundSize: '10px 10px'
                                }}
                              >
                                {l.name.split(' ')[0]}: Leave
                              </div>
                            ))}

                            {/* Tasks */}
                            {dayTasks.map((t, idx) => (
                              <div 
                                key={`t-${idx}`} 
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate border bg-blue-50 text-blue-900 border-blue-100"
                                title={`${t.assigneeName || t.assignee}: ${t.taskName}`}
                              >
                                {t.assigneeName ? t.assigneeName.split(' ')[0] : t.assignee.split('@')[0]}: {t.taskName}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
               </div>
            </section>
          </div>
        )}

        {/* EMPLOYEE VIEW */}
        {activePersona === 'employee' && (
          <div className="w-full">
            <EmployeeLeavePortal
              tasks={tasks}
              employees={employees}
              currentUserEmail={user?.email || ''}
              onLeaveRequest={(leaveData) => handleApplyLeave({
                startDate: leaveData.startDate,
                endDate: leaveData.endDate,
                reason: leaveData.reason,
                leave_type_id: leaveData.leave_type_id,
                customLeaveType: leaveData.customLeaveType
              })}
              existingLeaves={leaves.filter(l => l.user_id === user?.id)}
              leaveBalances={balances}
              leaveTypes={leaveTypes}
            />
          </div>
        )}
      </div>

      {/* DIALOGS */}
      <LeaveApplicationDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        leaveBalances={balances}
        leaveTypes={leaveTypes}
        employees={employees} // NEW
        canSelectEmployee={activePersona === 'manager'} // NEW
        onSubmit={handleApplyLeave}
      />

      {/* Impact/Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#121212]">Approve Leave Request</DialogTitle>
            <DialogDescription className="text-sm text-[#78716C]">Review capacity impact and manage schedule shifts.</DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
             {affectedTasksForShift.length > 0 ? (
               <>
                 <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Timeline Congestion Detected</p>
                      <p className="text-xs text-amber-700 mt-1">
                        {selectedLeave?.name} has <strong>{affectedTasksForShift.length} overlapping task(s)</strong> during this leave period.
                      </p>
                    </div>
                 </div>

                 <div className="text-xs text-[#78716C]">
                    Suggested Available Date: <strong className="text-[#121212]">{selectedLeave ? new Date(new Date(selectedLeave.endDate).getTime() + 86400000).toLocaleDateString() : ''}</strong>
                 </div>

                 <div className="space-y-2">
                    <p className="text-xs font-bold text-[#78716C] uppercase">Select Shift Strategy</p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto p-3 flex flex-col items-start gap-1 rounded-xl border-[#E7E5E4] hover:bg-[#FAFAF9]"
                      onClick={() => handleApproveAndShift(selectedLeave!, 'all')}
                    >
                      <span className="text-sm font-semibold text-[#121212]">Shift All Subsequent Sequential</span>
                      <span className="text-xs text-[#78716C]">Pushes out the entire timeline to maintain sequence (No overlap)</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto p-3 flex flex-col items-start gap-1 rounded-xl border-[#E7E5E4] hover:bg-[#FAFAF9]"
                      onClick={() => handleApproveAndShift(selectedLeave!, 'single')}
                    >
                      <span className="text-sm font-semibold text-[#121212]">Delay Overlapping Tasks Only</span>
                      <span className="text-xs text-[#78716C]">Only shifts the absolute colliding items</span>
                    </Button>
                 </div>
               </>
             ) : (
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">No Task Overlaps</p>
                    <p className="text-xs text-emerald-700 mt-1">Approving this request will not impact any existing task deadlines for this user.</p>
                  </div>
               </div>
             )}
          </div>

          <div className="flex gap-2">
            {affectedTasksForShift.length === 0 && (
              <Button className="flex-1 bg-[#121212] hover:bg-[#262626] text-white rounded-xl" onClick={() => handleApproveLeave(selectedLeave!)}>
                Confirm Approval
              </Button>
            )}
            {affectedTasksForShift.length > 0 && (
              <Button variant="ghost" className="flex-1 text-[#78716C]" onClick={() => handleApproveLeave(selectedLeave!)}>
                Approve Without Shift
              </Button>
            )}
            <Button variant="outline" className="flex-1 rounded-xl border-[#E7E5E4]" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}