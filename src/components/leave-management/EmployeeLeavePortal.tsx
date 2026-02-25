import React, { useState, useMemo } from 'react';
import { AlertCircle, Send, ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Task, EmployeeProfile, LeaveRequest } from './types';

interface EmployeeLeavePortalProps {
  tasks: Task[];
  employees: EmployeeProfile[];
  currentUserEmail: string;
  existingLeaves?: LeaveRequest[];
  onLeaveRequest: (leaveData: {
    employeeName: string;
    startDate: string;
    endDate: string;
    reason: string;
    affectedTasks: Task[];
    project: string;
  }) => void;
}

// Employee color palette for task visualization
const employeeColors = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', badge: 'bg-blue-200' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', badge: 'bg-purple-200' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900', badge: 'bg-pink-200' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', badge: 'bg-green-200' },
  { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-200' },
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-200' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900', badge: 'bg-cyan-200' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', badge: 'bg-indigo-200' },
];

export function EmployeeLeavePortal({
  tasks,
  employees,
  currentUserEmail,
  onLeaveRequest,
  existingLeaves,
}: EmployeeLeavePortalProps) {
  // Initialize selected employee - use current user if available, otherwise first employee
  const [selectedEmployee, setSelectedEmployee] = useState<string>(() => {
    const matchingEmployee = employees.find(emp => 
      emp.name.toLowerCase() === currentUserEmail.toLowerCase()
    );
    return matchingEmployee?.name || employees[0]?.name || currentUserEmail;
  });
  
  const [startLeaveDate, setStartLeaveDate] = useState<string>('');
  const [endLeaveDate, setEndLeaveDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [pendingLeaveRanges, setPendingLeaveRanges] = useState<Array<{start: string, end: string, reason: string}>>([]);

  // --- NEW STATE FOR MODAL ---
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ date: string, tasks: Task[] } | null>(null);

  // Helper: generate deterministic user_id from name
  const generateUserIdFromName = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    return `00000000-0000-4000-a000-${hashStr}00000000`.substring(0, 36);
  };

  const parseLocalMidnight = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isDateBlockedByExistingLeave = (dateStr: string) => {
    if (!existingLeaves || existingLeaves.length === 0) return false;
    const userId = generateUserIdFromName(selectedEmployee);
    const d = parseLocalMidnight(dateStr);

    return existingLeaves.some(l => {
      if (!l.user_id) return false;
      if (l.user_id !== userId) return false;
      const s = parseLocalMidnight(l.startDate);
      const e = parseLocalMidnight(l.endDate);
      e.setHours(23,59,59,999);
      return d >= s && d <= e;
    });
  };

  const activeTasks = useMemo(() => {
    return tasks.filter(t => !t.isCancelled);
  }, [tasks]);

  const userTasks = useMemo(() => {
    const emailLower = currentUserEmail ? currentUserEmail.toLowerCase() : '';
    return activeTasks.filter(t => {
      if (!t) return false;
      const assigneeName = t.assignee || '';
      const assigneeEmail = (t.assignee_email || '').toLowerCase();
      if (assigneeName === selectedEmployee) return true;
      if (assigneeEmail && emailLower && assigneeEmail === emailLower) return true;
      if (assigneeName && selectedEmployee && assigneeName.toLowerCase().includes(selectedEmployee.toLowerCase())) return true;
      return false;
    });
  }, [activeTasks, selectedEmployee, currentUserEmail]);

  React.useEffect(() => {
    if (userTasks.length === 0) {
      setCurrentMonth(new Date());
      return;
    }
    const taskDates = userTasks
      .map(t => parseLocalMidnight(t.due_date || t.created_date || new Date().toISOString()))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const lastDate = taskDates[0];
    setCurrentMonth(new Date(lastDate.getFullYear(), lastDate.getMonth(), 1));
  }, [selectedEmployee, userTasks]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [currentMonth]);

  const getTasksForDay = (day: number) => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    cellDate.setHours(0, 0, 0, 0);

    const tasksOnDay: Task[] = [];
    const selectedEmpColor = employeeColors[employees.findIndex(e => e.name === selectedEmployee) % employeeColors.length] || employeeColors[0];

    userTasks.forEach(task => {
      let taskStart: Date;
      let taskEnd: Date;

      if (task.created_date && task.due_date) {
        taskStart = parseLocalMidnight(task.created_date);
        taskEnd = parseLocalMidnight(task.due_date);
        taskEnd.setHours(23, 59, 59, 999);
      } else {
        const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const dayOfWeek = firstOfMonth.getDay();
        const firstMonday = new Date(firstOfMonth);
        firstMonday.setDate(firstOfMonth.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        firstMonday.setHours(0, 0, 0, 0);

        taskStart = new Date(firstMonday);
        taskStart.setDate(firstMonday.getDate() + task.day);

        const durationDays = Math.max(1, Math.ceil(task.hours / 8));
        taskEnd = new Date(taskStart);
        taskEnd.setDate(taskStart.getDate() + durationDays - 1);
        taskEnd.setHours(23, 59, 59, 999);
      }

      if (cellDate >= taskStart && cellDate <= taskEnd) {
        tasksOnDay.push(task);
      }
    });

    return { tasks: tasksOnDay, color: selectedEmpColor };
  };

  const tasksInLeaveRange = useMemo(() => {
    if (!startLeaveDate || !endLeaveDate) return [];

    const rangeStart = parseLocalMidnight(startLeaveDate);
    const rangeEnd = parseLocalMidnight(endLeaveDate);
    rangeEnd.setHours(23, 59, 59, 999);

    return userTasks.filter(task => {
      let taskStart: Date;
      let taskEnd: Date;

      if (task.created_date && task.due_date) {
        taskStart = parseLocalMidnight(task.created_date);
        taskEnd = parseLocalMidnight(task.due_date);
        taskEnd.setHours(23, 59, 59, 999);
      } else {
        const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const dayOfWeek = firstOfMonth.getDay();
        const firstMonday = new Date(firstOfMonth);
        firstMonday.setDate(firstOfMonth.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        firstMonday.setHours(0, 0, 0, 0);

        taskStart = new Date(firstMonday);
        taskStart.setDate(firstMonday.getDate() + task.day);

        const durationDays = Math.max(1, Math.ceil(task.hours / 8));
        taskEnd = new Date(taskStart);
        taskEnd.setDate(taskStart.getDate() + durationDays - 1);
        taskEnd.setHours(23, 59, 59, 999);
      }

      return taskStart <= rangeEnd && taskEnd >= rangeStart;
    });
  }, [startLeaveDate, endLeaveDate, userTasks, currentMonth]);

  const tasksOnLeaveDate = useMemo(() => {
    if (!startLeaveDate) return [];
    return tasksInLeaveRange;
  }, [startLeaveDate, tasksInLeaveRange]);

  const isDateInRange = (day: number) => {
    if (!startLeaveDate || !endLeaveDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = parseLocalMidnight(startLeaveDate);
    const end = parseLocalMidnight(endLeaveDate);
    return date >= start && date <= end;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = new Date(clickedDate.getTime() - (clickedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    if (isDateBlockedByExistingLeave(dateStr)) {
      alert('These dates are already on leave for the selected employee and cannot be selected.');
      return;
    }
    
    if (!startLeaveDate) {
      setStartLeaveDate(dateStr);
      setEndLeaveDate(dateStr);
    } else if (!endLeaveDate || dateStr < startLeaveDate) {
      setStartLeaveDate(dateStr);
      setEndLeaveDate(startLeaveDate);
    } else if (dateStr === startLeaveDate && dateStr === endLeaveDate) {
      setStartLeaveDate('');
      setEndLeaveDate('');
    } else {
      setEndLeaveDate(dateStr);
    }
  };

  // --- NEW HANDLER FOR VIEWING TASKS ---
  const handleViewDayDetails = (e: React.MouseEvent, day: number, dateStr: string, dayTasks: Task[]) => {
    e.stopPropagation(); // Prevent triggering the leave selection
    setSelectedDayDetails({ date: dateStr, tasks: dayTasks });
    setIsDayModalOpen(true);
  };

  const handleAddLeaveToQueue = () => {
    if (!startLeaveDate || !endLeaveDate || !leaveReason) {
      alert('Please select dates and provide a reason');
      return;
    }
    const rangeStart = parseLocalMidnight(startLeaveDate);
    const rangeEnd = parseLocalMidnight(endLeaveDate);
    rangeEnd.setHours(23,59,59,999);

    const userId = generateUserIdFromName(selectedEmployee);
    const overlaps = (existingLeaves || []).some(l => {
      if (l.user_id !== userId) return false;
      const s = parseLocalMidnight(l.startDate);
      const e = parseLocalMidnight(l.endDate);
      e.setHours(23,59,59,999);
      return s <= rangeEnd && e >= rangeStart;
    });

    if (overlaps) {
      alert('Selected range overlaps an existing leave for this employee and cannot be queued.');
      return;
    }

    setPendingLeaveRanges(prev => [...prev, {start: startLeaveDate, end: endLeaveDate, reason: leaveReason}]);
    setStartLeaveDate('');
    setEndLeaveDate('');
    setLeaveReason('');
  };

  const handleRemoveLeaveRange = (index: number) => {
    setPendingLeaveRanges(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAllLeaves = () => {
    if (pendingLeaveRanges.length === 0) {
      alert('Please add at least one leave request');
      return;
    }

    pendingLeaveRanges.forEach(range => {
      onLeaveRequest({
        employeeName: selectedEmployee,
        startDate: range.start,
        endDate: range.end,
        reason: range.reason,
        affectedTasks: tasksOnLeaveDate,
        project: 'All',
      });
    });

    setPendingLeaveRanges([]);
    setLeaveReason('');
  };

  const totalHoursAffected = tasksOnLeaveDate.reduce((sum, task) => sum + task.hours, 0);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 bg-gray-50 min-h-screen p-12 font-['Inter',sans-serif]">
      {/* Employee Info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-light">👤</div>
            <div>
              <h3 className="font-light text-gray-900">{selectedEmployee}</h3>
              <p className="text-xs text-gray-500">Employee Leave Request</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light text-blue-600">{userTasks.length}</p>
            <p className="text-xs text-gray-500">active task{userTasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-3">
        <h3 className="text-xl font-light text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          {selectedEmployee}'s Task Calendar
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110 transform">
              <ChevronLeft className="w-6 h-6 text-blue-600 font-light" />
            </button>
            <h3 className="font-light text-xl text-gray-900 min-w-[240px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110 transform">
              <ChevronRight className="w-6 h-6 text-blue-600 font-light" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-light text-white py-2 bg-gray-700 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-24 bg-gray-50 rounded-lg opacity-40" />;
              }

              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isInRange = isDateInRange(day);
              const isRangeStart = dateStr === startLeaveDate;
              const isRangeEnd = dateStr === endLeaveDate;
              const isBlocked = isDateBlockedByExistingLeave(dateStr);
              const dayTasksData = getTasksForDay(day);
              const dayTasks = dayTasksData.tasks;
              const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
              const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={isBlocked}
                  className={`h-24 rounded-lg transition-all relative group flex flex-col items-center justify-start p-2 border hover:scale-105 transform ${isBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                    isRangeStart || isRangeEnd
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                      : isInRange
                      ? 'bg-blue-200 text-gray-900 border-blue-400 shadow-sm'
                      : isToday
                      ? 'bg-amber-50 border-amber-400 shadow-sm'
                      : isWeekend
                      ? 'bg-gray-50 border-gray-300 text-gray-400'
                      : 'bg-white border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <span className={`text-lg font-light mb-1 ${(isRangeStart || isRangeEnd) ? 'text-white' : isInRange ? 'text-blue-900' : isWeekend ? 'text-gray-400' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  
                  {/* Task count & Info Button */}
                  {dayTasks.length > 0 && (
                    <div className="flex w-full items-center justify-between px-1">
                      <div className={`text-center px-1 py-0.5 rounded text-[10px] font-bold ${
                        (isRangeStart || isRangeEnd) ? 'bg-yellow-300 text-yellow-900' : 
                        isInRange ? 'bg-blue-300 text-blue-900' : 
                        'bg-indigo-200 text-indigo-800'
                      }`}>
                        📍 {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                      </div>
                      
                      {/* NEW: View Details Button (Appears on Hover) */}
                      <div 
                        onClick={(e) => handleViewDayDetails(e, day, dateStr, dayTasks)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded hover:bg-black/10"
                        title="View Day Tasks"
                      >
                        <Info className={`w-4 h-4 ${(isRangeStart || isRangeEnd) ? 'text-white' : 'text-blue-600'}`} />
                      </div>
                    </div>
                  )}
                  
                  {isBlocked && (
                    <div className="absolute inset-0 bg-green-50/60 flex items-center justify-center rounded-lg pointer-events-none flex-col">
                      <span className="text-xs text-green-700 font-semibold">Leave</span>
                      <span className="text-[9px] text-green-600">Approved</span>
                    </div>
                  )}

                  {isToday && !(isRangeStart || isRangeEnd || isInRange) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Tasks and Form */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Tasks on Selected Range */}
        <div className="space-y-3">
          <h3 className="text-lg font-light text-gray-900">
            {startLeaveDate ? `Tasks in Range` : 'Select Dates'}
          </h3>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 h-[300px] overflow-y-auto shadow-sm">
            {startLeaveDate ? (
              tasksOnLeaveDate.length > 0 ? (
                <div className="space-y-3">
                  {tasksOnLeaveDate.slice(0, 5).map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 border-l-4 border-blue-600 rounded-lg">
                      <p className="font-light text-gray-900 text-sm mb-1">{task.taskName.substring(0, 40)}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded font-light">
                          {task.projectName}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-light">
                          {task.hours}h
                        </span>
                      </div>
                    </div>
                  ))}
                  {tasksOnLeaveDate.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">+{tasksOnLeaveDate.length - 5} more tasks</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs">No tasks in range</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CalendarDays className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs">Click dates to select range</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Request Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-light text-gray-900">New Leave Request</h3>
          
          <div className="space-y-3 bg-white border border-gray-100 rounded-2xl p-6">
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-xs font-light text-gray-600 uppercase">Start Date</label>
                <p className="font-light text-gray-900">
                  {startLeaveDate ? new Date(startLeaveDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}) : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-xs font-light text-gray-600 uppercase">End Date</label>
                <p className="font-light text-gray-900">
                  {endLeaveDate ? new Date(endLeaveDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}) : 'Not set'}
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <label className="block text-xs font-light text-gray-600 uppercase mb-2">
                📝 Reason
              </label>
              <textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Medical, vacation, personal..."
                className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none font-light"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Tasks Affected:</span>
                <span className="font-light text-gray-900">{tasksOnLeaveDate.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours Lost:</span>
                <span className="font-light text-gray-900">{totalHoursAffected}h</span>
              </div>
            </div>

            {startLeaveDate && tasksOnLeaveDate.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-xs">
                <div className="font-bold text-amber-900 mb-2">📋 Shift Preview:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {tasksOnLeaveDate.slice(0, 5).map(task => {
                    const durationDays = Math.ceil((new Date(endLeaveDate).getTime() - new Date(startLeaveDate).getTime()) / (86400000)) + 1;
                    const oldDue = new Date(task.due_date);
                    const newDue = new Date(oldDue.getTime() + durationDays * 86400000);
                    const oldDueStr = oldDue.toISOString().split('T')[0];
                    const newDueStr = newDue.toISOString().split('T')[0];
                    return (
                      <div key={task.id} className="bg-white p-2 rounded border-l-2 border-amber-400">
                        <div className="font-medium text-gray-700 truncate">{task.taskName.substring(0, 40)}</div>
                        <div className="text-gray-600 text-[11px] mt-0.5">
                          {oldDueStr} <span className="text-amber-600 font-bold">→</span> {newDueStr}
                        </div>
                      </div>
                    );
                  })}
                  {tasksOnLeaveDate.length > 5 && (
                    <div className="text-gray-500 text-center py-1">+{tasksOnLeaveDate.length - 5} more shifts</div>
                  )}
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleAddLeaveToQueue}
              disabled={!startLeaveDate || !endLeaveDate || !leaveReason}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-light"
            >
              <Plus className="w-4 h-4" />
              Add Request
            </Button>
          </div>
        </div>

        {/* Queued Leaves */}
        <div className="space-y-3">
          <h3 className="text-lg font-light text-gray-900">Queued Requests ({pendingLeaveRanges.length})</h3>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 h-[300px] overflow-y-auto shadow-sm space-y-3">
            {pendingLeaveRanges.length > 0 ? (
              <>
                {pendingLeaveRanges.map((range, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-light text-gray-600 uppercase">Leave {idx + 1}</p>
                        <p className="text-sm font-light text-gray-900">
                          {new Date(range.start).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})} → {new Date(range.end).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveLeaveRange(idx)} className="text-red-500 hover:bg-red-50 p-1">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{range.reason}</p>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-xs">No queued requests yet</p>
              </div>
            )}
          </div>

          {pendingLeaveRanges.length > 0 && (
            <Button
              onClick={handleSubmitAllLeaves}
              className="w-full bg-green-600 hover:bg-green-700 text-white border-0 gap-2 font-light"
            >
              <Send className="w-4 h-4" />
              Submit All ({pendingLeaveRanges.length})
            </Button>
          )}
        </div>
      </div>

      {/* --- NEW CALENDAR DAY DETAILS MODAL --- */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-light text-gray-900">
              Tasks for {selectedDayDetails?.date ? new Date(selectedDayDetails.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''}
            </DialogTitle>
            <DialogDescription>
              Review the tasks scheduled for this day.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {selectedDayDetails && selectedDayDetails.tasks.length > 0 ? (
              selectedDayDetails.tasks.map(task => (
                <div key={task.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs font-medium">
                      {task.projectName}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border">
                      {task.hours}h allocated
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm leading-snug">{task.taskName}</h4>
                  <div className="mt-3 flex gap-3 text-xs text-gray-500">
                    <div>Started: <span className="text-gray-900">{task.created_date}</span></div>
                    <div>Due: <span className="text-gray-900">{task.due_date}</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <p>No tasks scheduled for this day.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}