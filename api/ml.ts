import { Request, Response } from 'express';

const ML_ENGINE_BASE_URL = 'https://python-ml-engine-xlwh.onrender.com';
const REQUEST_TIMEOUT = 30000;

// Route handler for all ML operations
export default async function handler(req: Request, res: Response) {
  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Vercel passes the path in _path query parameter due to rewrite rule
  let path = req.url.split('?')[0];
  
  // Check for _path parameter passed by Vercel rewrite
  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const vercelPath = urlParams.get('_path');
  if (vercelPath) {
    path = `${vercelPath}`;
  }
  
  console.log(`[ML Handler] ${req.method} ${path} | url: ${req.url}`);

  // Route to appropriate handler based on endpoint
  const endpoint = path.split('/').pop() || '';
  
  if (endpoint === 'health' || path === '/health') {
    return handleHealth(req, res);
  } else if (endpoint === 'analyze-availability' || path.includes('analyze-availability')) {
    return handleAnalyzeAvailability(req, res);
  } else if (endpoint === 'analyze-bottlenecks' || path.includes('analyze-bottlenecks')) {
    return handleAnalyzeBottlenecks(req, res);
  } else if (endpoint === 'train') {
    return handleTrain(req, res);
  } else if (endpoint === 'diagnostics' || path === '/diagnostics') {
    return handleDiagnostics(req, res);
  } else {
    console.warn(`[ML Handler] Unknown endpoint: ${endpoint}, path: ${path}, fullUrl: ${req.url}`);
    return res.status(404).json({ 
      error: 'ML endpoint not found', 
      endpoint,
      path,
      fullUrl: req.url,
      availableEndpoints: ['/health', '/analyze-availability', '/analyze-bottlenecks', '/train', '/diagnostics']
    });
  }
}

// ==================== Health Check ====================
async function handleHealth(req: Request, res: Response) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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

// ==================== Availability Analysis ====================
async function handleAnalyzeAvailability(req: Request, res: Response) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[ML Availability] Analysis requested');
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

// ==================== Bottleneck Analysis ====================
async function handleAnalyzeBottlenecks(req: Request, res: Response) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[ML Bottlenecks] Analysis requested');
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
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[ML Bottlenecks] Analysis failed with status:', response.status);
      
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
    console.log('[ML Bottlenecks] Analysis completed');
    return res.status(200).json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ML Bottlenecks] Error:', errorMsg);
    
    return res.status(503).json({ 
      error: 'ML engine unavailable',
      details: errorMsg 
    });
  }
}

// ==================== Model Training ====================
async function handleTrain(req: Request, res: Response) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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

// ==================== Diagnostics ====================
async function handleDiagnostics(req: Request, res: Response) {
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
