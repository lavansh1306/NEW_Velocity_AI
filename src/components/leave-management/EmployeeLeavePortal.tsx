import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertCircle, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Info, 
  Clock, 
  Briefcase, 
  Coffee, 
  Calendar,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Ensure you have this UI component
import { Task, EmployeeProfile, LeaveRequest, LeaveBalance } from './types';

interface EmployeeLeavePortalProps {
  tasks: Task[];
  employees: EmployeeProfile[];
  currentUserEmail: string;
  existingLeaves?: LeaveRequest[];
  leaveBalances?: LeaveBalance[]; // NEW: Required for dropdown
  onLeaveRequest: (leaveData: {
    employeeName: string;
    startDate: string;
    endDate: string;
    reason: string;
    leave_type_id: string; // NEW: Required by DB
    affectedTasks: Task[];
    project: string;
  }) => void;
}

// Helper to handle timezone issues
const parseLocalMidnight = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function EmployeeLeavePortal({
  tasks,
  employees,
  currentUserEmail,
  onLeaveRequest,
  existingLeaves = [],
  leaveBalances = [],
}: EmployeeLeavePortalProps) {
  
  // Find the current user's profile ID based on email
  const currentUserProfile = useMemo(() => {
    return employees.find(emp => emp.email?.toLowerCase() === currentUserEmail?.toLowerCase()) 
      || employees.find(emp => emp.name === currentUserEmail);
  }, [employees, currentUserEmail]);

  const selectedEmployee = currentUserProfile?.name || currentUserEmail;

  // State
  const [startLeaveDate, setStartLeaveDate] = useState<string>('');
  const [endLeaveDate, setEndLeaveDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [pendingLeaveRanges, setPendingLeaveRanges] = useState<Array<{
    start: string, 
    end: string, 
    reason: string,
    typeId: string
  }>>([]);

  // Modal State
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ date: string, tasks: Task[] } | null>(null);

  // 1. Filter tasks for this user
  const userTasks = useMemo(() => {
    const emailLower = currentUserEmail?.toLowerCase() || '';
    return tasks.filter(t => {
      if (!t || t.isCancelled) return false;
      const assigneeEmail = (t.assignee || '').toLowerCase();
      return assigneeEmail === emailLower || t.assignee === selectedEmployee;
    });
  }, [tasks, selectedEmployee, currentUserEmail]);

  // 2. Auto-set calendar month to where tasks are
  useEffect(() => {
    if (userTasks.length > 0) {
      const dates = userTasks
        .map(t => t.due_date ? parseLocalMidnight(t.due_date) : null)
        .filter(Boolean) as Date[];
      
      if (dates.length > 0) {
        dates.sort((a, b) => b.getTime() - a.getTime());
        // setCurrentMonth(dates[0]); // Optional: Jump to latest task
      }
    }
  }, [userTasks.length]); // Run once when tasks load

  // 3. Helper: Check if a date has existing leave (Strict UUID check)
  const getLeaveOnDate = (dateStr: string) => {
    if (!existingLeaves || !currentUserProfile?.id) return undefined;
    
    const d = parseLocalMidnight(dateStr);

    return existingLeaves.find(l => {
      if (l.user_id !== currentUserProfile.id) return false;
      if (l.status === 'rejected') return false; 
      
      const s = parseLocalMidnight(l.startDate);
      const e = parseLocalMidnight(l.endDate);
      e.setHours(23, 59, 59, 999);
      
      return d >= s && d <= e;
    });
  };

  // 4. Calendar Generation
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

    return userTasks.filter(task => {
      if (task.created_date && task.due_date) {
        const taskStart = parseLocalMidnight(task.created_date);
        const taskEnd = parseLocalMidnight(task.due_date);
        taskEnd.setHours(23, 59, 59, 999);
        return cellDate >= taskStart && cellDate <= taskEnd;
      }
      return false;
    });
  };

  const tasksOnLeaveDate = useMemo(() => {
    if (!startLeaveDate) return [];
    
    const rangeStart = parseLocalMidnight(startLeaveDate);
    const rangeEnd = parseLocalMidnight(endLeaveDate || startLeaveDate);
    rangeEnd.setHours(23, 59, 59, 999);

    return userTasks.filter(task => {
      if (task.created_date && task.due_date) {
        const taskStart = parseLocalMidnight(task.created_date);
        const taskEnd = parseLocalMidnight(task.due_date);
        taskEnd.setHours(23, 59, 59, 999);
        return taskStart <= rangeEnd && taskEnd >= rangeStart;
      }
      return false;
    });
  }, [startLeaveDate, endLeaveDate, userTasks]);

  // 5. Interaction Handlers
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = new Date(clickedDate.getTime() - (clickedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    const existingLeave = getLeaveOnDate(dateStr);
    if (existingLeave) {
      alert(`These dates are already marked as ${existingLeave.status}.`);
      return;
    }
    
    if (!startLeaveDate || (startLeaveDate && endLeaveDate)) {
      setStartLeaveDate(dateStr);
      setEndLeaveDate('');
    } else if (dateStr < startLeaveDate) {
      setStartLeaveDate(dateStr);
      setEndLeaveDate(startLeaveDate);
    } else {
      setEndLeaveDate(dateStr);
    }
  };

  const handleAddLeaveToQueue = () => {
    if (!startLeaveDate || !leaveReason || !selectedLeaveTypeId) {
      alert('Please select dates, a leave type, and provide a reason.');
      return;
    }

    const finalEndDate = endLeaveDate || startLeaveDate;
    const rangeStart = parseLocalMidnight(startLeaveDate);
    const rangeEnd = parseLocalMidnight(finalEndDate);
    
    // Check overlaps
    const overlaps = (existingLeaves || []).some(l => {
      if (l.user_id !== currentUserProfile?.id || l.status === 'rejected') return false;
      const s = parseLocalMidnight(l.startDate);
      const e = parseLocalMidnight(l.endDate);
      return s <= rangeEnd && e >= rangeStart;
    });

    if (overlaps) {
      alert('Selected range overlaps with an existing request.');
      return;
    }

    setPendingLeaveRanges(prev => [...prev, {
      start: startLeaveDate, 
      end: finalEndDate, 
      reason: leaveReason,
      typeId: selectedLeaveTypeId
    }]);

    // Reset fields
    setStartLeaveDate('');
    setEndLeaveDate('');
    setLeaveReason('');
    setSelectedLeaveTypeId('');
  };

  const handleSubmitAllLeaves = () => {
    if (pendingLeaveRanges.length === 0) return;

    pendingLeaveRanges.forEach(range => {
      onLeaveRequest({
        employeeName: selectedEmployee,
        startDate: range.start,
        endDate: range.end,
        reason: range.reason,
        leave_type_id: range.typeId,
        affectedTasks: tasksOnLeaveDate, // Note: This logic might need adjustment if multiple ranges affect different tasks
        project: 'All',
      });
    });

    setPendingLeaveRanges([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 bg-gray-50 min-h-screen p-8 font-['Inter',sans-serif]">
      
      {/* Employee Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-blue-200 shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-light text-gray-900">{selectedEmployee}</h3>
              <p className="text-sm text-gray-500 font-light">{currentUserEmail}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extralight text-blue-600">{userTasks.length}</div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Tasks</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-light text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 uppercase py-2">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="h-28 bg-gray-50/50 rounded-xl" />;

                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isRangeStart = dateStr === startLeaveDate;
                const isRangeEnd = dateStr === (endLeaveDate || startLeaveDate);
                const isInRange = startLeaveDate && endLeaveDate && dateStr > startLeaveDate && dateStr < endLeaveDate;
                
                const existingLeave = getLeaveOnDate(dateStr);
                const isBlocked = !!existingLeave;
                const dayTasks = getTasksForDay(day);
                const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={isBlocked}
                    className={`
                      h-28 rounded-xl p-2 flex flex-col items-start justify-between transition-all relative overflow-hidden group
                      ${isBlocked 
                        ? 'bg-stripes-gray opacity-80 cursor-not-allowed border border-gray-100' 
                        : 'bg-white border border-gray-100 hover:border-blue-400 hover:shadow-md cursor-pointer'}
                      ${(isRangeStart || isRangeEnd) ? 'bg-blue-600 text-white ring-2 ring-blue-200 border-transparent z-10' : ''}
                      ${isInRange ? 'bg-blue-50 border-blue-200' : ''}
                      ${isToday && !isBlocked && !isRangeStart ? 'ring-1 ring-amber-400 bg-amber-50/30' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium ${isRangeStart || isRangeEnd ? 'text-white' : 'text-gray-700'}`}>
                      {day}
                    </span>

                    {/* Task Dots */}
                    {dayTasks.length > 0 && !isBlocked && (
                      <div className="w-full space-y-1">
                        <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md w-full truncate text-left
                          ${isRangeStart || isRangeEnd ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}
                        `}>
                          {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-0.5 pl-0.5">
                           {dayTasks.slice(0,3).map((_, i) => (
                             <div key={i} className={`w-1 h-1 rounded-full ${isRangeStart || isRangeEnd ? 'bg-white' : 'bg-blue-400'}`} />
                           ))}
                        </div>
                      </div>
                    )}

                    {/* Blocked Overlay */}
                    {isBlocked && (
                      <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-[1px]
                        ${existingLeave?.status === 'pending' ? 'bg-amber-100/50' : 'bg-green-100/50'}
                      `}>
                         <span className={`text-[10px] font-bold uppercase tracking-wider -rotate-12 border px-2 py-0.5 rounded shadow-sm bg-white
                           ${existingLeave?.status === 'pending' ? 'text-amber-700 border-amber-200' : 'text-green-700 border-green-200'}
                         `}>
                           {existingLeave?.status}
                         </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Action Panel */}
        <div className="space-y-6">
          
          {/* Form Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-light text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              New Request
            </h3>

            <div className="space-y-4">
              {/* Dates Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Start</span>
                  <div className="font-medium text-gray-900">
                    {startLeaveDate ? new Date(startLeaveDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">End</span>
                  <div className="font-medium text-gray-900">
                    {endLeaveDate ? new Date(endLeaveDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}
                  </div>
                </div>
              </div>

              {/* Leave Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Leave Type</label>
                <Select value={selectedLeaveTypeId} onValueChange={setSelectedLeaveTypeId}>
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveBalances?.map(bal => (
                      <SelectItem key={bal.leave_type_id} value={bal.leave_type_id}>
                        {bal.leave_types?.name} ({bal.total_allocated - (bal.used_days || 0)} left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Reason</label>
                <textarea 
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full h-24 p-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-light"
                  placeholder="Details for manager..."
                />
              </div>

              {/* Shift Impact Preview */}
              {tasksOnLeaveDate.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    Impact Analysis
                  </div>
                  <p className="text-xs text-amber-900 mb-2">
                    This request affects <span className="font-bold">{tasksOnLeaveDate.length} tasks</span>. 
                    Deadlines will shift forward by <span className="font-bold">
                      {Math.ceil((new Date(endLeaveDate || startLeaveDate).getTime() - new Date(startLeaveDate).getTime()) / 86400000) + 1} days
                    </span>.
                  </p>
                </div>
              )}

              <Button 
                onClick={handleAddLeaveToQueue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                disabled={!startLeaveDate || !leaveReason || !selectedLeaveTypeId}
              >
                Add to Queue
              </Button>
            </div>
          </div>

          {/* Queue List */}
          {pendingLeaveRanges.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-in slide-in-from-bottom-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex justify-between items-center">
                Request Queue
                <Badge variant="secondary">{pendingLeaveRanges.length}</Badge>
              </h3>
              
              <div className="space-y-3 mb-4">
                {pendingLeaveRanges.map((range, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <div className="text-xs font-bold text-gray-700">
                        {new Date(range.start).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                        {' '}-{' '} 
                        {new Date(range.end).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{range.reason}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setPendingLeaveRanges(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSubmitAllLeaves} className="w-full bg-green-600 hover:bg-green-700 text-white">
                Submit All Requests
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Day Details Modal */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent>
           {/* Reuse existing modal content logic here if needed */}
        </DialogContent>
      </Dialog>
    </div>
  );
}