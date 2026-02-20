import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Calendar as CalendarIcon, Plane, AlertCircle } from 'lucide-react';
import { LeaveRequest } from './types';

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'status'>) => void;
}

export const LeaveApplicationDialog: React.FC<LeaveApplicationDialogProps> = ({ open, onOpenChange, currentUser, onSubmit }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleSubmit = () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) return;
    
    onSubmit({
      name: currentUser,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason
    });
    
    // Reset and close
    setFormData({ startDate: '', endDate: '', reason: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Plane className="w-5 h-5 text-blue-600"/></div>
            <div>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit your time-off request for approval.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-light text-gray-500 uppercase">Start Date</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
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
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="pl-9 border-gray-200 focus:border-blue-500 font-light"
                />
                <CalendarIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-light text-gray-500 uppercase">Reason</Label>
            <Textarea 
              placeholder="e.g. Family vacation, Medical appointment..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="resize-none border-gray-200 focus:border-blue-500 font-light"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex gap-2">
             <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
             <p className="text-xs text-blue-700 leading-tight font-light">
               Submitting this request will trigger an AI Impact Analysis to check for project conflicts.
             </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 font-light">Cancel</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-light" 
            onClick={handleSubmit}
            disabled={!formData.startDate || !formData.endDate || !formData.reason}
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};