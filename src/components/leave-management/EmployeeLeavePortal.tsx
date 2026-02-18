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
    <div className="space-y-6 animate-in fade-in duration-500 bg-gray-50 min-h-screen p-12 font-['Inter',sans-serif]">
      {/* Employee Info - Display Current Employee */}
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
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110 transform"
            >
              <ChevronLeft className="w-6 h-6 text-blue-600 font-light" />
            </button>
            <h3 className="font-light text-xl text-gray-900 min-w-[240px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110 transform"
            >
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
                  className={`h-24 rounded-lg transition-all relative group flex flex-col items-center justify-start p-2 border hover:scale-105 transform cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                      : isToday
                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                      : isWeekend
                      ? 'bg-gray-50 border-gray-300 text-gray-400'
                      : 'bg-white border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <span className={`text-lg font-light mb-1 ${isSelected ? 'text-white' : isWeekend ? 'text-gray-400' : 'text-gray-700'}`}>
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
                    <span className={`text-[10px] font-light mt-auto ${isSelected ? 'text-blue-200' : 'text-gray-600'}`}>
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
          <h3 className="text-lg font-light text-gray-900">
            {selectedLeaveDate ? `${selectedEmployee}'s Tasks` : 'Select a Date'}
          </h3>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 h-[300px] overflow-y-auto shadow-sm">
            {selectedLeaveDate ? (
              tasksOnLeaveDate.length > 0 ? (
                <div className="space-y-3">
                  {tasksOnLeaveDate.map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 border-l-4 border-blue-600 rounded-lg">
                      <p className="font-light text-gray-900 text-sm mb-1">{task.taskName}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-full font-light">
                          {task.projectName}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-light">
                          {task.hours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm">No tasks on this date</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm">Pick a date from the calendar</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Request Form */}
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          <h3 className="text-lg font-light text-gray-900">Leave Request</h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-light text-gray-700">
              📝 Reason for Leave
            </label>
            <textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g., Medical appointment, Personal event..."
              className="w-full h-24 px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none font-light"
            />
          </div>

          {/* Impact Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
            <h4 className="font-light text-gray-900 text-sm">Impact Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Tasks Affected:</span>
                <span className="font-light text-gray-900">{tasksOnLeaveDate.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Hours Lost:</span>
                <span className="font-light text-gray-900">{totalHoursAffected}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Leave Date:</span>
                <span className="font-light text-gray-900">
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
              className="flex-1 border border-gray-300 hover:bg-gray-50 font-light"
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-light"
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
