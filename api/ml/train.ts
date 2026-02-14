import { Request, Response } from 'express';

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';
const REQUEST_TIMEOUT = 30000;

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[ML Train] Training request received');
    const { recommendation_id, selected_employee_id, actual_reward } = req.body;

    if (!recommendation_id || !selected_employee_id || actual_reward === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: recommendation_id, selected_employee_id, actual_reward' 
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${ML_ENGINE_BASE_URL}/api/v1/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recommendation_id, selected_employee_id, actual_reward }),
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[ML Train] Training failed with status:', response.status);
      return res.status(response.status).json({ 
        error: 'Training failed',
        status: response.status 
      });
    }

    const data = await response.json();
    console.log('[ML Train] Training completed successfully');
    return res.status(200).json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Train] Error:', errorMsg);
    
    return res.status(503).json({ 
      error: 'ML engine unavailable',
      details: errorMsg 
    });
  }
}
