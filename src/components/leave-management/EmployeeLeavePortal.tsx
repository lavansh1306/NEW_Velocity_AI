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
  leaveTypes?: any[]; // NEW: Required for absolute dropdown list
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
  leaveTypes = [], // NEW
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
    <div className="space-y-6 animate-in fade-in duration-500 bg-[#FAFAF9] min-h-screen p-4 sm:p-8 font-['Inter',sans-serif]">
      
      {/* Sleek Top Header Banner */}
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#121212] to-[#262626] flex items-center justify-center text-white shadow-xl shadow-gray-900/10">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#121212] tracking-tight">{selectedEmployee}</h3>
            <p className="text-xs text-[#78716C] font-normal mt-0.5">{currentUserEmail}</p>
          </div>
        </div>
        
        <div className="flex gap-8 border-t md:border-t-0 md:border-l border-[#E7E5E4] pt-4 md:pt-0 md:pl-8">
          <div>
            <div className="text-2xl font-bold text-[#121212] tracking-tight">{userTasks.length}</div>
            <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-wider mt-1">Active Tasks</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {leaveBalances.find(b => b.leave_types?.name.toLowerCase().includes('annual'))?.total_allocated || '--'}
            </div>
            <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-wider mt-1">Annual Balance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Unified Calendar Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm">
            
            {/* Calendar Header with compact styling */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#121212] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#121212]" />
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1 bg-white border border-[#E7E5E4] rounded-full p-1 shadow-sm">
                <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-[#F5F5F4] rounded-full text-[#78716C]" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-[#F5F5F4] rounded-full text-[#78716C]" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Continuous Unified Grid Calendar Layout */}
            <div className="border border-[#E7E5E4] rounded-2xl overflow-hidden bg-[#E7E5E4] gap-px grid grid-cols-7 ">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-[#FAFAF9] text-center text-[11px] font-bold text-[#78716C] uppercase py-3 border-b border-[#E7E5E4]">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const isCellEmpty = day === null;
                if (isCellEmpty) return <div key={`empty-${idx}`} className="aspect-square bg-[#FAFAF9]/50 min-h-[90px]" />;

                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const isRangeStart = dateStr === startLeaveDate;
                const isRangeEnd = dateStr === (endLeaveDate || startLeaveDate);
                const isInRange = startLeaveDate && endLeaveDate && dateStr > startLeaveDate && dateStr < endLeaveDate;
                
                const existingLeave = getLeaveOnDate(dateStr);
                const isBlocked = !!existingLeave;
                const dayTasks = getTasksForDay(day);
                const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                const isRange = isRangeStart || isRangeEnd || isInRange;
                const statusColor = existingLeave?.status === 'approved' 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={isBlocked && existingLeave?.user_id !== currentUserProfile?.id} // Only let them click if they own it? Usually blocked is blocked
                    className={`
                      aspect-square min-h-[90px] p-3 flex flex-col items-start justify-between transition-all relative overflow-hidden group bg-white
                      ${isBlocked 
                        ? existingLeave?.status === 'approved' 
                            ? 'bg-green-50 text-green-900 border-green-100' // Green if Accepted
                            : 'bg-amber-100 text-amber-900 border-amber-200/80' // Dark yellow if Pending
                        : isRange 
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' // Slight yellow for Selection
                            : 'hover:bg-[#FAFAF9] text-[#78716C]'}
                    `}
                  >
                    <span className={`text-xs font-semibold ${isRange ? 'text-amber-900' : isToday && !isBlocked ? 'text-emerald-600' : 'text-[#78716C]'}`}>
                      {day}
                    </span>

                    {/* Compact Task Dots or List */}
                    {dayTasks.length > 0 && !isBlocked && (
                      <div className="w-full mt-auto">
                        <div className="flex flex-col gap-0.5">
                          {dayTasks.slice(0, 1).map((t, i) => (
                            <div key={i} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full truncate text-center ${isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {t.taskName.slice(0, 12)}
                            </div>
                          ))}
                          {dayTasks.length > 1 && <span className="text-[8px] text-[#A8A29E] pl-1">+{dayTasks.length-1} more</span>}
                        </div>
                      </div>
                    )}

                    {/* Small Status Badge for blocked instead of overlay if preferred, or nothing since bg is sufficient */}
                    {isBlocked && (
                      <div className="mt-auto w-full flex justify-end">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded
                          ${existingLeave?.status === 'approved' ? 'bg-green-200/50 text-green-900' : 'bg-amber-200/50 text-amber-900'}
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

        {/* RIGHT COLUMN: Action Panel / Request Panel */}
        <div className="space-y-6">
          
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-semibold text-[#121212] mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#121212]" />
              New Request
            </h3>

            <div className="space-y-4">
              {/* Dates Display sleek */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAFAF9] p-3 rounded-xl border border-[#E7E5E4]">
                  <span className="text-[10px] text-[#78716C] font-semibold uppercase tracking-wider block mb-1">Start Date</span>
                  <div className="font-semibold text-sm text-[#121212]">
                    {startLeaveDate ? new Date(startLeaveDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '—'}
                  </div>
                </div>
                <div className="bg-[#FAFAF9] p-3 rounded-xl border border-[#E7E5E4]">
                  <span className="text-[10px] text-[#78716C] font-semibold uppercase tracking-wider block mb-1">End Date</span>
                  <div className="font-semibold text-sm text-[#121212]">
                    {endLeaveDate ? new Date(endLeaveDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '—'}
                  </div>
                </div>
              </div>

              {/* Leave Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#78716C] font-semibold uppercase tracking-wider">Leave Type</label>
                <Select value={selectedLeaveTypeId} onValueChange={setSelectedLeaveTypeId}>
                  <SelectTrigger className="w-full bg-white border-[#E7E5E4] rounded-xl h-10 shadow-sm">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl">
                    {leaveTypes.map((type: any) => {
                      const bal = leaveBalances?.find(b => b.leave_type_id === type.id);
                      return (
                        <SelectItem key={type.id} value={type.id} className="text-sm">
                          {type.name} {bal ? `(${bal.total_allocated - (bal.used_days || 0)} days left)` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#78716C] font-semibold uppercase tracking-wider">Reason</label>
                <textarea 
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full h-24 p-3 text-sm bg-white border border-[#E7E5E4] rounded-xl focus:ring-1 focus:ring-[#121212] focus:border-[#121212] outline-none resize-none shadow-sm"
                  placeholder="Details for manager..."
                />
              </div>

              {/* Shift Impact Preview with Alert banner vibe */}
              {tasksOnLeaveDate.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-800 uppercase mb-0.5">Timeline Impact</div>
                    <p className="text-[11px] text-amber-700 leading-normal">
                      Submission impacts <span className="font-bold">{tasksOnLeaveDate.length} active task deadlines</span>. Updates propose batched schedules.
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAddLeaveToQueue}
                className="w-full bg-[#121212] hover:bg-[#262626] text-white rounded-xl shadow-sm h-10"
                disabled={!startLeaveDate || !leaveReason || !selectedLeaveTypeId}
              >
                Add to Queue
              </Button>
            </div>
          </div>

          {/* Queue List with Clean Item List */}
          {pendingLeaveRanges.length > 0 && (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm animate-in slide-in-from-bottom-3">
              <h3 className="text-sm font-semibold text-[#121212] mb-4 flex justify-between items-center">
                Request Queue
                <Badge className="bg-[#121212] text-white p-1 px-2 rounded-full text-xs">{pendingLeaveRanges.length}</Badge>
              </h3>
              
              <div className="space-y-2 mb-4">
                {pendingLeaveRanges.map((range, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4]">
                    <div>
                      <div className="text-xs font-bold text-[#121212]">
                        {new Date(range.start).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                        {' '}-{' '} 
                        {new Date(range.end).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </div>
                      <div className="text-[10px] text-[#78716C] truncate max-w-[150px] mt-0.5">{range.reason}</div>
                    </div>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F5F4] rounded-full text-red-500" onClick={() => setPendingLeaveRanges(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSubmitAllLeaves} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 shadow-sm">
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