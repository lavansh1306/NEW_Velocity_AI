import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { LeaveRequest } from './types';

interface LeaveRequestTableProps {
  leaves: LeaveRequest[];
  persona: 'manager' | 'employee';
  currentUser: string;
  onReview: (leave: LeaveRequest) => void;
}

export const LeaveRequestTable: React.FC<LeaveRequestTableProps> = ({ leaves, persona, currentUser, onReview }) => {
  const visibleLeaves = leaves.filter(l => persona === 'manager' || l.name === currentUser);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Leave Requests</h2>
          <p className="text-xs text-gray-500 font-medium">
            {persona === 'manager' ? 'Approve to trigger AI redistribution' : 'Track your leave status'}
          </p>
        </div>
        <Button className="bg-indigo-600 px-6 font-bold shadow-indigo-100 shadow-xl">Apply for Leave</Button>
      </div>
      <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px]">Employee</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Dates</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLeaves.map((leave) => (
              <TableRow key={leave.id} className="hover:bg-slate-50/50">
                <TableCell className="font-bold text-gray-800">{leave.name}</TableCell>
                <TableCell className="text-xs font-medium text-gray-600">{leave.startDate} → {leave.endDate}</TableCell>
                <TableCell>
                  <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {leave.status}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {leave.status === 'Pending' && persona === 'manager' ? (
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 font-black text-[10px]" onClick={() => onReview(leave)}>
                      REVIEW IMPACT
                    </Button>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-medium">--</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};