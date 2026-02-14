import React, { useState } from 'react';
import { Bell, XCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { LeaveRequest, Task } from './types';

interface LeaveNotificationPanelProps {
  pendingLeaves: LeaveRequest[];
  allTasks: Task[];
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
}

export function LeaveNotificationPanel({
  pendingLeaves,
  allTasks,
  onApprove,
  onReject,
}: LeaveNotificationPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (pendingLeaves.length === 0) {
    return null;
  }

  const getAffectedTasks = (employeeName: string, startDate: string, endDate: string): Task[] => {
    return allTasks.filter(task => {
      if (task.assignee !== employeeName || task.isCancelled) return false;
      // Tasks within the leave period
      return task.day >= 0 && task.day <= 5;
    });
  };

  return (
    <div className="space-y-3">
      {pendingLeaves.map((leave) => {
        const affectedTasks = getAffectedTasks(leave.name, leave.startDate, leave.endDate);
        const totalHours = affectedTasks.reduce((sum, task) => sum + task.hours, 0);
        const isExpanded = expandedId === leave.id;

        return (
          <div
            key={leave.id}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : leave.id)}
              className="p-4 cursor-pointer flex items-center justify-between hover:bg-amber-100/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-full font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 text-sm">
                    Leave Request from {leave.name}
                  </h3>
                  <p className="text-xs text-amber-700">
                    📅 {leave.startDate} → {leave.endDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 bg-amber-200 text-amber-900 font-bold text-[11px] rounded-full">
                  {affectedTasks.length} Tasks
                </span>
                <span className="text-amber-600">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 py-3 bg-white/70 border-t border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                {/* Reason */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 mb-1">📝 Reason:</p>
                  <p className="text-sm text-amber-800">{leave.reason}</p>
                </div>

                {/* Affected Tasks */}
                {affectedTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Affected Tasks: {affectedTasks.length}
                    </p>
                    <div className="bg-white border border-amber-200 rounded-lg p-2 max-h-[200px] overflow-y-auto space-y-2">
                      {affectedTasks.map((task, i) => (
                        <div key={task.id} className="flex items-start gap-2 p-2 bg-amber-50 rounded hover:bg-amber-100 transition-colors">
                          <span className="text-xs font-bold text-amber-600 min-w-fit">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-900 truncate">
                              [{task.projectName}] {task.taskName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-amber-700 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {task.hours}h
                              </span>
                              {task.requiredSkills?.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded truncate">
                                  {task.requiredSkills[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
                      <span className="text-xs font-semibold text-blue-900">Total Hours at Risk:</span>
                      <span className="text-sm font-bold text-blue-600">{totalHours}h</span>
                    </div>
                  </div>
                )}

                {/* Impact Summary */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <p className="text-blue-900 font-bold">Team Capacity Loss</p>
                    <p className="text-blue-700">{affectedTasks.length} tasks</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-red-900 font-bold">Estimated RiskScore</p>
                    <p className="text-red-700">{Math.min(affectedTasks.length * 15, 100)}%</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-amber-200">
                  <Button
                    onClick={() => onApprove(leave)}
                    className="flex-1 h-8 text-xs font-bold bg-green-500 hover:bg-green-600 text-white gap-1.5 rounded-lg transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Leave
                  </Button>
                  <Button
                    onClick={() => onReject(leave)}
                    variant="outline"
                    className="flex-1 h-8 text-xs font-bold border-red-300 text-red-600 hover:bg-red-50 gap-1.5 rounded-lg transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
