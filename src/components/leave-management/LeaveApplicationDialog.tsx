import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select'; // Assuming you have a Select component in your UI folder
import { Calendar as CalendarIcon, Plane, AlertCircle, Plus, Trash2, Check } from 'lucide-react';
import { LeaveRequest, LeaveBalance } from './types';

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveBalances: LeaveBalance[]; // NEW: Pass balances to get Leave Types
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'status' | 'name' | 'organization_id' | 'user_id'>) => void;
}

interface LeaveEntry {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveTypeId: string; // NEW: Track the type ID
}

export const LeaveApplicationDialog: React.FC<LeaveApplicationDialogProps> = ({ 
  open, 
  onOpenChange, 
  leaveBalances, 
  onSubmit 
}) => {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([
    { id: `leave-${Date.now()}`, startDate: '', endDate: '', reason: '', leaveTypeId: '' }
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const handleAddLeave = () => {
    setLeaves(prev => [...prev, { 
      id: `leave-${Date.now()}-${Math.random()}`, 
      startDate: '', 
      endDate: '', 
      reason: '',
      leaveTypeId: ''
    }]);
  };

  const handleRemoveLeave = (leaveId: string) => {
    if (leaves.length === 1) {
      setLeaves([{ id: `leave-${Date.now()}`, startDate: '', endDate: '', reason: '', leaveTypeId: '' }]);
    } else {
      setLeaves(prev => prev.filter(leave => leave.id !== leaveId));
    }
  };

  const handleLeaveChange = (leaveId: string, field: keyof Omit<LeaveEntry, 'id'>, value: string) => {
    setLeaves(prev => prev.map(leave => 
      leave.id === leaveId ? { ...leave, [field]: value } : leave
    ));
  };

  const handleSubmit = () => {
    const filledLeaves = leaves.filter(l => l.startDate.trim() && l.endDate.trim() && l.reason.trim() && l.leaveTypeId);
    
    if (filledLeaves.length === 0) {
      alert('Please fill in all fields including Leave Type');
      return;
    }

    // Submit all leaves to the hook
    filledLeaves.forEach(leave => {
      onSubmit({
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        leave_type_id: leave.leaveTypeId
      });
    });
    
    setSubmitted(true);
    setSubmittedCount(filledLeaves.length);
    
    setTimeout(() => {
      setLeaves([{ id: `leave-${Date.now()}`, startDate: '', endDate: '', reason: '', leaveTypeId: '' }]);
      setSubmitted(false);
      setSubmittedCount(0);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Plane className="w-5 h-5 text-blue-600"/></div>
            <div>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Select a leave type and duration from your available balance.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submitted ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center animate-in fade-in">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-2">Submitted Successfully!</h3>
              <p className="text-sm text-gray-600 font-light">Your leave request has been sent for approval</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                
                {/* Single Form Layout based on Screenshot 3 */}
                <div className="space-y-4">
                  
                  {/* Employee Select (Locked to Current User for now, or searchable) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#78716C] uppercase">Employee</Label>
                    <Select disabled value="current_user">
                      <SelectTrigger className="bg-white border-[#E7E5E4] rounded-xl h-10">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current_user">Current User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Leave Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#78716C] uppercase">Leave Type</Label>
                    <Select 
                      onValueChange={(val) => handleLeaveChange(leaves[0].id, 'leaveTypeId', val)}
                      value={leaves[0].leaveTypeId}
                    >
                      <SelectTrigger className="bg-white border-[#E7E5E4] rounded-xl h-10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {leaveBalances.map((bal) => (
                          <SelectItem key={bal.leave_type_id} value={bal.leave_type_id}>
                            {bal.leave_types?.name} ({bal.total_allocated - (bal.used_days || 0)} days left)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#78716C] uppercase">Date Range</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Input 
                          type="date" 
                          value={leaves[0].startDate}
                          onChange={(e) => handleLeaveChange(leaves[0].id, 'startDate', e.target.value)}
                          className="pl-9 border-[#E7E5E4] rounded-xl h-10"
                        />
                        <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-[#A8A29E]" />
                      </div>
                      <div className="relative">
                        <Input 
                          type="date" 
                          value={leaves[0].endDate}
                          onChange={(e) => handleLeaveChange(leaves[0].id, 'endDate', e.target.value)}
                          className="pl-9 border-[#E7E5E4] rounded-xl h-10"
                        />
                        <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-[#A8A29E]" />
                      </div>
                    </div>
                  </div>

                  {/* Hours/Duration Display */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#78716C] uppercase">Hours</Label>
                    <div className="bg-[#FAFAF9] p-3 rounded-xl border border-[#E7E5E4] text-xs text-[#78716C]">
                      {leaves[0].startDate && leaves[0].endDate ? (
                        <span>
                          {Math.ceil((new Date(leaves[0].endDate).getTime() - new Date(leaves[0].startDate).getTime()) / 86400000) + 1} day(s) 
                          ({(Math.ceil((new Date(leaves[0].endDate).getTime() - new Date(leaves[0].startDate).getTime()) / 86400000) + 1) * 8} hours). 
                          Excludes weekends and holidays.
                        </span>
                      ) : (
                        <span className="text-gray-400">— select dates above</span>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#78716C] uppercase">Reason (Optional)</Label>
                    <Textarea 
                      placeholder="Add a note..."
                      value={leaves[0].reason}
                      onChange={(e) => handleLeaveChange(leaves[0].id, 'reason', e.target.value)}
                      className="resize-none border-[#E7E5E4] rounded-xl h-24 text-sm"
                    />
                  </div>

                  {/* Screenshot 3 Capacity Impact Message */}
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Capacity Impact</p>
                      <p className="text-xs text-amber-700 mt-1">
                        AI will analyze project impact and suggest reallocation options after submission.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#E7E5E4]">
              <Button variant="outline" className="rounded-xl border-[#E7E5E4]" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                className="bg-[#121212] hover:bg-[#262626] text-white rounded-xl shadow-sm" 
                onClick={handleSubmit}
                disabled={!leaves[0].startDate || !leaves[0].endDate || !leaves[0].leaveTypeId}
              >
                Submit Request
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};