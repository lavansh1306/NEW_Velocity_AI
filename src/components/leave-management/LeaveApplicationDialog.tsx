import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Calendar as CalendarIcon, Plane, AlertCircle, Plus, X } from 'lucide-react';
import { LeaveRequest } from './types';

interface LeaveEntry {
  startDate: string;
  endDate: string;
}

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'status'>) => void;
}

export const LeaveApplicationDialog: React.FC<LeaveApplicationDialogProps> = ({ open, onOpenChange, currentUser, onSubmit }) => {
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([{ startDate: '', endDate: '' }]);
  const [reason, setReason] = useState('');

  const handleAddLeaveEntry = () => {
    setLeaveEntries([...leaveEntries, { startDate: '', endDate: '' }]);
  };

  const handleRemoveLeaveEntry = (index: number) => {
    if (leaveEntries.length > 1) {
      setLeaveEntries(leaveEntries.filter((_, i) => i !== index));
    }
  };

  const handleLeaveEntryChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const updated = [...leaveEntries];
    updated[index][field] = value;
    setLeaveEntries(updated);
  };

  const handleSubmit = () => {
    // Validate all entries
    for (const entry of leaveEntries) {
      if (!entry.startDate || !entry.endDate) {
        alert('Please fill in all date fields');
        return;
      }
    }
    if (!reason) {
      alert('Please provide a reason for your leave');
      return;
    }

    // Submit each leave entry separately
    for (const entry of leaveEntries) {
      onSubmit({
        name: currentUser,
        startDate: entry.startDate,
        endDate: entry.endDate,
        reason: reason
      });
    }

    // Reset and close
    setLeaveEntries([{ startDate: '', endDate: '' }]);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Plane className="w-5 h-5 text-blue-600"/></div>
            <div>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit your time-off request(s) for approval. You can add multiple leave periods.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Leave Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-light text-gray-500 uppercase">Leave Periods</Label>
              <span className="text-xs font-light text-gray-400">{leaveEntries.length} period{leaveEntries.length !== 1 ? 's' : ''}</span>
            </div>

            {leaveEntries.map((entry, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-light text-gray-600">Period {index + 1}</span>
                  {leaveEntries.length > 1 && (
                    <button
                      onClick={() => handleRemoveLeaveEntry(index)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Remove this leave period"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-light text-gray-500 uppercase">Start Date</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={entry.startDate}
                        onChange={(e) => handleLeaveEntryChange(index, 'startDate', e.target.value)}
                        className="pl-9 border-gray-200 focus:border-blue-500 font-light"
                      />
                      <CalendarIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-light text-gray-500 uppercase">End Date</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={entry.endDate}
                        onChange={(e) => handleLeaveEntryChange(index, 'endDate', e.target.value)}
                        className="pl-9 border-gray-200 focus:border-blue-500 font-light"
                      />
                      <CalendarIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Another Leave Button */}
            <button
              onClick={handleAddLeaveEntry}
              className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-light text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Leave Period
            </button>
          </div>

          {/* Reason */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-light text-gray-500 uppercase">Reason</Label>
            <Textarea
              placeholder="e.g. Vacation, Medical appointment, Family matters..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none border-gray-200 focus:border-blue-500 font-light"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-tight font-light">
              Submitting these requests will trigger AI Impact Analysis to check for project conflicts. Each leave period will be reviewed separately.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 font-light">Cancel</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 font-light"
            onClick={handleSubmit}
            disabled={leaveEntries.some(e => !e.startDate || !e.endDate) || !reason}
          >
            Submit {leaveEntries.length} Request{leaveEntries.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};