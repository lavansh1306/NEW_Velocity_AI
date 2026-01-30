// src/components/unified-system/types.ts

export type ProjectStatus = 'DRAFT' | 'QUEUED' | 'ACTIVE' | 'COMPLETED';

export interface UnifiedProject {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  
  // AI Estimates (The "Plan")
  requiredSkills: string[];
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High';
  
  // Execution Data (The "Reality")
  assignedTeamIds: number[]; 
  startDate?: string;
  deadline?: string;
}

export interface UnifiedEmployee {
  id: number;
  name: string;
  role: string;
  skills: string[];
  
  // Reinforcement Learning Parameters
  efficiencyRating: number; // Starts at 1.0. >1.0 = High Performer
  currentLoad: number; // 0-100%
  availableFrom: string; // Date string
  
  // Historical stats (Derived from CSV)
  totalProjectsCompleted: number;
  avgHoursPerTask: number;
}