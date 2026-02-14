import { Request, Response } from 'express';

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';

export default async function handler(req: Request, res: Response) {
  const diagnostics: any = {
    environment: 'production (Vercel)',
    ml_engine_url: ML_ENGINE_BASE_URL,
    backend_proxy_available: true,
    api_endpoints: [
      'GET /api/ml/health',
      'POST /api/ml/analyze-availability',
      'POST /api/ml/analyze-bottlenecks',
      'POST /api/ml/train',
    ],
    timestamp: new Date().toISOString(),
    nodejs_version: process.version,
    platform: process.platform,
  };

  // Test ML engine connectivity
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${ML_ENGINE_BASE_URL}/`, {
      method: 'GET',
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    diagnostics.ml_engine_status = response.ok ? 'online' : `offline (${response.status})`;
    diagnostics.ml_engine_response_time_ms = responseTime;
  } catch (error) {
    diagnostics.ml_engine_status = 'unreachable';
    diagnostics.ml_engine_error = error instanceof Error ? error.message : String(error);
  }

  return res.status(200).json(diagnostics);
}
