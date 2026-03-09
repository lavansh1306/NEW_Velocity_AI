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
            {/* Active Requests */}
            <section>
              <h3 className="text-lg font-light mb-4">Pending Approvals</h3>
              <div className="bg-white border border-white/20 rounded-2xl shadow-sm divide-y">
                {leaves.filter(l => l.status === 'pending').map((leave) => (
                  <div key={leave.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar><AvatarFallback>{leave.name.slice(0,2)}</AvatarFallback></Avatar>
                      <div>
                        <div className="text-sm font-medium">{leave.name}</div>
                        <div className="text-xs text-slate-500">{leave.leave_type_name} • {leave.reason}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {leave.startDate} to {leave.endDate}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedLeave(leave);
                          setApproveDialogOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Review
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRejectLeave(leave)}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
                {leaves.filter(l => l.status === 'pending').length === 0 && (
                  <div className="p-10 text-center text-slate-400 font-light">No pending requests.</div>
                )}
              </div>
            </section>

            {/* Team Calendar Grid (Simplified for length) */}
            <section className="bg-white p-8 rounded-2xl border">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-light">Team Availability</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePrevOverview}><ChevronLeft/></Button>
                    <span className="text-sm self-center">{overviewStartDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <Button variant="ghost" size="sm" onClick={handleNextOverview}><ChevronRight/></Button>
                  </div>
               </div>
               {/* Calendar Grid Logic here would use leaves.filter(l => l.status === 'approved') */}
            </section>
          </div>
        )}

        {/* EMPLOYEE VIEW */}
        {activePersona === 'employee' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <EmployeeLeavePortal
                tasks={tasks}
                employees={employees}
                currentUserEmail={user?.email || ''}
                onLeaveRequest={() => setApplyOpen(true)}
                existingLeaves={leaves.filter(l => l.user_id === user?.id)}
              />
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h4 className="text-sm font-medium mb-4">Your Balances</h4>
                <div className="space-y-4">
                  {balances.map(bal => (
                    <div key={bal.id} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{bal.leave_types?.name}</span>
                        <span>{bal.used_days} / {bal.total_allocated} days</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${(bal.used_days / bal.total_allocated) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DIALOGS */}
      <LeaveApplicationDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        leaveBalances={balances}
        onSubmit={handleApplyLeave}
      />

      {/* Impact/Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>Review the impact on project timelines before confirming.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0"/>
                <p className="text-xs text-amber-800">
                  {selectedLeave?.name} has tasks overlapping with this period. 
                  Approving will mark them as "Delayed" in Capacity Analysis.
                </p>
             </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-black text-white" onClick={() => handleApproveLeave(selectedLeave!)}>Confirm Approval</Button>
            <Button variant="outline" className="flex-1" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}