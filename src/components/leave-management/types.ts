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