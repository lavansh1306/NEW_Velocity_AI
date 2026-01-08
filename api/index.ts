import express, { Request, Response } from "express"
import cors from "cors"
import fetch from "node-fetch"

const app = express()
app.use(cors())
app.use(express.json())

// ============ JIRA Configuration ============
const DOMAIN = process.env.JIRA_DOMAIN
const EMAIL = process.env.JIRA_EMAIL
const API_TOKEN = process.env.JIRA_API_TOKEN
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY
const TEAM_FIELD = process.env.JIRA_TEAM_FIELD_ID

let auth = ''
if (EMAIL && API_TOKEN) {
  auth = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64")
  console.log('[Jira] Auth configured for email:', EMAIL)
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

const isJiraConfigReady = DOMAIN && EMAIL && API_TOKEN && PROJECT_KEY

if (!isJiraConfigReady) {
  console.warn('[Jira Init] Configuration missing:', {
    domain: !!DOMAIN ? '✓' : '✗',
    email: !!EMAIL ? '✓' : '✗',
    token: !!API_TOKEN ? '✓' : '✗',
    projectKey: !!PROJECT_KEY ? '✓' : '✗',
  })
}

// ============ ASANA Configuration ============
const ASANA_TOKEN = process.env.ASANA_TOKEN
const DEFAULT_ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID
const ASANA_BASE_URL = "https://app.asana.com/api/1.0"
const IMPORTED_ASSIGNEE_FIELD_GID = "1212641939726131"

const isAsanaConfigReady = !!ASANA_TOKEN

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
  const projectKey = (req.query.projectKey as string) || PROJECT_KEY

  console.log('[/api/issues] Request for project:', projectKey, 'Auth ready:', !!auth)

  if (!projectKey) {
    return res.status(400).json({ error: "Project key is required" })
  }

  if (!isJiraConfigReady) {
    console.error('[/api/issues] Jira not configured')
    return res.status(500).json({ error: "Jira configuration missing" })
  }

  try {
    const jql = `project = "${projectKey}"`
    // Use correct Jira Cloud API v3 endpoint format
    const url = `https://${DOMAIN}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=500&fields=key,summary,created,duedate,description,priority,status,assignee,issuetype`
    
    console.log('[Jira Request] URL:', url)
    console.log('[Jira Request] Auth header set:', !!auth)
    
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
      const text = await response.text()
      console.error('[Jira Error] Status:', response.status, 'Response:', text.substring(0, 200))
      return res.status(response.status).json({ error: 'Failed to fetch Jira issues', status: response.status, details: text })
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
    res.status(500).json({ error: "Failed to fetch Jira issues", details: err instanceof Error ? err.message : "Unknown error" })
  }
})

app.get('/api/projects', async (_req: Request, res: Response) => {
  if (!isJiraConfigReady || !DOMAIN) {
    return res.status(500).json({ error: 'Jira configuration missing' })
  }

  try {
    const response = await fetch(`https://${DOMAIN}/rest/api/2/project?maxResults=200`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const txt = await response.text()
      return res.status(response.status).json({ error: 'Failed to fetch projects', details: txt })
    }

    const data = await response.json() as any
    // Jira API v2 /project returns a direct array
    const projectArray = Array.isArray(data) ? data : (data.values || data.projects || [])
    const projects = projectArray.map((p: any) => ({
      id: p.key || String(p.id),
      key: p.key || String(p.id),
      title: p.name || p.key || String(p.id),
      category: p.projectTypeKey || 'Project',
      description: p.description ? (typeof p.description === 'string' ? p.description : '') : '',
      avatar: p.avatarUrls?.['48x48'] || '',
    }))
    
    console.log('[/api/projects] Returning', projects.length, 'projects')
    res.json({ projects })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Jira projects', details: err instanceof Error ? err.message : 'Unknown' })
  }
})

app.get("/api/asana/issues", async (req: Request, res: Response) => {
  const projectId = (req.query.projectKey as string) || DEFAULT_ASANA_PROJECT_ID

  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" })
  }

  if (!isAsanaConfigReady) {
    return res.status(500).json({ error: "Asana configuration missing" })
  }

  try {
    const response = await fetch(
      `${ASANA_BASE_URL}/tasks?project=${projectId}&opt_fields=name,completed,assignee.name,start_on,due_on,memberships.section.name,notes,custom_fields`,
      {
        headers: {
          Authorization: `Bearer ${ASANA_TOKEN}`,
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      const message = await response.text()
      return res.status(response.status).json({ error: "Failed to fetch Asana tasks", details: message })
    }

    const data = await response.json() as any
    const tasks = (data.data || []).map((task: any) => {
      const startDate = task.start_on || null
      const due = task.due_on || null
      const duration = startDate && due ? Math.ceil((new Date(due).getTime() - new Date(startDate).getTime()) / MS_PER_DAY) + 1 : ""

      const importedAssigneeField = task.custom_fields?.find((cf: any) => cf.gid === IMPORTED_ASSIGNEE_FIELD_GID)
      const importedAssignee = importedAssigneeField?.enum_value?.name || null
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
    res.status(500).json({ error: "Failed to fetch Asana tasks", details: err instanceof Error ? err.message : "Unknown error" })
  }
})

app.get('/api/asana/projects', async (_req: Request, res: Response) => {
  if (!isAsanaConfigReady) {
    return res.status(500).json({ error: 'Asana configuration missing' })
  }

  try {
    const workspace = process.env.ASANA_WORKSPACE_ID
    if (workspace) {
      const response = await fetch(`${ASANA_BASE_URL}/projects?workspace=${workspace}&archived=false&opt_fields=gid,name,notes`, {
        headers: {
          Authorization: `Bearer ${ASANA_TOKEN}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const txt = await response.text()
        return res.status(response.status).json({ error: 'Failed to fetch Asana projects', details: txt })
      }

      const data = await response.json() as any
      const projects = (data.data || []).map((p: any) => ({
        id: p.gid,
        key: p.gid,
        title: p.name,
        description: p.notes || '',
        avatar: '',
      }))

      return res.json({ projects })
    }

    if (DEFAULT_ASANA_PROJECT_ID) {
      const response = await fetch(`${ASANA_BASE_URL}/projects/${DEFAULT_ASANA_PROJECT_ID}?opt_fields=gid,name,notes`, {
        headers: {
          Authorization: `Bearer ${ASANA_TOKEN}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const txt = await response.text()
        return res.status(response.status).json({ error: 'Failed to fetch Asana project', details: txt })
      }

      const data = await response.json() as any
      const p = data.data
      return res.json({ projects: p ? [{ id: p.gid, key: p.gid, title: p.name, description: p.notes || '', avatar: '' }] : [] })
    }

    return res.json({ projects: [] })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch Asana projects', details: err instanceof Error ? err.message : 'Unknown' })
  }
})

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" })
})

export default app
