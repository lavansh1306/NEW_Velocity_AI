import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Calendar as CalendarIcon, Plane, AlertCircle, Plus, Trash2, Check } from 'lucide-react';
import { LeaveRequest } from './types';

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'status'>) => void;
}

interface LeaveEntry {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export const LeaveApplicationDialog: React.FC<LeaveApplicationDialogProps> = ({ open, onOpenChange, currentUser, onSubmit }) => {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([
    { id: `leave-${Date.now()}`, startDate: '', endDate: '', reason: '' }
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const handleAddLeave = () => {
    setLeaves(prev => [...prev, { 
      id: `leave-${Date.now()}-${Math.random()}`, 
      startDate: '', 
      endDate: '', 
      reason: '' 
    }]);
  };

  const handleRemoveLeave = (leaveId: string) => {
    if (leaves.length === 1) {
      // Keep at least one empty form
      setLeaves([{ id: `leave-${Date.now()}`, startDate: '', endDate: '', reason: '' }]);
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
    // Find all leaves with at least one field filled
    const filledLeaves = leaves.filter(l => l.startDate.trim() || l.endDate.trim() || l.reason.trim());
    
    if (filledLeaves.length === 0) {
      alert('Please fill in at least one leave request');
      return;
    }

    // Validate all filled leaves are complete
    for (const leave of filledLeaves) {
      if (!leave.startDate.trim() || !leave.endDate.trim() || !leave.reason.trim()) {
        alert('All leave requests must have Start Date, End Date, and Reason filled in');
        return;
      }
      if (new Date(leave.endDate) < new Date(leave.startDate)) {
        alert('End Date cannot be before Start Date');
        return;
      }
    }
    
    // Normalize dates to strict YYYY-MM-DD to prevent Supabase rejection
    const normalizeDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    // All validations passed - submit all leaves
    filledLeaves.forEach(leave => {
      onSubmit({
        name: currentUser,
        startDate: normalizeDate(leave.startDate),
        endDate: normalizeDate(leave.endDate),
        reason: leave.reason
      });
    });
    
    // Show success state
    setSubmitted(true);
    setSubmittedCount(filledLeaves.length);
    
    // Reset after 1.5 seconds and close
    setTimeout(() => {
      setLeaves([{ id: `leave-${Date.now()}`, startDate: '', endDate: '', reason: '' }]);
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
              <DialogDescription>Submit one or more time-off requests for approval.</DialogDescription>
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
                {/* Leave Entries */}
                {leaves.map((leave, index) => (
                  <div key={leave.id} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-light text-gray-900 text-sm">Leave Request #{index + 1}</h4>
                      {leaves.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLeave(leave.id)}
                          className="text-red-600 hover:bg-red-50"
                          title="Remove this leave request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-light text-gray-600 uppercase">Start Date</Label>
                        <div className="relative">
                          <Input 
                            type="date" 
                            value={leave.startDate}
                            onChange={(e) => handleLeaveChange(leave.id, 'startDate', e.target.value)}
                            className="pl-9 border-gray-200 focus:border-blue-500 font-light text-sm"
                            required
                          />
                          <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-light text-gray-600 uppercase">End Date</Label>
                        <div className="relative">
                          <Input 
                            type="date" 
                            value={leave.endDate}
                            onChange={(e) => handleLeaveChange(leave.id, 'endDate', e.target.value)}
                            className="pl-9 border-gray-200 focus:border-blue-500 font-light text-sm"
                            required
                          />
                          <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-light text-gray-600 uppercase">Reason for Leave</Label>
                      <Textarea 
                        placeholder="e.g. Family vacation, Medical appointment, Personal leave..."
                        value={leave.reason}
                        onChange={(e) => handleLeaveChange(leave.id, 'reason', e.target.value)}
                        className="resize-none border-gray-200 focus:border-blue-500 font-light h-16 text-sm"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Leaves Button */}
              <Button
                variant="outline"
                onClick={handleAddLeave}
                className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 font-light gap-2 mt-4"
              >
                <Plus className="w-4 h-4" />
                Add Another Leave Period
              </Button>
            </div>

            {/* Info Message */}
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-tight font-light">
                All leave requests will be submitted together and reviewed by your manager. Team capacity will be updated upon approval.
              </p>
            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="border-gray-300 font-light"
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 font-light gap-2" 
                onClick={handleSubmit}
                disabled={!leaves.some(l => l.startDate && l.endDate && l.reason)}
              >
                Submit {leaves.filter(l => l.startDate && l.endDate && l.reason).length} Request{leaves.filter(l => l.startDate && l.endDate && l.reason).length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};