export type ProjectCategory = 'Client Deliverable' | 'Internal Tool' | 'R&D / POC' | 'Maintenance';
export type ProjectStatus = 'DRAFT' | 'QUEUED' | 'ACTIVE' | 'COMPLETED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
}