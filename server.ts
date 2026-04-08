import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Load .env FIRST before any other imports
// Get working directory to find .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

import express from "express"
import type { Request, Response } from "express"

import cors from "cors"
import fetch from "node-fetch"
import { createClient } from '@supabase/supabase-js';
import session from "express-session"
import { WebSocketServer, WebSocket } from "ws"
import http from "http"

// Initialize Redis store asynchronously
let redisStore: any = null;

async function initializeRedis() {
  try {
    if (!process.env.REDIS_URL && !(process.env.REDIS_HOST && process.env.REDIS_PORT)) {
      console.log('[Server] No Redis config found, using memory store');
      return;
    }

    const redis = await import('redis');
    const { default: RedisStore } = await import('connect-redis');
    
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL || `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    
    redisClient.on('error', (err: any) => console.error('[Redis] Error:', err));
    redisClient.on('connect', () => console.log('[Redis] Connected'));
    
    await redisClient.connect();
    redisStore = new RedisStore({ client: redisClient, prefix: 'velocity-session:' });
    console.log('[Server] Redis session store initialized');
  } catch (err) {
    console.log('[Server] Redis initialization failed, using memory store:', err instanceof Error ? err.message : String(err));
  }
}

// Static imports
import jiraRoutes from "./src/api/jira/routes.js"
import deployedRoutes from "./src/api/deployed/routes.js"
import authRoutes from "./src/api/auth/routes.ts"
import leaveApprovalRoutes from "./src/api/leave-approval/routes.ts"
import invitesRoutes from "./src/api/invites/routes.ts"
import employeeRoutes from "./src/api/employee/routes.ts"
import organizationRoutes from "./src/api/organization/routes.ts"
import linearRoutes from "./src/api/linear/routes.ts"
import voiceRoutes from "./src/api/voice/routes.ts"

export const app = express()

// Trust proxy for Vercel/Nginx - required for Secure cookies to work behind proxy
app.set('trust proxy', 1)

// Simple request logger to help debugging route matching
app.use((req: Request, res: Response, next) => {
  console.log(`[API DEBUG] ${req.method} ${req.url}`);
  next()
})

// CORS configuration for cross-origin requests
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? (process.env.FRONTEND_URL_PROD || 'https://www.joinvelocity.co')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

// Session middleware for OAuth flows (Jira)
const sessionConfig: any = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: true,
  saveUninitialized: true,
  name: 'velocity-sid',
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    domain: process.env.NODE_ENV === 'production' ? '.joinvelocity.co' : undefined
  }
};

if (redisStore) {
  sessionConfig.store = redisStore;
}

app.use(session(sessionConfig))

const PORT = Number(process.env.API_PORT || 4000)
const NODE_ENV = process.env.NODE_ENV || 'development'

// ============ JIRA Configuration ============
const DOMAIN = process.env.JIRA_DOMAIN
const EMAIL = process.env.JIRA_EMAIL
const API_TOKEN = process.env.JIRA_API_TOKEN
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY

const isJiraConfigReady = DOMAIN && EMAIL && API_TOKEN && PROJECT_KEY

// ============ Supabase DB Test ============
async function testSupabaseConnection() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;
  try {
    const client = createClient(supabaseUrl, supabaseKey);
    const { count, error } = await client.from('organizations').select('*', { count: 'exact', head: true });
    if (!error) console.log('[DB] ✓ Supabase connected. Organizations count:', count);
  } catch (e) {}
}
testSupabaseConnection();

// ============ API Routes ============
app.get("/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    jiraConfigured: isJiraConfigReady, 
    apiPort: PORT 
  })
})

app.use('/api/jira', jiraRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/deployed', deployedRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/leave-approval', leaveApprovalRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/linear', linearRoutes);
app.use('/api/voice', voiceRoutes);

// AI Description Expander
app.post('/api/ai/expand-description', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not set' });
  const prompt = description?.trim()
    ? 'Expand this project description for an engineering team. 3-4 sentences. Original: ' + description
    : 'Write a detailed project description for: ' + title + '. Include goals, features, and success criteria. 3-4 sentences.';
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'system', content: 'You are a senior PM. Write clear project descriptions. Return only the description.' }, { role: 'user', content: prompt }], max_tokens: 250, temperature: 0.7 })
    }) as any;
    if (groqRes.ok) {
      const data = await groqRes.json() as any;
      const expanded = data.choices?.[0]?.message?.content?.trim();
      if (expanded) return res.json({ description: expanded });
    }
    res.status(500).json({ error: 'Failed' });
  } catch(e) { res.status(500).json({ error: String(e) }); }
});

app.get('/api/debug-routes', (req, res) => {
  res.json({
    mounted: [
      '/api/jira',
      '/api/auth',
      '/api/deployed',
      '/api/leave-approval',
      '/api/invites',
      '/api/employee',
      '/api/organization',
      '/api/linear',
      '/api/voice'
    ]
  });
});

app.post('/api/waitlist', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const sb = createClient(supabaseUrl, supabaseServiceKey);
      await sb.from('waitlist').insert({ email });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'internal' });
  }
});

// SPA fallback route - must be last
app.use((req: Request, res: Response) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' })
    return
  }
  res.status(200).send('SPA fallback - would serve index.html')
});

export default app;

// Start server after initializing Redis only if not running as a Vercel Function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  ;(async () => {
    try {
      await initializeRedis();
      const server = http.createServer(app);
      const wss = new WebSocketServer({ noServer: true });

      server.on('upgrade', (request, socket, head) => {
        const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
        if (pathname === '/api/voice-live') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
          });
        } else {
          socket.destroy();
        }
      });

      wss.on('connection', (ws: WebSocket) => {
        console.log('[VoiceProxy] Client connected');
        const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          ws.close(1011, 'API Key missing');
          return;
        }
        const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        const geminiSocket = new WebSocket(geminiUrl);
        geminiSocket.on('message', (data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
        ws.on('message', (data) => { if (geminiSocket.readyState === WebSocket.OPEN) geminiSocket.send(data); });
        const cleanup = () => { if (geminiSocket.readyState === WebSocket.OPEN) geminiSocket.close(); if (ws.readyState === WebSocket.OPEN) ws.close(); };
        ws.on('close', cleanup);
        geminiSocket.on('close', cleanup);
      });

      server.listen(PORT, '0.0.0.0', () => {
        console.log(`API server listening on http://localhost:${PORT}`)
      })
    } catch (error) {
      process.exit(1);
    }
  })();
}

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); })
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection at:', promise, 'reason:', reason); })
