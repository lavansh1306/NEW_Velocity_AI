import express, { Request, Response } from "express"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  approveLeaveRequest,
  approveBatchLeaveRequests,
  getApprovalSummary,
  registerValidationRule,
  initializeGemini,
  type LeaveRequest,
  type ApprovalResult,
} from "../../lib/leaveApprovalAgent"

const router = express.Router()

// Initialize Gemini once when routes are loaded
let geminiInitialized = false

function initializeGeminiIfNeeded() {
  if (geminiInitialized) return

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('[LeaveApprovalAgent] GEMINI_API_KEY not found, Gemini reasoning disabled')
    return
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    initializeGemini(model)
    geminiInitialized = true
    console.log('[LeaveApprovalAgent] Gemini initialized successfully')
  } catch (error) {
    console.error('[LeaveApprovalAgent] Failed to initialize Gemini:', error)
  }
}

/**
 * POST /api/leave-approval/approve-single
 * Approves a single leave request
 */
router.post("/approve-single", async (req: Request, res: Response) => {
  try {
    initializeGeminiIfNeeded()
    
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
 * Approves multiple leave requests with hybrid AI (weighted scoring + Gemini)
 */
router.post("/approve-batch", async (req: Request, res: Response) => {
  try {
    initializeGeminiIfNeeded()
    
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
    version: "2.0.0",
    mode: "hybrid (weighted-scoring + gemini)",
    description: "Hybrid AI system for leave approvals using weighted scoring for routine cases and Gemini reasoning for borderline/complex cases",
    features: [
      "Weighted Scoring System (5 dimensions)",
      "Gemini AI Reasoning for complex cases",
      "Dynamic Decision Routing (clear/complex paths)",
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
      step3: "Route decision",
      "step3a": "Score > 75: Approve (fast path)",
      "step3b": "Score < 25: Reject (fast path)",
      "step3c": "Score 25-75: Use Gemini reasoning (complex path)",
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

export default router
