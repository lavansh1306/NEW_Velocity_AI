import express, { Request, Response } from 'express';

const router = express.Router();

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';
const REQUEST_TIMEOUT = 30000; // 30 seconds for cold starts

// ===================== Health Check =====================

/**
 * GET /health
 * Proxy health check to ML engine
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    console.log('[ML Routes] Health check requested');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${ML_ENGINE_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[ML Routes] Health check returned status:', response.status);
      return res.status(response.status).json({ 
        status: 'offline',
        ml_engine_status: response.status 
      });
    }

    const data = await response.json();
    console.log('[ML Routes] ML Engine health check OK');
    return res.status(200).json({ ...data, backend_proxy: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Routes] Health check failed:', errorMsg);
    
    return res.status(503).json({ 
      status: 'offline',
      error: 'ML engine unreachable',
      details: errorMsg 
    });
  }
});

// ===================== Availability Analysis =====================

/**
 * POST /analyze/availability
 * Proxy availability analysis to ML engine
 */
router.post('/analyze/availability', async (req: Request, res: Response) => {
  try {
    console.log('[ML Routes] Availability analysis requested');
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[ML Routes] Availability analysis failed with status:', response.status);
      
      // If ML engine returns 422 or 400, return the error details
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
    console.log('[ML Routes] Availability analysis completed, returned:', data.length, 'results');
    return res.status(200).json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Routes] Availability analysis error:', errorMsg);
    
    return res.status(503).json({ 
      error: 'ML engine unavailable',
      details: errorMsg 
    });
  }
});

// ===================== Bottleneck Analysis =====================

/**
 * POST /analyze/bottlenecks
 * Proxy bottleneck analysis to ML engine
 */
router.post('/analyze/bottlenecks', async (req: Request, res: Response) => {
  try {
    console.log('[ML Routes] Bottleneck analysis requested');
    const { task, candidates } = req.body;

    if (!task || !candidates) {
      return res.status(400).json({ 
        error: 'Missing required fields: task, candidates' 
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${ML_ENGINE_BASE_URL}/api/v1/analyze/bottlenecks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, candidates }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[ML Routes] Bottleneck analysis failed with status:', response.status);
      
      // If ML engine returns 422 or 400, return the error details
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
    console.log('[ML Routes] Bottleneck analysis completed');
    return res.status(200).json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Routes] Bottleneck analysis error:', errorMsg);
    
    return res.status(503).json({ 
      error: 'ML engine unavailable',
      details: errorMsg 
    });
  }
});

// ===================== Model Training =====================

/**
 * POST /train
 * Proxy training request to ML engine
 */
router.post('/train', async (req: Request, res: Response) => {
  try {
    console.log('[ML Routes] Training request received');
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[ML Routes] Training failed with status:', response.status);
      return res.status(response.status).json({ 
        error: 'Training failed',
        status: response.status 
      });
    }

    const data = await response.json();
    console.log('[ML Routes] Training completed successfully');
    return res.status(200).json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Routes] Training error:', errorMsg);
    
    return res.status(503).json({ 
      error: 'ML engine unavailable',
      details: errorMsg 
    });
  }
});

// ===================== Diagnostics =====================

/**
 * GET /diagnostics
 * Get ML service diagnostics and status
 */
router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    console.log('[ML Routes] Diagnostics requested');
    
    const diagnostics = {
      backend_proxy_active: true,
      ml_engine_url: ML_ENGINE_BASE_URL,
      request_timeout_ms: REQUEST_TIMEOUT,
      endpoints_available: [
        'GET /api/ml/health',
        'POST /api/ml/analyze/availability',
        'POST /api/ml/analyze/bottlenecks',
        'POST /api/ml/train',
        'GET /api/ml/diagnostics',
      ],
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(diagnostics);
  } catch (error) {
    console.error('[ML Routes] Diagnostics error:', error);
    return res.status(500).json({ error: 'Failed to get diagnostics' });
  }
});

export default router;
