import type {
  ProjectHealthReport,
} from '../../../lib/types';

import {
  calculateProjectHealthScore,
} from '../../../services/healthService';

// ========================================
// API Handler
// ========================================

/**
 * GET /api/projects/[projectId]/metrics
 *
 * Computes comprehensive project health metrics and returns JSON.
 */
export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
): Promise<Response> {
  const { projectId } = params;

  // Fetch live Jira issues via backend proxy
  let issues: any[] = []
  try {
    const INTERNAL_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000'
    const resp = await fetch(`${INTERNAL_API_BASE.replace(/\/$/, '')}/api/issues`)
    if (resp.ok) {
      const data = await resp.json()
      issues = data.issues || []
    }
  } catch (err) {
    console.warn('[Metrics API] Failed to fetch issues:', err)
  }

  // Filter issues for this project if necessary (currently global in this prototype)
  const projectIssues = issues.filter((iss: any) =>
    !projectId || iss.fields?.project?.key === projectId || iss.project_key === projectId
  );

  // Compute Health
  const healthMetrics = calculateProjectHealthScore({
    issues: projectIssues,
  });

  const response: ProjectHealthReport = {
    projectId,
    health: healthMetrics,
    lastUpdated: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
