import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { LeaveRequest, UnifiedEmployee } from '../types';
import { CalendarOff, CheckCircle2, XCircle, Clock, User, Calendar } from 'lucide-react';

interface LeaveManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'MANAGER' | 'EMPLOYEE';
  currentUserId: number;
  currentUser?: UnifiedEmployee; // Add this prop
  requests: LeaveRequest[];
  onRequestLeave: (req: LeaveRequest) => void;
  onApproveReject: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

export const LeaveManagementDialog: React.FC<LeaveManagementDialogProps> = ({
  open, onOpenChange, userRole, currentUserId, currentUser, requests, onRequestLeave, onApproveReject
}) => {
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'Sick' | 'Vacation' | 'Personal'>('Personal');

  const handleSubmit = () => {
    if(!startDate || !endDate || !reason) return;
    
    onRequestLeave({
      id: `leave_${Date.now()}`,
      employeeId: currentUserId,
      employeeName: currentUser?.name || "Unknown",
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      type
    });
    
    // Reset form
    setStartDate('');
    setEndDate('');
    setReason('');
    onOpenChange(false);
  };

  // Filter requests based on role
  const myRequests = requests.filter(r => r.employeeId === currentUserId);
  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-indigo-600" />
            {userRole === 'MANAGER' ? 'Leave Approval Portal' : 'Request Time Off'}
          </DialogTitle>
          <DialogDescription>
            {userRole === 'MANAGER' 
              ? 'Review and manage team leave requests.' 
              : 'Submit your leave request for approval.'}
          </DialogDescription>
        </DialogHeader>

        {/* ================= EMPLOYEE VIEW ================= */}
        {userRole === 'EMPLOYEE' && (
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                   <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 bg-white" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                   <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 bg-white" />
                 </div>
               </div>
               
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Leave Type</label>
                  <select 
                    value={type} 
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Personal">Personal Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Vacation">Vacation</option>
                  </select>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
                 <Textarea 
                   value={reason} 
                   onChange={e => setReason(e.target.value)} 
                   placeholder="Brief reason for your absence..." 
                   className="mt-1 h-20 bg-white"
                 />
               </div>
               
               <Button onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                 Submit Request
               </Button>
            </div>

            {/* History */}
            <div>
               <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                 <Clock className="w-4 h-4" /> My Request History
               </h4>
               {myRequests.length === 0 ? (
                 <p className="text-sm text-slate-400 italic">No past requests found.</p>
               ) : (
                 <div className="space-y-2">
                   {myRequests.map(req => (
                     <div key={req.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm">
                        <div>
                           <div className="font-bold text-sm text-slate-800">{req.type}</div>
                           <div className="text-xs text-slate-500">{req.startDate} to {req.endDate}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase
                          ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                          {req.status}
                        </span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* ================= MANAGER VIEW ================= */}
        {userRole === 'MANAGER' && (
          <div className="space-y-4 py-4">
             {pendingRequests.length === 0 ? (
               <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-xl">
                 <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-200" />
                 <p>All caught up! No pending requests.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {pendingRequests.map(req => (
                   <div key={req.id} className="p-4 border border-indigo-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                               <User className="w-4 h-4" />
                            </div>
                            <div>
                               <div className="font-bold text-sm text-slate-900">{req.employeeName}</div>
                               <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {req.startDate} - {req.endDate}
                               </div>
                            </div>
                         </div>
                         <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full uppercase">{req.type}</span>
                      </div>
                      
                      <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 italic mb-3">
                        "{req.reason}"
                      </div>

                      <div className="flex gap-2 justify-end">
                         <Button size="sm" variant="outline" onClick={() => onApproveReject(req.id, 'REJECTED')} className="text-red-600 border-red-200 hover:bg-red-50">
                           <XCircle className="w-3 h-3 mr-1" /> Reject
                         </Button>
                         <Button size="sm" onClick={() => onApproveReject(req.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                           <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                         </Button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};