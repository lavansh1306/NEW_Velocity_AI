import express, { Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"
import fetch from "node-fetch"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = Number(process.env.API_PORT || 4000)
const DOMAIN = process.env.JIRA_DOMAIN
const EMAIL = process.env.JIRA_EMAIL
const API_TOKEN = process.env.JIRA_API_TOKEN
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY
const TEAM_FIELD = process.env.JIRA_TEAM_FIELD_ID // Optional custom field key, e.g. customfield_12345

const auth = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64")
const JIRA_SEARCH_URL = DOMAIN ? `https://${DOMAIN}/rest/api/3/search/jql` : null
const MS_PER_DAY = 1000 * 60 * 60 * 24

const isConfigReady = DOMAIN && EMAIL && API_TOKEN && PROJECT_KEY
if (!isConfigReady) {
  console.warn("Jira API is not fully configured. Please set JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY in your .env file.")
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

  if (!projectKey) {
    return res.status(400).json({ error: "Project key is required. Provide it as ?projectKey=YOURKEY or set JIRA_PROJECT_KEY in .env" })
  }

  if (!isConfigReady || !JIRA_SEARCH_URL) {
    return res.status(500).json({ error: "Jira configuration missing" })
  }

  try {
    const response = await fetch(JIRA_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: `project = ${projectKey} AND created >= -365d ORDER BY created DESC`,
        fields: [
          "key",
          "summary",
          "created",
          "duedate",
          "description",
          "priority",
          "status",
          "assignee",
          "issuetype",
          TEAM_FIELD,
        ].filter(Boolean),
        maxResults: 500,
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      return res.status(response.status).json({ error: "Failed to fetch Jira issues", details: message })
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
    res.status(500).json({ error: "Failed to fetch Jira issues", details: err instanceof Error ? err.message : "Unknown error" })
  }
})

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" })
})

app.listen(PORT, () => {
  console.log(`Jira proxy API listening on http://localhost:${PORT}`)
})
