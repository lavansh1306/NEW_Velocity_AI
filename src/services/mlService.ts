/**
 * ML Engine Service
 * Integrates with the deployed FastAPI backend at https://python-ml-engine-xlwh.onrender.com
 * Uses backend proxy routes for production deployments to avoid CORS issues
 */

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';
const ML_BACKEND_PROXY_URL = '/api/ml'; // Backend proxy endpoints (no CORS issues)
const REQUEST_TIMEOUT = 30000; // 30 second timeout for ML engine calls (Render cold starts can be slow)

// Detect if we're in production (deployed) vs development (localhost)
const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

// Use backend proxy in production, direct ML engine URL in development
const ML_API_BASE = isProduction ? ML_BACKEND_PROXY_URL : ML_ENGINE_BASE_URL;

// ===================== Health Check Cache =====================
let lastHealthCheckTime: number = 0;
let lastHealthCheckResult: boolean = false;
const HEALTH_CHECK_CACHE_TIMEOUT = 60000; // Cache health check for 60 seconds

// ===================== TypeScript Interfaces =====================

// Candidate (Employee) Interface
export interface MLCandidate {
  id: string;
  current_load: number; // Current workload (0-100)
  skills: string[];
  role_level: 'junior' | 'mid' | 'senior' | 'lead';
  name?: string;
  availability_hours?: number;
  avg_completion_time?: number; // Average hours to complete similar tasks
}

// Task Interface
export interface MLTask {
  id?: string;
  title?: string;
  skills_required: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  complexity?: number; // 0-3: 0=simple, 1=moderate, 2=complex, 3=very_complex
  deadline_hours?: number; // Deadline in hours
}

// ===================== Request Interfaces =====================

export interface BottleneckAnalysisRequest {
  task: MLTask;
  candidates: MLCandidate[];
}

export interface AvailabilityAnalysisRequest {
  task: MLTask;
  candidates: MLCandidate[];
}

export interface TrainRequest {
  recommendation_id: string;
  selected_employee_id: string;
  actual_reward: number; // 0-1 score indicating assignment quality
}

// ===================== Response Interfaces =====================

export interface HealthCheckResponse {
  status: 'active' | 'inactive';
}

export interface OverloadedSkill {
  skill: string;
  strain_level: number; // 0-100
  affected_candidates: string[];
}

export interface BottleneckReport {
  overloaded_skills: OverloadedSkill[];
  system_strain_score: number; // 0-100
  recommendation: string;
  health_status: 'healthy' | 'warning' | 'critical';
}

export interface AvailabilityReport {
  employee_id: string;
  is_eligible: boolean;
  match_reason: string;
  match_score?: number; // 0-100
  matched_skills?: string[];
  missing_skills?: string[];
}

export interface TrainResponse {
  success: boolean;
  message: string;
  model_updated: boolean;
}

// ===================== Helper Function =====================

/**
 * Transform a Jira issue to ML Task format
 * Maps Jira fields to the ML engine's expected format
 */
export function transformJiraToML(jiraIssue: any): MLTask {
  return {
    id: jiraIssue.key || jiraIssue.id,
    title: jiraIssue.summary || 'Unknown Task',
    skills_required: extractSkillsFromJira(jiraIssue),
    priority: mapJiraPriority(jiraIssue.priority),
    complexity: estimateComplexityNumber(jiraIssue), // Returns 0-3 integer
    deadline_hours: jiraIssue.timeestimate
      ? Math.round(jiraIssue.timeestimate / 3600)
      : 40,
  };
}

/**
 * Estimate task complexity as integer (0-3)
 */
function estimateComplexityNumber(jiraIssue: any): number {
  const description = (jiraIssue.description || '').toLowerCase();
  const summary = (jiraIssue.summary || '').toLowerCase();
  const combined = `${description} ${summary}`;

  let complexityScore = 0;

  if (combined.includes('refactor')) complexityScore += 2;
  if (combined.includes('integration')) complexityScore += 2;
  if (combined.includes('database') || combined.includes('migration')) complexityScore += 2;
  if (combined.includes('performance') || combined.includes('optimize')) complexityScore += 1;
  if (combined.includes('bug') || combined.includes('fix')) complexityScore -= 1;
  if (combined.includes('enhancement') || combined.includes('feature')) complexityScore += 1;

  if (complexityScore >= 4) return 3; // very_complex
  if (complexityScore >= 2) return 2; // complex
  if (complexityScore >= 1) return 1; // moderate
  return 0; // simple
}

/**
 * Map Jira priority to ML priority levels
 */
function mapJiraPriority(jiraPriority: string): 'low' | 'medium' | 'high' | 'critical' {
  if (!jiraPriority) return 'medium';
  const priority = jiraPriority.toLowerCase();
  if (priority.includes('blocker') || priority.includes('critical')) return 'critical';
  if (priority.includes('high')) return 'high';
  if (priority.includes('low')) return 'low';
  return 'medium';
}

/**
 * Extract required skills from Jira issue
 */
function extractSkillsFromJira(jiraIssue: any): string[] {
  const skills: string[] = [];
  const text = `${jiraIssue.summary || ''} ${jiraIssue.description || ''}`.toLowerCase();

  const skillMap: Record<string, string[]> = {
    frontend: ['react', 'typescript', 'vue', 'angular', 'css', 'html', 'ui', 'component'],
    backend: ['api', 'database', 'server', 'node', 'python', 'java', 'rust', 'go', 'c#'],
    devops: ['docker', 'kubernetes', 'ci/cd', 'deployment', 'infrastructure', 'terraform', 'ansible'],
    testing: ['test', 'qa', 'jest', 'selenium', 'e2e', 'unit test', 'integration test'],
    design: ['design', 'figma', 'ui/ux', 'mockup', 'wireframe', 'prototyping'],
    mobile: ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
  };

  for (const [skill, keywords] of Object.entries(skillMap)) {
    if (keywords.some((kw) => text.includes(kw))) {
      skills.push(skill);
    }
  }

  return skills.length > 0 ? skills : ['general'];
}

// ===================== Health Check =====================

/**
 * Health Check - Verify ML engine is online
 * GET /
 */
export async function checkMLEngineHealth(): Promise<boolean> {
  try {
    // Check if we have a cached health check result that's still valid
    const now = Date.now();
    if (now - lastHealthCheckTime < HEALTH_CHECK_CACHE_TIMEOUT) {
      console.log('[MLService] Using cached health check result:', lastHealthCheckResult ? 'ONLINE' : 'OFFLINE', '(via', isProduction ? 'backend proxy' : 'direct ML engine', ')');
      return lastHealthCheckResult;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[MLService] Health check timeout after', REQUEST_TIMEOUT, 'ms');
      controller.abort();
    }, REQUEST_TIMEOUT);

    console.log('[MLService] Starting health check via', isProduction ? 'backend proxy' : 'direct ML engine', '...');
    const startTime = Date.now();
    
    const healthUrl = isProduction ? `${ML_API_BASE}/health` : `${ML_API_BASE}/`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.log(`[MLService] Health check response in ${elapsed}ms`);

    if (!response.ok) {
      console.warn('[MLService] Health check returned status:', response.status);
      lastHealthCheckTime = now;
      lastHealthCheckResult = false;
      return false;
    }

    const data: HealthCheckResponse = await response.json();
    const isActive = data.status === 'active';
    console.log('[MLService] Health check - ML Engine is', isActive ? 'ONLINE' : 'OFFLINE');
    
    // Cache the result
    lastHealthCheckTime = now;
    lastHealthCheckResult = isActive;
    
    return isActive;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[MLService] Health check failed:', errorMsg);
    if (errorMsg.includes('abort')) {
      console.error('[MLService] Request timeout - ML engine may be slow to respond.');
    }
    
    // Cache the failure
    lastHealthCheckTime = Date.now();
    lastHealthCheckResult = false;
    
    return false;
  }
}

// ===================== Bottleneck Analysis =====================

/**
 * Analyze system bottlenecks
 * POST /api/v1/analyze/bottlenecks
 *
 * Call this to display a "Team Health" dashboard and identify overloaded skills
 */
export async function analyzeBottlenecks(
  task: MLTask,
  candidates: MLCandidate[]
): Promise<BottleneckReport> {
  try {
    // Check if ML engine is online first
    const isOnline = await checkMLEngineHealth();
    if (!isOnline) {
      console.warn('[MLService] ML engine is offline, returning fallback bottleneck analysis');
      return getFallbackBottleneckAnalysis();
    }

    const request: BottleneckAnalysisRequest = { task, candidates };

    console.log('[MLService] Sending bottleneck request:', {
      taskTitle: task.title,
      candidatesCount: candidates.length,
      sampleCandidate: candidates[0],
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const bottlenecksUrl = isProduction 
      ? `${ML_API_BASE}/analyze-bottlenecks`
      : `${ML_API_BASE}/api/v1/analyze/bottlenecks`;

    const response = await fetch(bottlenecksUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[MLService] Bottleneck analysis failed with status:', response.status, 'Error:', errorText);
      return getFallbackBottleneckAnalysis();
    }

    const data: BottleneckReport = await response.json();
    console.log('[MLService] Bottleneck analysis received:', data);
    return data;
  } catch (error) {
    console.error('[MLService] Error analyzing bottlenecks:', error instanceof Error ? error.message : error);
    return getFallbackBottleneckAnalysis();
  }
}

// ===================== Availability Analysis =====================

/**
 * Analyze employee availability and eligibility
 * POST /api/v1/analyze/availability
 *
 * Call this when selecting a task to filter out ineligible employees based on required skills
 */
export async function analyzeAvailability(
  task: MLTask,
  candidates: MLCandidate[]
): Promise<AvailabilityReport[]> {
  try {
    // Check if ML engine is online first
    const isOnline = await checkMLEngineHealth();
    if (!isOnline) {
      console.warn('[MLService] ML engine is offline, returning fallback availability analysis');
      return getFallbackAvailabilityAnalysis(task, candidates);
    }

    const request: AvailabilityAnalysisRequest = { task, candidates };
    
    console.log('[MLService] Sending availability request:', {
      taskSkills: task.skills_required,
      candidatesCount: candidates.length,
      sampleCandidate: candidates[0],
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const availabilityUrl = isProduction 
      ? `${ML_API_BASE}/analyze-availability`
      : `${ML_API_BASE}/api/v1/analyze/availability`;

    const response = await fetch(availabilityUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[MLService] Availability analysis failed with status:', response.status, 'Error:', errorText);
      return getFallbackAvailabilityAnalysis(task, candidates);
    }

    const data: AvailabilityReport[] = await response.json();
    console.log('[MLService] Availability analysis received:', data);
    return data;
  } catch (error) {
    console.error('[MLService] Error analyzing availability:', error instanceof Error ? error.message : error);
    return getFallbackAvailabilityAnalysis(task, candidates);
  }
}

// ===================== Model Training =====================

/**
 * Train the ML model with the assignment outcome
 * POST /api/v1/train
 *
 * Call this when the manager confirms an assignment to close the RL loop
 */
export async function trainModel(
  recommendation_id: string,
  selected_employee_id: string,
  actual_reward: number
): Promise<TrainResponse> {
  try {
    // Check if ML engine is online first
    const isOnline = await checkMLEngineHealth();
    if (!isOnline) {
      console.warn('[MLService] ML engine is offline, cannot train model');
      return {
        success: false,
        message: 'ML engine is currently offline',
        model_updated: false,
      };
    }

    const request: TrainRequest = {
      recommendation_id,
      selected_employee_id,
      actual_reward: Math.max(0, Math.min(1, actual_reward)), // Clamp between 0-1
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const trainUrl = isProduction 
      ? `${ML_API_BASE}/train`
      : `${ML_API_BASE}/api/v1/train`;

    const response = await fetch(trainUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[MLService] Training failed with status:', response.status);
      throw new Error(`ML Engine training failed with status ${response.status}`);
    }

    const data: TrainResponse = await response.json();
    console.log('[MLService] Model training response:', data);
    return data;
  } catch (error) {
    console.error('[MLService] Error training model:', error instanceof Error ? error.message : error);
    return {
      success: false,
      message: `Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      model_updated: false,
    };
  }
}

// ===================== Fallback Functions (Graceful Degradation) =====================

/**
 * Fallback bottleneck analysis when ML engine is unavailable
 */
function getFallbackBottleneckAnalysis(): BottleneckReport {
  return {
    overloaded_skills: [],
    system_strain_score: 0,
    recommendation: 'ML engine is offline. Showing default team health status.',
    health_status: 'healthy',
  };
}

/**
 * Fallback availability analysis when ML engine is unavailable
 * Mark all candidates as eligible based on simple skill matching
 */
function getFallbackAvailabilityAnalysis(
  task: MLTask,
  candidates: MLCandidate[]
): AvailabilityReport[] {
  return candidates.map((candidate) => {
    const matchedSkills = task.skills_required.filter((skill) =>
      candidate.skills.some((candSkill) =>
        candSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(candSkill.toLowerCase())
      )
    );

    const missingSkills = task.skills_required.filter(
      (skill) => !matchedSkills.includes(skill)
    );

    const matchScore = Math.round(
      (matchedSkills.length / Math.max(task.skills_required.length, 1)) * 100
    );

    return {
      employee_id: candidate.id,
      is_eligible: matchedSkills.length > 0 || task.skills_required.length === 0,
      match_reason: `ML engine offline. Local match: ${matchedSkills.length}/${task.skills_required.length} skills.`,
      match_score: matchScore,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
    };
  });
}

// ===================== Diagnostics =====================

/**
 * Reset health check cache and force a fresh check
 * Useful for debugging ML engine connectivity issues
 */
export function resetHealthCheckCache(): void {
  lastHealthCheckTime = 0;
  lastHealthCheckResult = false;
  console.log('[MLService] Health check cache cleared. Next call will perform fresh check.');
}

/**
 * Get diagnostic information about ML service status
 */
export function getDiagnostics() {
  return {
    environment: isProduction ? 'production (Vercel serverless)' : 'development (backend proxy)',
    ml_engine_url: ML_ENGINE_BASE_URL,
    backend_proxy_url: ML_BACKEND_PROXY_URL,
    current_api_base: ML_API_BASE,
    production_endpoints: [
      'GET /api/ml/health',
      'POST /api/ml/analyze-availability',
      'POST /api/ml/analyze-bottlenecks',
      'POST /api/ml/train',
    ],
    request_timeout_ms: REQUEST_TIMEOUT,
    cache_timeout_ms: HEALTH_CHECK_CACHE_TIMEOUT,
    last_check_time: lastHealthCheckTime ? new Date(lastHealthCheckTime).toISOString() : 'never',
    last_result: lastHealthCheckResult ? 'online' : 'offline',
    cache_age_ms: Date.now() - lastHealthCheckTime,
    cache_valid: (Date.now() - lastHealthCheckTime) < HEALTH_CHECK_CACHE_TIMEOUT,
  };
}

// ===================== Export Service Object =====================

export const mlService = {
  checkMLEngineHealth,
  analyzeBottlenecks,
  analyzeAvailability,
  trainModel,
  transformJiraToML,
  resetHealthCheckCache,
  getDiagnostics,
};

export default mlService;

/**
 * Analyze team capacity (Productive Hours - PTO - Holidays)
 * POST /api/v1/analyze/capacity
 */
export async function analyzeCapacity(
  candidates: MLCandidate[]
): Promise<CapacityReport[]> {
  try {
    const isOnline = await checkMLEngineHealth();
    if (!isOnline) {
      console.warn('[MLService] ML engine offline, returning fallback capacity');
      return getFallbackCapacityAnalysis(candidates);
    }

    const request: CapacityRequest = { candidates };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const capacityUrl = isProduction 
      ? `${ML_API_BASE}/analyze-capacity`
      : `${ML_API_BASE}/api/v1/analyze/capacity`;

    const response = await fetch(capacityUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Capacity analysis failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[MLService] Error analyzing capacity:', error);
    return getFallbackCapacityAnalysis(candidates);
  }
}

// Add the fallback function
function getFallbackCapacityAnalysis(candidates: MLCandidate[]): CapacityReport[] {
  return candidates.map(c => {
    const net = (c.base_productive_hours || 40) - (c.pto_hours_this_week || 0) - (c.holiday_hours_this_week || 0);
    return {
      employee_id: c.id,
      name: c.name || 'Unknown',
      base_productive_hours: c.base_productive_hours || 40,
      pto_hours_this_week: c.pto_hours_this_week || 0,
      holiday_hours_this_week: c.holiday_hours_this_week || 0,
      net_available_hours: Math.max(0, net),
      status: net <= 0 ? 'Overloaded' : 'Available'
    };
  });
}