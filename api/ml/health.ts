import { Request, Response } from 'express';

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';
const REQUEST_TIMEOUT = 30000;

export default async function handler(req: Request, res: Response) {
  try {
    console.log('[ML Health] Health check requested');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${ML_ENGINE_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[ML Health] Health check returned status:', response.status);
      return res.status(response.status).json({ 
        status: 'offline',
        ml_engine_status: response.status 
      });
    }

    const data = await response.json();
    console.log('[ML Health] ML Engine health check OK');
    return res.status(200).json({ ...data, backend_proxy: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Health] Health check failed:', errorMsg);
    
    return res.status(503).json({ 
      status: 'offline',
      error: 'ML engine unreachable',
      details: errorMsg 
    });
  }
}
