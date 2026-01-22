import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, CheckCircle2, XCircle, Clock, UserPlus, Users, User } from 'lucide-react';

interface LeaveRequest {
  id: number;
  name: string;
  duration: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

const INITIAL_DATA: LeaveRequest[] = [
  { id: 1, name: "Alex Rivera", duration: "3 Days", reason: "Family Vacation", status: "Pending", date: "2024-06-10" },
  { id: 2, name: "Sarah Chen", duration: "1 Day", reason: "Medical Appointment", status: "Approved", date: "2024-06-12" },
  { id: 3, name: "Michael Vance", duration: "5 Days", reason: "Annual Leave", status: "Pending", date: "2024-06-15" }
];

export default function LeaveManagementTab() {
  // INTERNAL PERSONA STATE (Keeps VelocityAI.tsx clean)
  const [activePersona, setActivePersona] = useState<'manager' | 'employee'>('manager');
  
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({ name: '', duration: '', reason: '' });

  const currentUser = "Alex Rivera"; // Static Mock Employee

  const handleStatusUpdate = (id: number, newStatus: 'Approved' | 'Rejected') => {
    setLeaves(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleAddLeave = () => {
    const entry: LeaveRequest = {
      id: Date.now(),
      name: activePersona === 'manager' ? (newLeave.name || "Unknown") : currentUser,
      duration: `${newLeave.duration || 1} Days`,
      reason: newLeave.reason || "Personal",
      status: activePersona === 'manager' ? 'Approved' : 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    setLeaves([entry, ...leaves]);
    setIsModalOpen(false);
    setNewLeave({ name: '', duration: '', reason: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- INTERNAL PERSONA SWITCHER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Persona Simulator</h3>
            <p className="text-xs text-indigo-600 font-medium">Testing: {activePersona === 'manager' ? 'Admin Controls' : 'Employee Portal'}</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-indigo-100 w-fit">
          <button 
            onClick={() => setActivePersona('manager')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'manager' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-600'}`}
          >
            <Users className="w-3.5 h-3.5" /> Manager
          </button>
          <button 
            onClick={() => setActivePersona('employee')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePersona === 'employee' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-600'}`}
          >
            <User className="w-3.5 h-3.5" /> Employee
          </button>
        </div>
      </div>

      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Management Portal</h2>
          <p className="text-sm text-gray-500">
            {activePersona === 'manager' ? "Reviewing all organizational requests" : `Viewing personal requests for ${currentUser}`}
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className={activePersona === 'manager' ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}>
              {activePersona === 'manager' ? <UserPlus className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
              {activePersona === 'manager' ? "Direct Record Absence" : "New Leave Application"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {activePersona === 'manager' ? "Administrative Log" : "Employee Leave Form"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              {activePersona === 'manager' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Target Employee</Label>
                  <Input id="name" value={newLeave.name} onChange={(e) => setNewLeave({...newLeave, name: e.target.value})} placeholder="Enter name..." />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="duration">Total Days</Label>
                <Input id="duration" type="number" value={newLeave.duration} onChange={(e) => setNewLeave({...newLeave, duration: e.target.value})} placeholder="e.g. 3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Detailed Reason</Label>
                <Input id="reason" value={newLeave.reason} onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} placeholder="Sick / Vacation / Personal" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddLeave} className="w-full">
                {activePersona === 'manager' ? "Approve & Record" : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-xl shadow-indigo-100/50 overflow-hidden rounded-2xl">
        <CardHeader className="bg-white border-b border-gray-100 py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-indigo-400" />
            {activePersona === 'manager' ? "Organization Wide Summary" : "My Recent History"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold text-gray-700">Name</TableHead>
                <TableHead className="font-bold text-gray-700">Days</TableHead>
                <TableHead className="font-bold text-gray-700">Reason</TableHead>
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                {activePersona === 'manager' && <TableHead className="text-right font-bold text-gray-700">Control</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves
                .filter(l => activePersona === 'manager' || l.name === currentUser)
                .map((leave) => (
                <TableRow key={leave.id} className="group hover:bg-indigo-50/30 transition-all">
                  <TableCell className="font-bold text-gray-800">{leave.name}</TableCell>
                  <TableCell>{leave.duration}</TableCell>
                  <TableCell className="text-gray-600">{leave.reason}</TableCell>
                  <TableCell className="text-gray-500 font-mono text-xs uppercase">{leave.date}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                      leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                      leave.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {leave.status}
                    </div>
                  </TableCell>
                  {activePersona === 'manager' && (
                    <TableCell className="text-right">
                      {leave.status === 'Pending' ? (
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="w-8 h-8 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                            onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="w-8 h-8 rounded-full border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white"
                            onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold italic uppercase mr-2">Complete</span>
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