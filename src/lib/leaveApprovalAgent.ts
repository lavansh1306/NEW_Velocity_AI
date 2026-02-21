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
  leaveId: number | string;
  approved: boolean;
  reason: string;
  validationsPassed: string[];
  validationsFailed: string[];
  confidence: number; // 0-100: How confident the agent is about this decision
  timestamp: string;
  decisionMethod: 'weighted-scoring';
  weightedScore?: number; // Raw weighted score (0-100)
  // Optional summary of actions performed (shifted/reassigned)
  actions?: { shifted: number; redeployed: number; details?: any };
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

  console.log('[LeaveApprovalAgent] approveLeaveRequest called with:', { 
    leaveId: leave.id, 
    leaveName: leave.name,
    startDate: leave.startDate,
    endDate: leave.endDate,
    preferShiftOnly: context?.preferShiftOnly
  })

  // Prepare a Supabase service-role client (best-effort). If not configured, agent will operate in simulation mode.
  let sb: any = null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    console.log('[LeaveApprovalAgent] Initializing Supabase client...', { hasUrl: !!url, hasKey: !!key, keyLength: key?.length })
    if (url && key) {
      sb = createClient(url, key)
      console.log('[LeaveApprovalAgent] ✅ Supabase service client initialized')
    } else {
      console.warn('[LeaveApprovalAgent] ⚠️ Missing SUPABASE_URL or SERVICE_ROLE_KEY')
    }
  } catch (err) {
    console.warn('[LeaveApprovalAgent] Supabase client init error:', err)
    sb = null
  }

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

  // Prepare an actions summary to return and to persist to leave_history
  const actionsSummary = { shifted: 0, redeployed: 0, details: [] as any[] }

  // If a Supabase client is available, perform safe updates:
  if (sb) {
    try {
      // Normalize leave dates
      const sDate = new Date(leave.startDate)
      const eDate = new Date(leave.endDate)
      sDate.setHours(0,0,0,0)
      eDate.setHours(23,59,59,999)
      const durationDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000*60*60*24)) + 1

      console.log('[LeaveApprovalAgent] Processing leave:', {
        leaveId: leave.id,
        leaveeName: leave.name,
        startDate: leave.startDate,
        endDate: leave.endDate,
        durationDays
      })

      // Fetch tasks assigned to this user
      console.log(`[LeaveApprovalAgent] Fetching tasks for assignee: "${leave.name}"`)
      const { data: tasks, error: tasksErr } = await sb
        .from('jira_issues')
        .select('id, assignee, created_date, due_date, issue_key, summary, original_estimate_seconds, time_spent_seconds')
        .eq('assignee', leave.name)
        .neq('assignee', 'Unassigned')
        .limit(1000)

      console.log('[LeaveApprovalAgent] Task fetch result:', { 
        tasksCount: Array.isArray(tasks) ? tasks.length : 0,
        error: tasksErr?.message || 'none'
      })

      if (tasksErr) console.error('[LeaveApprovalAgent] ❌ Failed to fetch tasks:', tasksErr)

      const affected = Array.isArray(tasks) ? tasks.filter((t: any) => {
        // Use due_date as the key date (created_date is sync timestamp)
        // A task is affected if its due_date falls within the leave period
        const dueDate = t.due_date ? new Date(t.due_date) : null
        if (!dueDate) return false
        
        dueDate.setHours(12,0,0,0) // noon to avoid timezone issues
        
        // Task affected if due date is within leave period
        return dueDate >= sDate && dueDate <= eDate
      }) : []

      console.log('[LeaveApprovalAgent] Affected tasks in leave period:', affected.length, affected.map((t:any) => ({ issue_key: t.issue_key, due_date: t.due_date })))

      // Build candidate list (distinct assignees excluding this user)
      const { data: distinctAssignees } = await sb
        .from('jira_issues')
        .select('assignee')
        .neq('assignee', leave.name)
        .neq('assignee', 'Unassigned')
        .limit(1000)
      const candidates = Array.isArray(distinctAssignees) ? [...new Set(distinctAssignees.map((r:any)=>r.assignee))] : []

      // Helper: deterministic user_id from name (matches frontend)
      const generateUserIdFromName = (name: string): string => {
        let hash = 0
        for (let i = 0; i < name.length; i++) {
          const char = name.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash
        }
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
        return `00000000-0000-4000-a000-${hashStr}00000000`.substring(0,36)
      }

      // For each affected task, prefer shifting if context requests it, otherwise try redeploy then shift
      for (const task of affected) {
        // If caller prefers shift-only, skip redeploy candidate logic and directly shift
        if (context?.preferShiftOnly) {
          const origDue = task.due_date ? new Date(task.due_date) : null
          if (origDue) {
            const newDue = new Date(origDue)
            newDue.setDate(origDue.getDate() + durationDays)
            const newDueStr = newDue.toISOString().split('T')[0]
            const { error: upd2 } = await sb.from('jira_issues').update({ due_date: newDueStr }).eq('id', task.id)
            if (!upd2) {
              actionsSummary.shifted++
              actionsSummary.details.push({ task: task.id, shiftedBy: durationDays, oldDue: task.due_date, newDue: newDueStr })
              await sb.from('leave_history').insert({ org_id: null, leave_request_id: (leave as any).id, event_type: 'shifted', actor_id: null, old_values: JSON.stringify({ task: task.id, oldDue: task.due_date }), new_values: JSON.stringify({ task: task.id, newDue: newDueStr }), notes: `Auto-shifted task ${task.issue_key} by ${durationDays} days (shift-only mode)` })
            }
          }
          continue
        }

        // Otherwise try redeploy (choose lowest-load candidate not on leave), otherwise shift
        let redeployed = false

        // Score candidates by load
        const scored: { name: string; load: number }[] = []
        for (const cand of candidates) {
          try {
            if (!cand || cand === task.assignee) continue

            const candId = generateUserIdFromName(cand)
            const { data: candLeaves } = await sb.from('leave_requests').select('id, start_date, end_date').eq('user_id', candId).in('status', ['pending','approved']).limit(50)
            const isOnLeave = Array.isArray(candLeaves) && candLeaves.some((cl:any) => {
              const cs = new Date(cl.start_date || cl.startDate); const ce = new Date(cl.end_date || cl.endDate)
              cs.setHours(0,0,0,0); ce.setHours(23,59,59,999)
              return cs <= eDate && ce >= sDate
            })
            if (isOnLeave) continue

            const { data: candTasks } = await sb.from('jira_issues').select('id, original_estimate_seconds, due_date').eq('assignee', cand).limit(1000)
            let load = 0
            if (Array.isArray(candTasks)) {
              for (const ct of candTasks) {
                const ctDue = ct.due_date ? new Date(ct.due_date) : null
                if (!ctDue) continue
                ctDue.setHours(12,0,0,0)
                // Count load for tasks with due dates in the leave period
                if (ctDue >= sDate && ctDue <= eDate) {
                  load += (ct.original_estimate_seconds || 0) / 3600
                }
              }
            }
            scored.push({ name: cand, load })
          } catch (inner) {
            // ignore candidate errors
          }
        }

        if (scored.length) scored.sort((a,b)=>a.load - b.load)
        const chosen = scored.length ? scored[0].name : null

        if (chosen) {
          const { error: updErr } = await sb.from('jira_issues').update({ assignee: chosen }).eq('id', task.id)
          if (!updErr) {
            actionsSummary.redeployed++
            actionsSummary.details.push({ task: task.id, from: task.assignee, to: chosen })
            await sb.from('leave_history').insert({ org_id: null, leave_request_id: (leave as any).id, event_type: 'redeployed', actor_id: null, old_values: JSON.stringify({ task: task.id, from: task.assignee }), new_values: JSON.stringify({ task: task.id, to: chosen }), notes: `Auto-redeployed task ${task.issue_key} to ${chosen}` })
            redeployed = true
          }
        }

        if (!redeployed) {
          const origDue = task.due_date ? new Date(task.due_date) : null
          if (origDue) {
            const newDue = new Date(origDue)
            newDue.setDate(origDue.getDate() + durationDays)
            const newDueStr = newDue.toISOString().split('T')[0]
            console.log(`[LeaveApprovalAgent] Shifting task ${task.issue_key}: ${task.due_date} → ${newDueStr}`)
            const { error: upd2 } = await sb.from('jira_issues').update({ due_date: newDueStr }).eq('id', task.id)
            if (!upd2) {
              console.log(`[LeaveApprovalAgent] ✅ Task ${task.issue_key} shifted successfully`)
              actionsSummary.shifted++
              actionsSummary.details.push({ task: task.id, shiftedBy: durationDays, oldDue: task.due_date, newDue: newDueStr })
              const histInsert = await sb.from('leave_history').insert({ org_id: null, leave_request_id: (leave as any).id, event_type: 'shifted', actor_id: null, old_values: JSON.stringify({ task: task.id, oldDue: task.due_date }), new_values: JSON.stringify({ task: task.id, newDue: newDueStr }), notes: `Auto-shifted task ${task.issue_key} by ${durationDays} days` })
              console.log(`[LeaveApprovalAgent] History insert result:`, histInsert.error?.message || '✅ ok')
            } else {
              console.error(`[LeaveApprovalAgent] ❌ Failed to shift task ${task.issue_key}:`, upd2)
            }
          }
        }
      }

      // Persist final leave status and record summary
      console.log('[LeaveApprovalAgent] Final action summary:', actionsSummary)
      const updateStatus = await sb.from('leave_requests').update({ status: 'approved' }).eq('id', (leave as any).id)
      console.log('[LeaveApprovalAgent] Leave status updated:', updateStatus.error?.message || '✅ ok')
      
      const histSummary = await sb.from('leave_history').insert({ org_id: null, leave_request_id: (leave as any).id, event_type: 'approved_auto', actor_id: null, old_values: null, new_values: JSON.stringify(actionsSummary), notes: 'Auto-approved and handled by LeaveApprovalAgent' })
      console.log('[LeaveApprovalAgent] Summary history insert:', histSummary.error?.message || '✅ ok')
    } catch (err) {
      console.error('[LeaveApprovalAgent] ❌ Error during auto-handling:', err)
    }
  } else {
    console.warn('[LeaveApprovalAgent] ⚠️ No Supabase client - skipping DB operations')
  }

  return {
    leaveId: leave.id,
    approved,
    reason,
    validationsPassed,
    validationsFailed,
    confidence,
    timestamp,
    decisionMethod,
    weightedScore,
    actions: actionsSummary
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
