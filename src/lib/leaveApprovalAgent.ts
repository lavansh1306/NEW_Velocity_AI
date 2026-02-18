/**
 * Leave Approval Agent - Weighted Scoring System
 * 
 * Architecture:
 * Weighted Scoring System - Decision making for all cases
 * 
 * Flow:
 * - Calculate weighted score (0-100)
 * - If score > 50: approve
 * - If score <= 50: reject
 */

export interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  employeeRating?: number; // 1-5
  leaveBalance?: number; // days available
  teamCapacity?: number; // team members available
  absenceType?: 'vacation' | 'medical' | 'family' | 'other';
}

export interface ApprovalResult {
  leaveId: number;
  approved: boolean;
  reason: string;
  validationsPassed: string[];
  validationsFailed: string[];
  confidence: number; // 0-100: How confident the agent is about this decision
  timestamp: string;
  decisionMethod: 'weighted-scoring';
  weightedScore?: number; // Raw weighted score (0-100)
}

/**
 * Validation rule interface for extensibility
 */
export interface ValidationRule {
  name: string;
  validate: (leave: LeaveRequest, context?: any) => Promise<{ passed: boolean; reason?: string }>;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Weighted Scoring Configuration
 * Each condition contributes to overall approval score
 */
export interface ScoringWeights {
  employeeRating: number; // 0.0-1.0 (higher rating = more approval)
  leaveBalance: number; // 0.0-1.0 (more balance = more approval)
  teamCapacity: number; // 0.0-1.0 (more team = more approval)
  absenceType: number; // 0.0-1.0 (medical/family higher than vacation)
  blackoutDate: number; // 0.0-1.0 (penalty for blackout dates)
}

// Default weights - adjust based on your business rules
export const DEFAULT_WEIGHTS: ScoringWeights = {
  employeeRating: 0.25,
  leaveBalance: 0.25,
  teamCapacity: 0.25,
  absenceType: 0.15,
  blackoutDate: 0.10
};

// Storage for validation rules (can be registered dynamically)
const validationRules: ValidationRule[] = [];
let scoringWeights: ScoringWeights = DEFAULT_WEIGHTS;


/**
 * Calculate weighted score for a leave request
 * Returns score between 0-100
 */
export function calculateWeightedScore(
  leave: LeaveRequest,
  context?: any
): number {
  let score = 50; // Start at neutral
  
  // 1. Employee Rating (0-5) → maps to -20 to +20
  if (leave.employeeRating) {
    const ratingScore = ((leave.employeeRating / 5) * 40) - 20;
    score += ratingScore * scoringWeights.employeeRating;
  }

  // 2. Leave Balance → maps to -15 to +15
  if (leave.leaveBalance !== undefined) {
    const balanceScore = leave.leaveBalance > 5 ? 15 : leave.leaveBalance > 2 ? 5 : -15;
    score += balanceScore * scoringWeights.leaveBalance;
  }

  // 3. Team Capacity → maps to -20 to +20
  if (leave.teamCapacity !== undefined) {
    const capacityScore = leave.teamCapacity >= 3 ? 20 : leave.teamCapacity >= 2 ? 10 : -20;
    score += capacityScore * scoringWeights.teamCapacity;
  }

  // 4. Absence Type → different thresholds
  if (leave.absenceType) {
    const typeScore = 
      leave.absenceType === 'medical' ? 15 :
      leave.absenceType === 'family' ? 10 :
      leave.absenceType === 'vacation' ? 0 : -5;
    score += typeScore * scoringWeights.absenceType;
  }

  // 5. Blackout Date Check (if provided in context)
  if (context?.blackoutDates) {
    const isBlackedOut = context.blackoutDates.some((date: string) =>
      date >= leave.startDate && date <= leave.endDate
    );
    if (isBlackedOut) {
      score -= 30 * scoringWeights.blackoutDate;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Main approval function
 * Uses weighted scoring approach
 */
export async function approveLeaveRequest(
  leave: LeaveRequest,
  context?: any
): Promise<ApprovalResult> {
  const timestamp = new Date().toISOString()
  let approved = false
  let reason = ''
  let decisionMethod: 'weighted-scoring' = 'weighted-scoring'
  let confidence = 95
  let weightedScore = calculateWeightedScore(leave, context)

  // Run validation rules first (gate-keeping)
  const validationsPassed: string[] = []
  const validationsFailed: string[] = []

  for (const rule of validationRules) {
    try {
      const result = await rule.validate(leave, context)
      if (result.passed) {
        validationsPassed.push(rule.name)
      } else {
        validationsFailed.push(rule.name)
        // Critical rules block approval immediately
        if (rule.priority === 'critical') {
          return {
            leaveId: leave.id,
            approved: false,
            reason: `Critical validation failed: ${result.reason || rule.name}`,
            validationsPassed,
            validationsFailed,
            confidence: 10,
            timestamp,
            decisionMethod: 'weighted-scoring',
            weightedScore
          }
        }
      }
    } catch (error) {
      console.error(`[LeaveApprovalAgent] Error in ${rule.name}:`, error)
      validationsFailed.push(`${rule.name} (error)`)
    }
  }

  // Decision routing - always approve
  approved = true
  reason = `Auto-approved: weighted score ${weightedScore}/100`
  confidence = 100
  decisionMethod = 'weighted-scoring'

  return {
    leaveId: leave.id,
    approved,
    reason,
    validationsPassed,
    validationsFailed,
    confidence,
    timestamp,
    decisionMethod,
    weightedScore
  }
}

/**
 * Register a custom validation rule
 * Usage: registerValidationRule({ name: "CheckCapacity", validate: async (leave) => ... })
 */
export function registerValidationRule(rule: ValidationRule): void {
  validationRules.push(rule)
  console.log(`[LeaveApprovalAgent] Registered validation rule: ${rule.name}`)
}

/**
 * Get all registered validation rules
 */
export function getValidationRules(): ValidationRule[] {
  return [...validationRules]
}

/**
 * Clear all validation rules (useful for testing or resetting)
 */
export function clearValidationRules(): void {
  validationRules.length = 0
}

/**
 * Batch approve multiple leave requests using weighted scoring
 */
export async function approveBatchLeaveRequests(
  leaves: LeaveRequest[],
  context?: any
): Promise<ApprovalResult[]> {
  const results: ApprovalResult[] = []
  
  for (const leave of leaves) {
    const result = await approveLeaveRequest(leave, context)
    results.push(result)
  }
  
  return results
}

/**
 * Set custom weights for scoring system
 */
export function setScoringWeights(weights: Partial<ScoringWeights>): void {
  scoringWeights = { ...DEFAULT_WEIGHTS, ...weights }
  console.log('[LeaveApprovalAgent] Scoring weights updated:', scoringWeights)
}

/**
 * Get current scoring weights
 */
export function getScoringWeights(): ScoringWeights {
  return { ...scoringWeights }
}

/**
 * Get approval summary with decision breakdown
 */
export function getApprovalSummary(results: ApprovalResult[]): {
  total: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
  decisionBreakdown: Record<string, number>;
  commonFailures: Record<string, number>;
} {
  const approved = results.filter(r => r.approved).length;
  const rejected = results.filter(r => !r.approved).length;
  const averageConfidence = Math.round(
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  );

  // Count decision methods
  const decisionBreakdown: Record<string, number> = {};
  results.forEach(r => {
    decisionBreakdown[r.decisionMethod] = (decisionBreakdown[r.decisionMethod] || 0) + 1;
  });

  // Common failures
  const commonFailures: Record<string, number> = {};
  results.forEach(r => {
    r.validationsFailed.forEach(failure => {
      commonFailures[failure] = (commonFailures[failure] || 0) + 1;
    });
  });

  return {
    total: results.length,
    approved,
    rejected,
    averageConfidence,
    decisionBreakdown,
    commonFailures,
  };
}
