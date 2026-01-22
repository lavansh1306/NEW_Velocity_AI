import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const MOCK_LEAVES = [
  { id: 1, name: "Alex Rivera", duration: "3 Days", reason: "Family Event", status: "Pending", role: "Developer" },
  { id: 2, name: "Sarah Chen", duration: "1 Day", reason: "Medical", status: "Approved", role: "Lead" },
];

export default function LeaveManagementTab({ currentView }: { currentView: 'manager' | 'vp' }) {
  const [leaves, setLeaves] = useState(MOCK_LEAVES);
  const currentUser = "Alex Rivera"; // Static Employee Name

  const updateStatus = (id: number, status: string) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-500">Currently viewing as: <span className="capitalize font-semibold">{currentView === 'manager' ? 'Manager' : currentUser}</span></p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              {currentView === 'manager' ? "Log Employee Absence" : "Apply for Leave"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Leave Application</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {currentView === 'manager' && (
                <div className="grid gap-2"><Label>Employee Name</Label><Input placeholder="e.g. John Doe" /></div>
              )}
              <div className="grid gap-2"><Label>Duration (Days)</Label><Input type="number" placeholder="1" /></div>
              <div className="grid gap-2"><Label>Reason</Label><Input placeholder="Vacation / Sick Leave" /></div>
              <Button onClick={() => alert("Static Data Saved Locally")}>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {currentView === 'manager' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves
                .filter(l => currentView === 'manager' || l.name === currentUser)
                .map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.name}</TableCell>
                  <TableCell>{leave.duration}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      leave.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                      leave.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>{leave.status}</span>
                  </TableCell>
                  {currentView === 'manager' && leave.status === 'Pending' && (
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => updateStatus(leave.id, 'Approved')}>Approve</Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateStatus(leave.id, 'Rejected')}>Reject</Button>
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