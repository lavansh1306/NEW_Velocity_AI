/**
 * src/components/leave-management/types.ts
 * * Strictly typed interfaces for Supabase Leave Management System.
 * All IDs are strings to accommodate PostgreSQL UUIDs.
 */

export interface TimeLog {
  id: string; 
  hours: number;
  checkpoint: string;
  timestamp: string;
}

export interface Task {
  id: string; // UUID from jira_issues or tasks table
  projectName: string;
  taskName: string;
  assignee: string; // Usually email from jira_issues
  assigneeName?: string; // NEW: Name from users table
  hours: number; 
  status: string;
  requiredSkills?: string[];
  isReallocated?: boolean;
  isCancelled?: boolean;
  originalAssignee?: string;
  logs?: TimeLog[];
  totalLogged?: number;
  created_date?: string;
  due_date?: string;
}

export interface LeaveType {
  id: string; // UUID
  organization_id: string;
  name: string;
  annual_quota: number;
}

export interface LeaveBalance {
  id: string; // UUID
  organization_id: string;
  user_id: string;
  leave_type_id: string;
  year: number;
  total_allocated: number;
  used_days: number;
  pending_days: number;
  // Included via Supabase .select('..., leave_types(*)')
  leave_types?: {
    name: string;
    annual_quota: number;
  };
}

export interface LeaveRequest {
  id: string; // UUID
  organization_id: string;
  user_id: string;
  leave_type_id: string;
  startDate: string; // Maps from start_date (ISO string)
  endDate: string;   // Maps from end_date (ISO string)
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  // UI-specific joined fields
  name: string;           // Joined from users.name
  leave_type_name?: string; // Joined from leave_types.name
}

export interface EmployeeProfile {
  id: string; // UUID from users table
  organization_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  capacity_hours_per_week: number;
  is_active: boolean;
  skills?: string[]; // Often joined from user_skills table
}

/**
 * Mapping helper for CSV/Jira imports if required
 */
export const SCHEMA_MAP = {
  assignee: ['assignee_email', 'employee', 'name', 'user'],
  projectName: ['project_name', 'site_url', 'project_key'],
  taskName: ['summary', 'task', 'description'],
  hours: ['original_estimate_seconds', 'hours', 'effort'],
  status: ['status', 'state']
};