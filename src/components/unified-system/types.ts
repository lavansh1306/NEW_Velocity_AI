export type ProjectCategory = 'Client Deliverable' | 'Internal Tool' | 'R&D / POC' | 'Maintenance';
export type ProjectStatus = 'DRAFT' | 'QUEUED' | 'ACTIVE' | 'COMPLETED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'ASSIGNMENT' | 'COMPLETION' | 'LEAVE_UPDATE' | 'SYSTEM';

export interface Notification {
  id: string;
  recipientRole: 'MANAGER' | 'EMPLOYEE' | 'ALL';
  recipientId?: number; 
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  isRead: boolean;
}
export interface LeaveRequest {
  id: string;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  type: 'Sick' | 'Vacation' | 'Personal';
}

export interface UnifiedProject {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory; 
  requiredSkills: string[];
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High';
  assignedTeamIds: number[]; 
  startDate?: string;
  deadline?: string;
}

export interface UnifiedEmployee {
  id: number;
  name: string;
  role: string;
  skills: string[];
  efficiencyRating: number;
  currentLoad: number;
  availableFrom: string;
  totalProjectsCompleted: number;
  avgHoursPerTask: number;
  isOnLeave?: boolean; 
  base_productive_hours?: number;
  pto_hours_this_week?: number;
  holiday_hours_this_week?: number;
}

export interface MLCandidate {
  id: string;
  current_load: number;
  skills: string[];
  role_level: 'junior' | 'mid' | 'senior' | 'lead';
  name?: string;
  availability_hours?: number;
  avg_completion_time?: number;
  base_productive_hours?: number;
  pto_hours_this_week?: number;
  holiday_hours_this_week?: number;
}

// 2. Add these new Request/Response interfaces anywhere in the file:
export interface CapacityRequest {
  candidates: MLCandidate[];
}

export interface CapacityReport {
  employee_id: string;
  name: string;
  base_productive_hours: number;
  pto_hours_this_week: number;
  holiday_hours_this_week: number;
  net_available_hours: number;
  status: string; // "Available", "At Capacity", or "Overloaded / Out of Office"
}