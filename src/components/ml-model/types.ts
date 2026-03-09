export interface EmployeeRecord {
  id: number;
  name: string;
  role: string;
  department: string;
  skills: string[];
  experience: number;
  currentLoad: number;
  efficiency: number;
  location: string;
}

export interface PredictionResult {
  employeeId: number;
  name: string;
  role: string;
  matchScore: number;
  score: number;
  skills: string[];
  topSkill: string;
  predictedVelocity: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
  isAvailable: boolean;
  currentLoad: number;
  efficiency: number;
  absenceProbability: number;
}