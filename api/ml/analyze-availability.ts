import { Request, Response } from 'express';

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';
const REQUEST_TIMEOUT = 30000;

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[ML Availability] Availability analysis requested');
    const { task, candidates } = req.body;

    if (!task || !candidates) {
      return res.status(400).json({ 
        error: 'Missing required fields: task, candidates' 
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${ML_ENGINE_BASE_URL}/api/v1/analyze/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, candidates }),
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[ML Availability] Analysis failed with status:', response.status);
      
      if (response.status === 422 || response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          return res.status(response.status).json({ 
            error: 'Validation error',
            details: errorData 
          });
        } catch {
          return res.status(response.status).json({ 
            error: 'Validation error',
            details: errorText 
          });
        }
      }
      
      return res.status(response.status).json({ 
        error: 'ML engine error',
        status: response.status 
      });
    }

    const data = await response.json();
    console.log('[ML Availability] Analysis completed, returned:', data.length, 'results');
    return res.status(200).json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Availability] Error:', errorMsg);
    
    return res.status(503).json({ 
      error: 'ML engine unavailable',
      details: errorMsg 
    });
  }
}
