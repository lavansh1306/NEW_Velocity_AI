export interface TimeLog {
  id: number;
  hours: number;
  checkpoint: string;
  timestamp: string;
}

export interface Task {
  id: number;
  projectName: string;
  taskName: string;
  assignee: string;
  hours: number; // Planned hours
  day: number; // 0-4 (Mon-Fri)
  requiredSkills: string[];
  isReallocated?: boolean;
  isCancelled?: boolean;
  originalAssignee?: string;
  logs?: TimeLog[];
  totalLogged?: number;
  created_date?: string; // ISO date string
  due_date?: string; // ISO date string
}

export interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface EmployeeProfile {
  name: string;
  role: string;
  skills: string[];
}

export const SCHEMA_MAP = {
  assignee: ['employee', 'name', 'staff', 'resource', 'user', 'member'],
  projectName: ['project', 'project name', 'job', 'client', 'account'],
  taskName: ['task', 'task name', 'description', 'activity', 'detail'],
  hours: ['hours', 'hr', 'duration', 'time spent', 'effort'],
  day: ['day', 'date', 'weekday', 'timestamp']
};