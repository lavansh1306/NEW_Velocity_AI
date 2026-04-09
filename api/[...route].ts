import { app } from '../server';

/**
 * Serverless Entry Point for Vercel
 * This catch-all route forwards all /api requests to the main Express app.
 */
export default (req: any, res: any) => {
  // Add basic CORS for the entry point if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Delegate to the express app
  return app(req, res);
};
