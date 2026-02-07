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
 * Approves multiple leave requests
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
 * Get current agent status and registered rules
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    agent: "LeaveApprovalAgent",
    status: "active",
    version: "1.0.0",
    mode: "auto-approval (simple)",
    message: "Currently approves all leave requests automatically.",
    nextFeatures: [
      "Team capacity validation",
      "Coverage availability check",
      "Leave balance verification",
      "Blackout date handling",
      "Manager escalation workflows",
    ],
  })
})

export default router
