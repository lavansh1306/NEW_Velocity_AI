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
              <p className="text-sm text-gray-600 font-light">{submittedCount} leave request{submittedCount !== 1 ? 's' : ''} sent for approval</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {leaves.map((leave, index) => (
                  <div key={leave.id} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-light text-gray-900 text-sm">Leave Request #{index + 1}</h4>
                      {leaves.length > 1 && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleRemoveLeave(leave.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* NEW: Leave Type Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs font-light text-gray-600 uppercase">Leave Type</Label>
                      <Select 
                        onValueChange={(val) => handleLeaveChange(leave.id, 'leaveTypeId', val)}
                        value={leave.leaveTypeId}
                      >
                        <SelectTrigger className="bg-white border-gray-200">
                          <SelectValue placeholder="Select type (e.g. Annual, Sick)" />
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-light text-gray-600 uppercase">Start Date</Label>
                        <div className="relative">
                          <Input 
                            type="date" 
                            value={leave.startDate}
                            onChange={(e) => handleLeaveChange(leave.id, 'startDate', e.target.value)}
                            className="pl-9 border-gray-200"
                          />
                          <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-light text-gray-600 uppercase">End Date</Label>
                        <div className="relative">
                          <Input 
                            type="date" 
                            value={leave.endDate}
                            onChange={(e) => handleLeaveChange(leave.id, 'endDate', e.target.value)}
                            className="pl-9 border-gray-200"
                          />
                          <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-light text-gray-600 uppercase">Reason for Leave</Label>
                      <Textarea 
                        placeholder="Briefly describe the reason..."
                        value={leave.reason}
                        onChange={(e) => handleLeaveChange(leave.id, 'reason', e.target.value)}
                        className="resize-none border-gray-200 h-16 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleAddLeave}
                className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 mt-4"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Leave Period
              </Button>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={handleSubmit}
                disabled={!leaves.some(l => l.startDate && l.endDate && l.leaveTypeId)}
              >
                Submit {leaves.filter(l => l.startDate && l.endDate && l.leaveTypeId).length} Request(s)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};