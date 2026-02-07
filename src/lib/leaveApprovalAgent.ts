/**
 * Leave Approval Agent
 * 
 * Simple agent that approves leave requests with extensible validation rules.
 * Currently: Auto-approves all requests
 * Future: Can add validation rules like:
 *   - Check team capacity
 *   - Verify coverage availability
 *   - Check max leave balance
 *   - Blackout dates
 *   - Manager approval workflows
 */

export interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ApprovalResult {
  leaveId: number;
  approved: boolean;
  reason: string;
  validationsPassed: string[];
  validationsFailed: string[];
  confidence: number; // 0-100: How confident the agent is about this decision
  timestamp: string;
}

/**
 * Validation rule interface for extensibility
 */
interface ValidationRule {
  name: string;
  validate: (leave: LeaveRequest, context?: any) => Promise<{ passed: boolean; reason?: string }>;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Storage for validation rules (can be registered dynamically)
const validationRules: ValidationRule[] = [];

/**
 * Register a custom validation rule
 * Usage: registerValidationRule({ name: "CheckCapacity", validate: async (leave) => ... })
 */
export function registerValidationRule(rule: ValidationRule): void {
  validationRules.push(rule);
  console.log(`[LeaveApprovalAgent] Registered validation rule: ${rule.name}`);
}

/**
 * Get all registered validation rules
 */
export function getValidationRules(): ValidationRule[] {
  return [...validationRules];
}

/**
 * Clear all validation rules (useful for testing or resetting)
 */
export function clearValidationRules(): void {
  validationRules.length = 0;
}

/**
 * Main approval function
 * Runs all registered validation rules and decides approval
 */
export async function approveLeaveRequest(
  leave: LeaveRequest,
  context?: any
): Promise<ApprovalResult> {
  const validationsPassed: string[] = [];
  const validationsFailed: string[] = [];
  
  // Run all validation rules
  for (const rule of validationRules) {
    try {
      const result = await rule.validate(leave, context);
      if (result.passed) {
        validationsPassed.push(rule.name);
      } else {
        validationsFailed.push(rule.name);
        // Critical rules prevent approval
        if (rule.priority === 'critical') {
          return {
            leaveId: leave.id,
            approved: false,
            reason: `Blocked by critical rule: ${rule.name}. ${result.reason || ''}`,
            validationsPassed,
            validationsFailed,
            confidence: 20,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error(`[LeaveApprovalAgent] Error in rule ${rule.name}:`, error);
      validationsFailed.push(`${rule.name} (error)`);
    }
  }

  // Default behavior: Approve if no critical validations failed
  const approved = validationsFailed.length === 0;
  const confidence = calculateConfidence(validationsPassed, validationsFailed);

  return {
    leaveId: leave.id,
    approved,
    reason: approved 
      ? `Leave approved automatically. All validations passed.`
      : `Leave approved with ${validationsFailed.length} non-critical validation(s) to review.`,
    validationsPassed,
    validationsFailed,
    confidence,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate confidence score based on validations
 * Higher confidence = more validations passed
 */
function calculateConfidence(passed: string[], failed: string[]): number {
  const total = passed.length + failed.length;
  
  // If no validations run, return 95% (simple auto-approval)
  if (total === 0) return 95;
  
  // Score based on pass rate
  const passRate = (passed.length / total) * 100;
  return Math.round(passRate);
}

/**
 * Batch approve multiple leave requests
 */
export async function approveBatchLeaveRequests(
  leaves: LeaveRequest[],
  context?: any
): Promise<ApprovalResult[]> {
  const results: ApprovalResult[] = [];
  
  for (const leave of leaves) {
    const result = await approveLeaveRequest(leave, context);
    results.push(result);
  }
  
  return results;
}

/**
 * Get approval summary
 */
export function getApprovalSummary(results: ApprovalResult[]): {
  total: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
  commonFailures: Record<string, number>;
} {
  const approved = results.filter(r => r.approved).length;
  const rejected = results.filter(r => !r.approved).length;
  const averageConfidence = Math.round(
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  );

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
    commonFailures,
  };
}
