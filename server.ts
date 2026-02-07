import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Load .env FIRST before any other imports
dotenv.config()

import express from "express"
import type { Request, Response } from "express"

import cors from "cors"
import fetch from "node-fetch"
import { createClient } from '@supabase/supabase-js';
import session from "express-session"

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

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Static imports
import * as m365Auth from "./src/api/microsoft365/auth.js"
import m365MetricsRoutes from "./src/api/microsoft365/routes/metrics.js"
import m365RoiRoutes from "./src/api/microsoft365/routes/roi.js"
import hubspotRoutes from "./src/api/hubspot/routes.js"
import * as hubspotAuth from "./src/api/hubspot/auth.js"
import jiraRoutes from "./src/api/jira/routes.js"
import deployedRoutes from "./src/api/deployed/routes.js"
const app = express()

console.log("typeof express:", typeof express)
console.log("express keys:", Object.keys(express))

// Trust proxy for Vercel/Nginx - required for Secure cookies to work behind proxy
app.set('trust proxy', 1)

// Simple request logger to help debugging route matching
app.use((req: Request, res: Response, next) => {
  console.log('[REQ]', req.method, req.url, 'headers:', { host: req.headers.host, origin: req.headers.origin })
  next()
})

// CORS configuration for cross-origin requests
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? (process.env.FRONTEND_URL_PROD || 'https://www.joinvelocity.co')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true
}))

app.use(express.json())

// Session middleware for OAuth flows (HubSpot + M365 + Jira)
// CRITICAL: SameSite=none + Secure=true required for OAuth redirects (Provider -> App)
const sessionConfig: any = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: true, // Save session on every request to persist data
  saveUninitialized: true, // Initialize session even if unmodified
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS required)
    httpOnly: true, // Prevent XSS attacks
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' allows cross-site (OAuth), 'lax' for localhost
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: undefined // Allow cookies on localhost
  }
};

// Add Redis store if available, otherwise use memory store
if (redisStore) {
  sessionConfig.store = redisStore;
  console.log('[Server] Using Redis store for sessions');
} else {
  console.log('[Server] Using memory store for sessions (dev only)');
}

app.use(session(sessionConfig))

const PORT = Number(process.env.API_PORT || 4000)
const NODE_ENV = process.env.NODE_ENV || 'development'

console.log(`[Server] Starting in ${NODE_ENV} mode on port ${PORT}`)
console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL_PROD || 'http://localhost:5173'}`)

// ============ JIRA Configuration ============
const DOMAIN = process.env.JIRA_DOMAIN
const EMAIL = process.env.JIRA_EMAIL
const API_TOKEN = process.env.JIRA_API_TOKEN
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY
const TEAM_FIELD = process.env.JIRA_TEAM_FIELD_ID // Optional custom field key, e.g. customfield_12345

let auth = ''
if (EMAIL && API_TOKEN) {
  auth = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64")
  console.log('[Jira] Auth configured for email:', EMAIL)
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

const isJiraConfigReady = DOMAIN && EMAIL && API_TOKEN && PROJECT_KEY
if (!isJiraConfigReady) {
  console.warn("[Jira] Configuration incomplete:", { domain: !!DOMAIN, email: !!EMAIL, token: !!API_TOKEN, projectKey: !!PROJECT_KEY })
}

// ============ ASANA Configuration ============
const ASANA_TOKEN = process.env.ASANA_TOKEN
const DEFAULT_ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID
const ASANA_BASE_URL = "https://app.asana.com/api/1.0"
const IMPORTED_ASSIGNEE_FIELD_GID = "1212641939726131"

const isAsanaConfigReady = !!ASANA_TOKEN
if (!isAsanaConfigReady) {
  console.warn("Asana API is not fully configured. Please set ASANA_TOKEN in your .env file.")
}

const extractDescription = (desc: any): string => {
  if (!desc) return ""
  if (typeof desc === "string") return desc
  if (Array.isArray(desc)) return desc.join(" ")
  if (desc.content) {
    const parts: string[] = []
    const walk = (nodes: any[]): void => {
      nodes.forEach((node: any) => {
        if (node.text) parts.push(node.text)
        if (node.content) walk(node.content)
      })
    }
    walk(desc.content)
    return parts.join(" ").trim()
  }
  return ""
}

// OLD ROUTE - Disabled in favor of OAuth multi-tenant route at /api/jira/issues
/*
// Deprecated: Use /api/jira/issues instead which supports OAuth
app.get("/api/issues", async (req: Request, res: Response) => {
  const projectKey = (req.query.projectKey as string) || PROJECT_KEY
  
  console.log('[/api/issues] Fetching with OAuth, projectKey:', projectKey)
  
  try {
    // Import jiraAuth to use OAuth tokens
    const { jiraAuth } = await import('./src/api/jira/auth.js');
    
    const accessToken = await jiraAuth.getAccessToken(req);
    const cloudId = jiraAuth.getCloudId(req);
    
    if (!accessToken || !cloudId) {
      console.log('[/api/issues] Not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const jql = `project = "${projectKey}"`;
    const fields = 'key,summary,created,duedate,description,priority,status,assignee,issuetype,customfield_10015';
    const fullUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=500&fields=${encodeURIComponent(fields)}`;
    
    console.log('[/api/issues] Fetching from OAuth:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    console.log('[/api/issues] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[/api/issues] Fetch failed:', response.status, errorText.substring(0, 200));
      return res.status(response.status).json({ error: 'Failed to fetch issues', details: errorText });
    }
    
    const data = await response.json() as any;
    const issues = (data.issues || []).map((issue: any) => {
      const fields = issue.fields || {};
      const created = fields.created || null;
      const due = fields.duedate || null;
      const duration = created && due ? Math.ceil((new Date(due).getTime() - new Date(created).getTime()) / (1000 * 60 * 60 * 24)) : "";
      const startDate = fields.customfield_10015 || null;
      
      return {
        key: issue.key || "-",
        issueType: fields.issuetype?.name || "-",
        summary: fields.summary || "-",
        description: extractDescription(fields.description),
        priority: fields.priority?.name || "-",
        status: fields.status?.name || "-",
        assignee: fields.assignee?.displayName || "Unassigned",
        team: projectKey,
        created,
        due,
        duration,
        start: startDate,
        customfield_10015: fields.customfield_10015 || null,
      };
    });
    
    console.log('[/api/issues] Returning', issues.length, 'issues');
    res.json({ issues });
  } catch (err) {
    console.error('[/api/issues] Error:', err);
    res.status(500).json({ error: String(err) });
  }
})

// OLD ENDPOINT - Disabled in favor of OAuth multi-tenant route
/*
    res.json({ issues: [] })
  }
})
*/

// OLD ROUTE - Disabled in favor of OAuth multi-tenant route at /api/jira/projects
/*
// Fetch list of projects from Jira (requires JIRA_DOMAIN + auth)
app.get('/api/projects', async (_req: Request, res: Response) => {
  if (!isJiraConfigReady || !DOMAIN) {
    console.warn('[API] /api/projects called but Jira configuration missing - returning empty list')
    return res.json({ projects: [] })
  }

  try {
    // Use API v2 endpoint for projects (returns direct array)
    const url = `https://${DOMAIN}/rest/api/2/project?maxResults=200`
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const txt = await response.text()
      return res.status(response.status).json({ error: 'Failed to fetch projects from Jira', details: txt })
    }

    const data = await response.json() as any
    // Jira API v2 /project returns a direct array
    const projectArray = Array.isArray(data) ? data : (data.values || data.projects || [])
    const projects = projectArray.map((p: any) => ({
      id: p.key || String(p.id),
      key: p.key || String(p.id),
      title: p.name || p.key || String(p.id),
      category: p.projectTypeKey || p.projectCategory?.name || 'Project',
      description: p.description ? (typeof p.description === 'string' ? p.description : JSON.stringify(p.description)) : '',
      avatar: p.avatarUrls ? (p.avatarUrls['48x48'] || p.avatarUrls['24x24'] || '') : '',
    }))

    res.json({ projects })
  } catch (err) {
    console.error('[Jira Projects] Failed to fetch projects:', err)
    // Return empty list rather than failing the entire page in production
    res.json({ projects: [] })
  }
})
*/

// ============ ASANA API Endpoints ============
app.get("/api/asana/issues", async (req: Request, res: Response) => {
  // Get project ID from query parameter or use default from env
  const projectId = (req.query.projectKey as string) || DEFAULT_ASANA_PROJECT_ID

  if (!projectId) {
    console.warn('[Asana Issues] No project ID provided and ASANA_PROJECT_ID not set')
    return res.json({ issues: [] })
  }

  if (!isAsanaConfigReady) {
    console.warn('[Asana Issues] Asana token not configured - returning empty issues')
    return res.json({ issues: [] })
  }

  try {
    const response = await fetch(
      `${ASANA_BASE_URL}/tasks?project=${projectId}&opt_fields=name,completed,assignee.name,start_on,due_on,memberships.section.name,notes,custom_fields,custom_fields.enum_value,custom_fields.enum_value.name`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ASANA_TOKEN}`,
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      const message = await response.text()
      console.error('[Asana Issues] Upstream returned', response.status, message.substring(0, 300))
      return res.json({ issues: [] })
    }

    const data = await response.json() as any
    const tasks = (data.data || []).map((task: any) => {
      const startDate = task.start_on || null
      const due = task.due_on || null
      
      // Calculate duration from start_on to due_on (inclusive of both start and end dates)
      const duration = startDate && due 
        ? Math.ceil((new Date(due).getTime() - new Date(startDate).getTime()) / MS_PER_DAY) + 1
        : ""

      // Get imported assignee from custom field
      const importedAssigneeField = task.custom_fields?.find(
        (cf: any) => cf.gid === IMPORTED_ASSIGNEE_FIELD_GID
      )
      const importedAssignee = importedAssigneeField?.enum_value?.name || null

      // Use imported assignee if regular assignee is missing
      const finalAssignee = task.assignee?.name || importedAssignee || "Unassigned"

      return {
        key: task.gid || "-",
        issueType: "-",
        summary: task.name || "-",
        description: task.notes || "",
        priority: "-",
        status: task.completed ? "Done" : "Open",
        assignee: finalAssignee,
        team: task.memberships?.[0]?.section?.name || "-",
        startDate,
        due,
        duration,
      }
    })

    res.json({ issues: tasks })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[Asana Issues] Exception fetching tasks:', errMsg)
    res.json({ issues: [] })
  }
})

// Fetch list of Asana projects (requires ASANA_TOKEN). Uses ASANA_WORKSPACE env if provided,
// otherwise returns the DEFAULT_ASANA_PROJECT_ID as a single-item list when available.
app.get('/api/asana/projects', async (_req: Request, res: Response) => {
  if (!isAsanaConfigReady) {
    console.warn('[API] /api/asana/projects called but Asana configuration missing - returning empty list')
    return res.json({ projects: [] })
  }

  try {
    const workspace = process.env.ASANA_WORKSPACE_ID
    if (workspace) {
      const url = `${ASANA_BASE_URL}/projects?workspace=${workspace}&archived=false&opt_fields=gid,name,notes`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ASANA_TOKEN}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const txt = await response.text()
        console.error('[Asana Projects] upstream returned', response.status, txt.substring(0, 300))
        return res.json({ projects: [] })
      }

      const data = await response.json() as any
      const values = data.data || []
      const projects = values.map((p: any) => ({
        id: p.gid,
        key: p.gid,
        title: p.name,
        description: p.notes || '',
        avatar: '',
      }))

      return res.json({ projects })
    }

    // If no workspace provided, try returning the default project if set
    if (DEFAULT_ASANA_PROJECT_ID) {
      const url = `${ASANA_BASE_URL}/projects/${DEFAULT_ASANA_PROJECT_ID}?opt_fields=gid,name,notes`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ASANA_TOKEN}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const txt = await response.text()
        console.error('[Asana Project] upstream returned', response.status, txt.substring(0, 300))
        return res.json({ projects: [] })
      }

      const data = await response.json() as any
      const p = data.data
      const project = p ? [{ id: p.gid, key: p.gid, title: p.name, description: p.notes || '', avatar: '' }] : []
      return res.json({ projects: project })
    }

    // No workspace and no default project configured
    return res.json({ projects: [] })
  } catch (err) {
    console.error('[Asana Projects] Error fetching projects:', err)
    return res.json({ projects: [] })
  }
})

app.get("/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    jiraConfigured: isJiraConfigReady,
    asanaConfigured: isAsanaConfigReady,
    apiPort: PORT
  })
})

// ============ Microsoft 365 OAuth Routes ============
app.get('/api/microsoft365/auth/login', m365Auth.login);
app.get('/auth/callback', m365Auth.callback);
app.get('/api/microsoft365/auth/logout', m365Auth.logout);
app.get('/api/microsoft365/auth/status', (req: Request, res: Response) => {
  const isAuthenticated = !!(req.session?.tenantId && m365Auth.getTokenForSession(req));
  res.json({
    authenticated: isAuthenticated,
    account: req.session?.account || null,
    tenantId: req.session?.tenantId || null
  });
});

// ============ HubSpot OAuth Callback Route ============
app.get('/oauth/hubspot/callback', hubspotAuth.callback);


// ============ Microsoft 365 API Routes ============
app.use('/api/microsoft365/metrics', m365MetricsRoutes);
app.use('/api/microsoft365/roi', m365RoiRoutes);

// ============ HubSpot API Routes ============
console.log('[Server] Mounting HubSpot routes:', !!hubspotRoutes, Object.prototype.toString.call(hubspotRoutes).slice(8, -1));
app.use('/api/hubspot', hubspotRoutes);
console.log('[Server] HubSpot routes mounted');

// ============ Jira OAuth & API Routes (multi-tenant) ============
app.use('/api/jira', jiraRoutes);
console.log('[Server] Jira OAuth routes mounted');

// ============ Deployed API Routes ============
app.use('/api/deployed', deployedRoutes);
console.log('[Server] Deployed routes mounted');

// try {
//   const stack = (hubspotRoutes as any)?.stack || []
//   const routes = stack.map((layer: any) => {
//     if (layer.route) return `${Object.keys(layer.route.methods).join(',').toUpperCase()} ${layer.route.path}`
//     return layer.name || 'middleware'
//   })
//   console.log('[Server] HubSpot router registered routes:', routes)
// } catch (e) {
//   console.log('[Server] Could not introspect hubspotRoutes stack', e)
// }

// Temporary direct test route to verify requests reach the server
// app.get('/api/hubspot/auth/status-test', (req: Request, res: Response) => {
//   console.log('[Direct Test] /api/hubspot/auth/status-test hit, sessionID:', req.sessionID)
//   res.json({ ok: true, test: 'direct' })
// })

// Also mount HubSpot router at /hubspot for debugging (non-API prefix)
// app.use('/hubspot', hubspotRoutes)
// console.log('[Server] Also mounted HubSpot routes at /hubspot for debugging')

// SPA Fallback: serve index.html for all non-API routes
// Waitlist endpoint: accepts { email } and writes to Supabase (server key) and/or forwards to a Google Sheets webhook
app.post('/api/waitlist', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Insert into Supabase if SERVICE key present
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await sb.from('waitlist').insert({ email });
        if (error) console.error('[Waitlist] Supabase insert error:', error);
      } catch (err) {
        console.error('[Waitlist] Supabase error:', err);
      }
    }

    // Forward to a Google Sheets webhook if configured (e.g., Apps Script web app URL)
    const gsWebhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (gsWebhook) {
      try {
        await fetch(gsWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (err) {
        console.error('[Waitlist] Google Sheets webhook error:', err);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Waitlist] Unexpected error:', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// SPA fallback route - must be last
app.use((req: Request, res: Response) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' })
    return
  }
  // Temporarily just return a simple response
  res.status(200).send('SPA fallback - would serve index.html')
});

// Start server after initializing Redis
;(async () => {
  try {
    await initializeRedis();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server listening on http://localhost:${PORT}`)
      console.log(`  - Jira API: ${isJiraConfigReady ? 'configured' : 'NOT configured'}`)
      console.log(`  - Asana API: ${isAsanaConfigReady ? 'configured' : 'NOT configured'}`)
      console.log(`  - Microsoft 365 API: ${process.env.MS_CLIENT_ID ? 'configured' : 'NOT configured'}`)
    })
  } catch (error) {
    console.error('[Server] Failed to start:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();

// The Express server keeps the event loop alive

// Handle uncaught exceptions (log but do not exit in dev)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  console.error('Stack:', err.stack)
  // In development, avoid exiting so the server remains available for debugging
})

// Handle unhandled promise rejections (log but do not exit in dev)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // In development, avoid exiting so the server remains available for debugging
})
