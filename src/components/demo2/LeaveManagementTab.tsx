import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

// Static Data for Demo
const INITIAL_LEAVE_DATA = [
  { id: 1, name: "Alex Rivera", duration: "3 Days", reason: "Family Emergency", status: "Pending", date: "2024-05-20" },
  { id: 2, name: "Jordan Smith", duration: "1 Day", reason: "Medical", status: "Approved", date: "2024-05-18" },
];

export default function LeaveManagementTab({ currentView }: { currentView: 'manager' | 'vp' }) {
  const [leaves, setLeaves] = useState(INITIAL_LEAVE_DATA);
  // Condition 2: Mocking a specific employee
  const currentUser = "Alex Rivera"; 

  const handleStatusChange = (id: number, newStatus: 'Approved' | 'Rejected') => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
        
        {/* Condition 1 & 2: Apply/Add Leave Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              {currentView === 'manager' ? "Add Employee Leave" : "Apply for Leave"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentView === 'manager' ? "Record Employee Absence" : "New Leave Application"}</DialogTitle>
            </DialogHeader>
            {/* Simple Static Form would go here */}
            <div className="space-y-4 py-4">
               {/* Inputs for Name (if manager), Duration, and Reason */}
               <Button onClick={() => alert("Static Save Triggered")}>Save Application</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {currentView === 'manager' && <TableHead>Actions</TableHead>}
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
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                      leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </TableCell>
                  {currentView === 'manager' && leave.status === 'Pending' && (
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange(leave.id, 'Approved')}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleStatusChange(leave.id, 'Rejected')}>Reject</Button>
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