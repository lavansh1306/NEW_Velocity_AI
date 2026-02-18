import { Request, Response } from 'express';

/**
 * Catch-all handler for all unmatched API routes
 * This route should handle:
 * - /api/jira/team-members
 * - /api/jira/issues
 * - /api/jira/projects
 * - /api/jira/save-employee-skills
 * - And any other dynamic routes not explicitly defined
 */

async function handler(req: Request, res: Response) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`[Catch-all Handler] ${req.method} ${req.url}`);

  // Extract the route path from the URL
  const path = req.url.split('?')[0];

  // Check if this is a Jira route that should be handled
  if (path.includes('/jira/')) {
    // Try to import and use the Jira routes from server
    try {
      // Dynamically import the Jira router
      const { default: jiraRoutes } = await import('../src/api/jira/routes.js');
      // Since this is a serverless function, we can't use Express middleware the same way
      // Instead, we'll try to handle it through the jiraRoutes
      console.log('[Catch-all] Routing to Jira handler');
      
      // For Vercel, we need a different approach - proxy to a running service or return appropriate response
      return res.status(501).json({
        error: 'Jira routes not available in this deployment mode',
        message: 'Please ensure your Express server is running',
        path,
      });
    } catch (error) {
      console.error('[Catch-all] Error loading Jira routes:', error);
    }
  }

  // Default catch-all response for unknown routes
  return res.status(404).json({
    error: 'API endpoint not found',
    path,
    availableEndpoints: [
      '/api/health',
      '/api/jira/auth/status',
      '/api/jira/projects',
      '/api/jira/issues',
      '/api/jira/team-members',
    ],
  });
}

export default handler;
