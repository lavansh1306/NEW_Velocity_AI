import express, { Request, Response } from "express"
import {
  approveLeaveRequest,
  approveBatchLeaveRequests,
  getApprovalSummary,
  registerValidationRule,
  type LeaveRequest,
  type ApprovalResult,
} from "../../lib/leaveApprovalAgent"

const router = express.Router()

console.log('[LeaveApprovalRoutes] Routes loaded, registering endpoints...')

/**
 * POST /api/leave-approval/approve-single
 * Approves a single leave request
 */
router.post("/approve-single", async (req: Request, res: Response) => {
  try {
    const leave: LeaveRequest = req.body

    if (!leave || !leave.id || !leave.name) {
      return res.status(400).json({
        error: "Invalid leave request. Required fields: id, name, startDate, endDate, reason, status",
      })
    }

    console.log(`[LeaveApprovalAgent] Approving leave for ${leave.name}`)
    const result = await approveLeaveRequest(leave)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[LeaveApprovalAgent] Error approving leave:", error)
    res.status(500).json({
      error: "Failed to approve leave request",
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * POST /api/leave-approval/approve-batch
 * Approves multiple leave requests with weighted scoring
 */
router.post("/approve-batch", async (req: Request, res: Response) => {
  try {
    const leaves: LeaveRequest[] = req.body.leaves

    if (!Array.isArray(leaves)) {
      return res.status(400).json({
        error: "Invalid request. Expected 'leaves' array",
      })
    }

    console.log(`[LeaveApprovalAgent] Batch approving ${leaves.length} leave requests`)
    const results = await approveBatchLeaveRequests(leaves)
    const summary = getApprovalSummary(results)

    res.json({
      success: true,
      data: {
        results,
        summary,
      },
    })
  } catch (error) {
    console.error("[LeaveApprovalAgent] Error in batch approval:", error)
    res.status(500).json({
      error: "Failed to batch approve leave requests",
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * POST /api/leave-approval/register-validation-rule
 * Register a custom validation rule
 * 
 * Example body:
 * {
 *   "name": "CheckCapacity",
 *   "priority": "high",
 *   "validate": "check_team_capacity" // function name/reference
 * }
 */
router.post("/register-validation-rule", async (req: Request, res: Response) => {
  try {
    const { name, priority } = req.body

    if (!name || !priority) {
      return res.status(400).json({
        error: "Missing required fields: name, priority",
      })
    }

    if (!["critical", "high", "medium", "low"].includes(priority)) {
      return res.status(400).json({
        error: "Invalid priority. Must be: critical, high, medium, low",
      })
    }

    console.log(`[LeaveApprovalAgent] Registered validation rule: ${name}`)

    res.json({
      success: true,
      message: `Validation rule '${name}' registered with priority '${priority}'`,
      note: "To use custom validation logic, register the rule in the application code",
    })
  } catch (error) {
    console.error("[LeaveApprovalAgent] Error registering rule:", error)
    res.status(500).json({
      error: "Failed to register validation rule",
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * GET /api/leave-approval/status
 * Get current agent status and configuration
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    agent: "LeaveApprovalAgent",
    status: "active",
    version: "1.0.0",
    mode: "weighted-scoring",
    description: "Weighted scoring system for leave approvals",
    features: [
      "Weighted Scoring System (5 dimensions)",
      "Dynamic Decision Routing based on score",
      "Extensible Validation Framework",
      "Configurable Scoring Weights",
      "Decision Method Tracking",
    ],
    scoringDimensions: {
      employeeRating: "Employee performance rating (1-5)",
      leaveBalance: "Available leave days",
      teamCapacity: "Team members available",
      absenceType: "Type of leave (medical, family, vacation, other)",
      blackoutDate: "Critical business dates",
    },
    decisionFlow: {
      step1: "Validate with critical rules (auto-reject if failed)",
      step2: "Calculate weighted score (0-100)",
      step3: "Route decision based on score",
      "step3a": "Score > 50: Approve",
      "step3b": "Score <= 50: Reject",
    },
  })
})

/**
 * POST /api/leave-approval/set-weights
 * Set custom scoring weights
 */
router.post("/set-weights", async (req: Request, res: Response) => {
  try {
    const { employeeRating, leaveBalance, teamCapacity, absenceType, blackoutDate } = req.body

    const weights: any = {}
    if (employeeRating !== undefined) weights.employeeRating = employeeRating
    if (leaveBalance !== undefined) weights.leaveBalance = leaveBalance
    if (teamCapacity !== undefined) weights.teamCapacity = teamCapacity
    if (absenceType !== undefined) weights.absenceType = absenceType
    if (blackoutDate !== undefined) weights.blackoutDate = blackoutDate

    if (Object.keys(weights).length === 0) {
      return res.status(400).json({
        error: "No weights provided",
      })
    }

    const { setScoringWeights, getScoringWeights } = await import("../../lib/leaveApprovalAgent")
    setScoringWeights(weights)

    res.json({
      success: true,
      message: "Scoring weights updated",
      weights: getScoringWeights(),
    })
  } catch (error) {
    console.error("[LeaveApprovalAgent] Error setting weights:", error)
    res.status(500).json({
      error: "Failed to set weights",
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * GET /api/leave-approval/weights
 * Get current scoring weights
 */
router.get("/weights", async (req: Request, res: Response) => {
  try {
    const { getScoringWeights } = await import("../../lib/leaveApprovalAgent")

    res.json({
      success: true,
      weights: getScoringWeights(),
    })
  } catch (error) {
    console.error("[LeaveApprovalAgent] Error getting weights:", error)
    res.status(500).json({
      error: "Failed to get weights",
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * POST /api/leave-approval/team-capacity
 * Check Team Capacity - Calculates true available hours based on base capacity, PTO, and holidays
 */
console.log('[LeaveApprovalRoutes] Registering /team-capacity endpoint...')
router.post("/team-capacity", async (req: Request, res: Response) => {
  console.log("[CapacityAnalysis] POST /capacity endpoint called with body:", req.body)
  try {
    const { candidates } = req.body
    console.log("[CapacityAnalysis] Candidates:", candidates)

    if (!Array.isArray(candidates)) {
      console.log("[CapacityAnalysis] Error: candidates is not an array")
      return res.status(400).json({
        error: "Invalid request. Expected 'candidates' array",
      })
    }

    console.log(`[CapacityAnalysis] Analyzing capacity for ${candidates.length} candidates`)

    // Calculate available hours for each candidate
    const capacityAnalysis = candidates.map((candidate: any) => {
      const baseProductiveHours = candidate.base_productive_hours || 40
      const ptoHours = candidate.pto_hours_this_week || 0
      const holidayHours = candidate.holiday_hours_this_week || 0
      const netAvailableHours = Math.max(0, baseProductiveHours - ptoHours - holidayHours)

      let status = "available"
      if (netAvailableHours === 0) {
        status = "unavailable"
      } else if (netAvailableHours < 10) {
        status = "limited"
      } else if (netAvailableHours >= 35) {
        status = "full"
      }

      return {
        employee_id: candidate.id,
        name: candidate.name,
        base_productive_hours: baseProductiveHours,
        pto_hours_this_week: ptoHours,
        holiday_hours_this_week: holidayHours,
        net_available_hours: netAvailableHours,
        status: status,
      }
    })

    const totalBaseHours = capacityAnalysis.reduce((sum: number, emp: any) => sum + emp.base_productive_hours, 0)
    const totalPtoHours = capacityAnalysis.reduce((sum: number, emp: any) => sum + emp.pto_hours_this_week, 0)
    const totalAvailableHours = capacityAnalysis.reduce((sum: number, emp: any) => sum + emp.net_available_hours, 0)
    const availableCount = capacityAnalysis.filter((emp: any) => emp.status !== "unavailable").length

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_candidates: candidates.length,
        total_base_hours: totalBaseHours,
        total_pto_hours: totalPtoHours,
        total_available_hours: totalAvailableHours,
        available_members: availableCount,
        utilization_rate: totalBaseHours > 0 ? Math.round((totalAvailableHours / totalBaseHours) * 100) : 0,
      },
      data: capacityAnalysis,
    }

    console.log("[CapacityAnalysis] Sending response")
    res.json(response)
  } catch (error) {
    console.error("[CapacityAnalysis] Error analyzing capacity:", error)
    res.status(500).json({
      error: "Failed to analyze team capacity",
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

export default router
