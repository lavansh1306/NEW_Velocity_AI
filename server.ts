import express, { Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"
import fetch from "node-fetch"
import session from "express-session"
import { fileURLToPath } from "url"
import path from "path"

// Load .env FIRST
dotenv.config()

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Async startup
;(async () => {
  // Dynamic imports after dotenv loads
  const m365Auth = await import("./src/api/microsoft365/auth")
  const m365MetricsRoutes = await import("./src/api/microsoft365/routes/metrics").then(m => m.default)
  const m365RoiRoutes = await import("./src/api/microsoft365/routes/roi").then(m => m.default)
  const hubspotRoutes = await import("./src/api/hubspot/routes").then(m => m.default)
  const hubspotAuth = await import("./src/api/hubspot/auth")

  const app = express()
  
  // CORS configuration for cross-origin requests
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://example.com'
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }))
  
  app.use(express.json())

// Session middleware for M365 OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : false,
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
  }
}))

const PORT = Number(process.env.API_PORT || 4000)

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

app.get("/api/issues", async (req: Request, res: Response) => {
  // Get project key from query parameter or use default from env
  const projectKey = (req.query.projectKey as string) || PROJECT_KEY

  console.log('[/api/issues] Request for:', projectKey, 'Auth ready:', !!auth)

  if (!projectKey) {
    return res.status(400).json({ error: "Project key is required. Provide it as ?projectKey=YOURKEY or set JIRA_PROJECT_KEY in .env" })
  }

  if (!isJiraConfigReady) {
    console.warn('[/api/issues] Jira not configured - returning empty issues list')
    return res.json({ issues: [] })
  }

  try {
    const jql = `project = "${projectKey}"`
    // Use correct Jira Cloud API v3 endpoint format
    const url = `https://${DOMAIN}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=500&fields=key,summary,created,duedate,description,priority,status,assignee,issuetype`
    
    console.log('[Jira Request] URL:', url)
    console.log('[Jira Request] Auth present:', !!auth)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('[Jira Response] Status:', response.status)

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[Jira] Failed with status ${response.status}:`, errText.substring(0, 300))
      // Return empty list instead of 500 so UI doesn't break in production
      return res.json({ issues: [] })
    }

    const data = await response.json() as any
    const issues = (data.issues || []).map((issue: any) => {
      const fields = issue.fields || {}
      const created = fields.created || null
      const due = fields.duedate || null
      const duration = created && due ? Math.ceil((new Date(due).getTime() - new Date(created).getTime()) / MS_PER_DAY) : ""

      return {
        key: issue.key || "-",
        issueType: fields.issuetype?.name || "-",
        summary: fields.summary || "-",
        description: extractDescription(fields.description),
        priority: fields.priority?.name || "-",
        status: fields.status?.name || "-",
        assignee: fields.assignee?.displayName || "Unassigned",
        team: TEAM_FIELD && fields[TEAM_FIELD] ? String(fields[TEAM_FIELD]) : "Team 1",
        created,
        due,
        duration,
      }
    })

    res.json({ issues })
  } catch (err) {
    console.error("[Jira API]", err)
    // Return an empty issues array rather than a 500 so UI can render in production
    console.warn('[Jira API] Failed to fetch issues:', err)
    res.json({ issues: [] })
  }
})

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
  res.json({ status: "ok" })
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
app.use('/api/hubspot', hubspotRoutes);

// SPA Fallback: serve index.html for all non-API routes
app.use((req: Request, res: Response) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' })
    return
  }
  res.status(200).sendFile(__dirname + '/public/index.html', (err) => {
    if (err) {
      res.status(404).json({ error: 'Page not found' })
    }
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://localhost:${PORT}`)
  console.log(`  - Jira API: ${isJiraConfigReady ? 'configured' : 'NOT configured'}`)
  console.log(`  - Asana API: ${isAsanaConfigReady ? 'configured' : 'NOT configured'}`)
  console.log(`  - Microsoft 365 API: ${process.env.MS_CLIENT_ID ? 'configured' : 'NOT configured'}`)
})
})().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
