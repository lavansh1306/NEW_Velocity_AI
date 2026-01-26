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
  matchScore: number; // Internal precise score
  score: number;      // Display score (0-100)
  skills: string[];
  predictedVelocity: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
}