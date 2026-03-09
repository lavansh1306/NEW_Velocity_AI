// src/components/leave-management/types.ts

export interface TimeLog {
  id: string; // Changed to string for UUID compatibility
  hours: number;
  checkpoint: string;
  timestamp: string;
}

export interface Task {
  id: string | number;
  projectName: string;
  taskName: string;
  assignee: string;
  hours: number; 
  day: number;
  requiredSkills: string[];
  isReallocated?: boolean;
  isCancelled?: boolean;
  originalAssignee?: string;
  logs?: TimeLog[];
  totalLogged?: number;
  created_date?: string;
  due_date?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  annual_quota: number;
}

export interface LeaveBalance {
  id: string;
  leave_type_id: string;
  total_allocated: number;
  used_days: number;
  pending_days: number;
  leave_type?: LeaveType; // For joined data
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type_id: string;
  name: string; // From joined users table
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  leave_type_name?: string; // From joined leave_types table
}

export interface EmployeeProfile {
  id?: string;
  name: string;
  role: string;
  skills: string[];
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type_id: string; // Ensure this matches the DB UUID
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  leave_type_name?: string; 
}