import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, CheckCircle2, XCircle, Clock, UserPlus, Users, User, ArrowRight } from 'lucide-react';

interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const INITIAL_DATA: LeaveRequest[] = [
  { id: 1, name: "Alex Rivera", startDate: "2024-06-10", endDate: "2024-06-12", reason: "Family Vacation", status: "Pending" },
  { id: 2, name: "Sarah Chen", startDate: "2024-06-15", endDate: "2024-06-15", reason: "Medical Appointment", status: "Approved" },
];

export default function LeaveManagementTab() {
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New State for Date Ranges
  const [formData, setFormData] = useState({ 
    name: '', 
    startDate: '', 
    endDate: '', 
    reason: '' 
  });

  const currentUser = "Alex Rivera";

  // Helper to calculate days between dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
  };

  const handleStatusUpdate = (id: number, newStatus: 'Approved' | 'Rejected') => {
    setLeaves(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleAddLeave = () => {
    const entry: LeaveRequest = {
      id: Date.now(),
      name: activePersona === 'manager' ? (formData.name || "Unknown") : currentUser,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason || "Personal",
      status: activePersona === 'manager' ? 'Approved' : 'Pending',
    };
    setLeaves([entry, ...leaves]);
    setIsModalOpen(false);
    setFormData({ name: '', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Persona Simulator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Persona Simulator</h3>
            <p className="text-xs text-slate-400">Testing: {activePersona === 'manager' ? 'Admin Logic' : 'Employee Flow'}</p>
          </div>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
          <button onClick={() => setActivePersona('manager')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Manager</button>
          <button onClick={() => setActivePersona('employee')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Employee</button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-sm text-gray-500">{activePersona === 'manager' ? "Approvals & Absences" : `Portal for ${currentUser}`}</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className={activePersona === 'manager' ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}>
              {activePersona === 'manager' ? "Record Absence" : "Request Leave"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activePersona === 'manager' ? "Direct Entry" : "New Application"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {activePersona === 'manager' && (
                <div className="space-y-2">
                  <Label>Employee Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2 text-center p-2 bg-gray-50 rounded-lg border border-dashed">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Duration: </span>
                 <span className="text-lg font-black text-indigo-600">{calculateDays(formData.startDate, formData.endDate)} Days</span>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Reason for leave" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddLeave} className="w-full">Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-sm border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {activePersona === 'manager' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves
                .filter(l => activePersona === 'manager' || l.name === currentUser)
                .map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-bold text-gray-800">{leave.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{leave.startDate}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span>{leave.endDate}</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase">
                        {calculateDays(leave.startDate, leave.endDate)} Days Absent
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 italic text-sm">"{leave.reason}"</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status}
                    </span>
                  </TableCell>
                  {activePersona === 'manager' && (
                    <TableCell className="text-right">
                      {leave.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" className="w-8 h-8 text-green-600" onClick={() => handleStatusUpdate(leave.id, 'Approved')}><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="outline" className="w-8 h-8 text-red-600" onClick={() => handleStatusUpdate(leave.id, 'Rejected')}><XCircle className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}