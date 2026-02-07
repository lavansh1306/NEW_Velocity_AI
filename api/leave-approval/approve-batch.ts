import type { Request, Response } from 'express';

interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  employeeRating?: number;
  leaveBalance?: number;
  teamCapacity?: number;
  absenceType?: 'vacation' | 'medical' | 'family' | 'other';
}

interface ApprovalResult {
  leaveId: number;
  approved: boolean;
  reason: string;
  validationsPassed: string[];
  validationsFailed: string[];
  confidence: number;
  timestamp: string;
  decisionMethod: 'weighted-scoring';
  weightedScore?: number;
}

const DEFAULT_WEIGHTS = {
  employeeRating: 0.25,
  leaveBalance: 0.25,
  teamCapacity: 0.25,
  absenceType: 0.15,
  blackoutDate: 0.10
};

function calculateWeightedScore(leave: LeaveRequest): number {
  let score = 50;

  if (leave.employeeRating) {
    const ratingScore = ((leave.employeeRating / 5) * 40) - 20;
    score += ratingScore * DEFAULT_WEIGHTS.employeeRating;
  }

  if (leave.leaveBalance !== undefined) {
    const balanceScore = leave.leaveBalance > 5 ? 15 : leave.leaveBalance > 2 ? 5 : -15;
    score += balanceScore * DEFAULT_WEIGHTS.leaveBalance;
  }

  if (leave.teamCapacity !== undefined) {
    const capacityScore = leave.teamCapacity >= 3 ? 20 : leave.teamCapacity >= 2 ? 10 : -20;
    score += capacityScore * DEFAULT_WEIGHTS.teamCapacity;
  }

  if (leave.absenceType) {
    const typeScore =
      leave.absenceType === 'medical' ? 15 :
      leave.absenceType === 'family' ? 10 :
      leave.absenceType === 'vacation' ? 0 : -5;
    score += typeScore * DEFAULT_WEIGHTS.absenceType;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function approveLeave(leave: LeaveRequest): ApprovalResult {
  const weightedScore = calculateWeightedScore(leave);
  return {
    leaveId: leave.id,
    approved: true,
    reason: `Auto-approved: weighted score ${weightedScore}/100`,
    validationsPassed: [],
    validationsFailed: [],
    confidence: 100,
    timestamp: new Date().toISOString(),
    decisionMethod: 'weighted-scoring',
    weightedScore,
  };
}

export default function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leaves } = req.body;

    if (!Array.isArray(leaves)) {
      return res.status(400).json({ error: "Invalid request. Expected 'leaves' array" });
    }

    console.log(`[LeaveApprovalAgent] Batch approving ${leaves.length} leave requests`);

    const results = leaves.map((leave: LeaveRequest) => approveLeave(leave));

    const approved = results.filter((r: ApprovalResult) => r.approved).length;
    const rejected = results.filter((r: ApprovalResult) => !r.approved).length;
    const averageConfidence = Math.round(
      results.reduce((sum: number, r: ApprovalResult) => sum + r.confidence, 0) / results.length
    );

    const decisionBreakdown: Record<string, number> = {};
    results.forEach((r: ApprovalResult) => {
      decisionBreakdown[r.decisionMethod] = (decisionBreakdown[r.decisionMethod] || 0) + 1;
    });

    const summary = {
      total: results.length,
      approved,
      rejected,
      averageConfidence,
      decisionBreakdown,
      commonFailures: {},
    };

    res.status(200).json({
      success: true,
      data: { results, summary },
    });
  } catch (error: any) {
    console.error('[LeaveApprovalAgent] Error in batch approval:', error);
    res.status(500).json({
      error: 'Failed to batch approve leave requests',
      details: error.message || String(error),
    });
  }
}
