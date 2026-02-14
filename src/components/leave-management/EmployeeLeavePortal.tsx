import React, { useState, useMemo } from 'react';
import { AlertCircle, Send, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Task, EmployeeProfile } from './types';

interface EmployeeLeavePortalProps {
  tasks: Task[];
  employees: EmployeeProfile[];
  currentUserEmail: string;
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
}: EmployeeLeavePortalProps) {
  // Initialize selected employee - use current user if available, otherwise first employee
  const [selectedEmployee, setSelectedEmployee] = useState<string>(() => {
    // Check if currentUserEmail matches any employee name
    const matchingEmployee = employees.find(emp => 
      emp.name.toLowerCase() === currentUserEmail.toLowerCase()
    );
    return matchingEmployee?.name || employees[0]?.name || currentUserEmail;
  });
  const [selectedLeaveDate, setSelectedLeaveDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all tasks by employee
  const activeTasks = useMemo(() => {
    return tasks.filter(t => !t.isCancelled);
  }, [tasks]);

  // Filter tasks for selected employee first
  const userTasks = useMemo(() => {
    return activeTasks.filter(t => t.assignee === selectedEmployee);
  }, [activeTasks, selectedEmployee]);

  // Update calendar month when selected employee changes
  React.useEffect(() => {
    if (userTasks.length === 0) {
      setCurrentMonth(new Date());
      return;
    }
    
    const taskDates = userTasks
      .map(t => new Date(t.due_date || t.created_date || new Date()))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const lastDate = taskDates[0];
    setCurrentMonth(new Date(lastDate.getFullYear(), lastDate.getMonth(), 1));
  }, [selectedEmployee, userTasks]);

  // Generate calendar grid
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

  // Get tasks for a specific calendar day - only for selected employee
  const getTasksForDay = (day: number) => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    cellDate.setHours(0, 0, 0, 0);

    const tasksOnDay: Task[] = [];
    const selectedEmpColor = employeeColors[employees.findIndex(e => e.name === selectedEmployee) % employeeColors.length];

    userTasks.forEach(task => {
      let taskStart: Date;
      let taskEnd: Date;

      if (task.created_date && task.due_date) {
        taskStart = new Date(task.created_date);
        taskStart.setHours(0, 0, 0, 0);
        taskEnd = new Date(task.due_date);
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

  // Get selected employee's tasks on leave date
  const tasksOnLeaveDate = useMemo(() => {
    if (!selectedLeaveDate) return [];

    const leaveDate = new Date(selectedLeaveDate);
    leaveDate.setHours(0, 0, 0, 0);

    return userTasks.filter(task => {
      let taskStart: Date;
      let taskEnd: Date;

      if (task.created_date && task.due_date) {
        taskStart = new Date(task.created_date);
        taskStart.setHours(0, 0, 0, 0);
        taskEnd = new Date(task.due_date);
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

      return leaveDate >= taskStart && leaveDate <= taskEnd;
    });
  }, [selectedLeaveDate, userTasks, currentMonth]);

  const totalHoursAffected = tasksOnLeaveDate.reduce((sum, task) => sum + task.hours, 0);

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveDate || !leaveReason) {
      alert('Please select a date and provide a reason');
      return;
    }

    onLeaveRequest({
      employeeName: selectedEmployee,
      startDate: selectedLeaveDate,
      endDate: selectedLeaveDate,
      reason: leaveReason,
      affectedTasks: tasksOnLeaveDate,
      project: 'All',
    });

    setLeaveReason('');
    setSelectedLeaveDate('');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Employee Info - Display Current Employee */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">👤</div>
            <div>
              <h3 className="font-bold text-slate-900">{selectedEmployee}</h3>
              <p className="text-xs text-slate-600">Employee Leave Request</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{userTasks.length}</p>
            <p className="text-xs text-slate-600">active task{userTasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-indigo-600" />
          {selectedEmployee}'s Task Calendar
        </h3>
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors hover:scale-110 transform"
            >
              <ChevronLeft className="w-6 h-6 text-blue-600 font-bold" />
            </button>
            <h3 className="font-bold text-xl text-slate-900 min-w-[240px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors hover:scale-110 transform"
            >
              <ChevronRight className="w-6 h-6 text-blue-600 font-bold" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-white py-2 bg-slate-600 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-24 bg-slate-100 rounded-lg opacity-40" />;
              }

              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedLeaveDate === dateStr;
              const dayTasksData = getTasksForDay(day);
              const dayTasks = dayTasksData.tasks;
              const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
              const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedLeaveDate(dateStr)}
                  className={`h-24 rounded-lg transition-all relative group flex flex-col items-center justify-start p-2 border-2 hover:scale-105 transform cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg'
                      : isToday
                      ? 'bg-blue-50 border-blue-400 shadow-md'
                      : isWeekend
                      ? 'bg-slate-100 border-slate-300 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <span className={`text-lg font-bold mb-1 ${isSelected ? 'text-white' : isWeekend ? 'text-slate-400' : 'text-slate-700'}`}>
                    {day}
                  </span>
                  
                  {/* Task color indicator */}
                  <div className="flex flex-wrap gap-1 w-full justify-center">
                    {dayTasks.length > 0 && (
                      <>
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            isSelected ? 'bg-yellow-300' : dayTasksData.color.badge
                          }`}
                          title={selectedEmployee}
                        />
                      </>
                    )}
                  </div>

                  {dayTasks.length > 0 && (
                    <span className={`text-[10px] font-bold mt-auto ${isSelected ? 'text-yellow-200' : 'text-slate-600'}`}>
                      {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                    </span>
                  )}

                  {isToday && !isSelected && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Tasks and Form */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasks on Selected Date */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">
            {selectedLeaveDate ? `${selectedEmployee}'s Tasks` : 'Select a Date'}
          </h3>
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 h-[300px] overflow-y-auto shadow-md">
            {selectedLeaveDate ? (
              tasksOnLeaveDate.length > 0 ? (
                <div className="space-y-3">
                  {tasksOnLeaveDate.map((task) => (
                    <div key={task.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                      <p className="font-bold text-slate-900 text-sm mb-1">{task.taskName}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 bg-indigo-200 text-indigo-900 rounded-full font-semibold">
                          {task.projectName}
                        </span>
                        <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded-full">
                          {task.hours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm">No tasks on this date</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm">Pick a date from the calendar</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Request Form */}
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Leave Request</h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              📝 Reason for Leave
            </label>
            <textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g., Medical appointment, Personal event..."
              className="w-full h-24 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm resize-none"
            />
          </div>

          {/* Impact Summary */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4 space-y-3">
            <h4 className="font-bold text-orange-900 text-sm">Impact Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-orange-700">Tasks Affected:</span>
                <span className="font-bold text-orange-900">{tasksOnLeaveDate.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Hours Lost:</span>
                <span className="font-bold text-orange-900">{totalHoursAffected}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Leave Date:</span>
                <span className="font-bold text-orange-900">
                  {selectedLeaveDate ? new Date(selectedLeaveDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              type="button" 
              className="flex-1 border-2 border-slate-300 hover:bg-slate-50"
              onClick={() => {
                setLeaveReason('');
                setSelectedLeaveDate('');
              }}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={!selectedLeaveDate || !leaveReason}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-0 gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              <Send className="w-4 h-4" />
              Submit Leave
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
