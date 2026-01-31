// src/components/unified-system/types.ts

export type ProjectCategory = 'Client Deliverable' | 'Internal Tool' | 'R&D / POC' | 'Maintenance';

/** * Lifecycle Stages:
 * QUEUED: Initial state (Draft/Queue)
 * READY_FOR_ALLOCATION: Requirements set, ready for team selection (Assignment)
 * ACTIVE: Project is running and visible to employees (Execution/Allocation)
 * COMPLETED: Project lifecycle finished
 */
export type ProjectStatus = 'QUEUED' | 'READY_FOR_ALLOCATION' | 'ACTIVE' | 'COMPLETED';

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
}