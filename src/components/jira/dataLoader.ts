import type { Issue } from './types'

interface CSVRow {
  [key: string]: string
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  if (lines.length === 0) return []

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''))
    return result
  }

  // Find the header line (first line that starts with issue_id)
  let headerIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('issue_id,')) {
      headerIndex = i
      break
    }
  }

  const headers = parseCSVLine(lines[headerIndex])
  const data: CSVRow[] = []

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('issue_id,')) continue // Skip duplicate headers
    if (!line.trim()) continue
    
    const values = parseCSVLine(line)
    if (values.length < 3) continue // Skip invalid lines
    
    const row: CSVRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    data.push(row)
  }

  return data
}

function parseJSONField(jsonStr: string): Record<string, any> {
  try {
    // Handle escaped quotes
    const cleaned = jsonStr.replace(/""/g, '"')
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

export async function loadJiraIssuesFromCSV(): Promise<Issue[]> {
  try {
    const response = await fetch('/data/jira_events.csv')
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`)
    }
    
    const csvText = await response.text()
    const rows = parseCSV(csvText)
    
    // Group events by issue_key and build issue objects
    const issueMap = new Map<string, Issue>()
    
    rows.forEach(row => {
      const issueKey = row.issue_key
      if (!issueKey) return
      
      const projectId = row.project_id || '1'
      const fields = parseJSONField(row.fields || '{}')
      
      // Get or create issue
      if (!issueMap.has(issueKey)) {
        issueMap.set(issueKey, {
          key: issueKey,
          issueType: row.event_type === 'issue_created' ? 'Task' : 'Task',
          summary: fields.summary || `Issue ${issueKey}`,
          description: fields.comment || fields.note || '',
          priority: fields.priority || fields.severity || 'Medium',
          status: row.to_status || 'Open',
          assignee: row.actor || 'Unassigned',
          team: `Project ${projectId}`,
          created: row.created_at || null,
          due: calculateDueDate(row.created_at),
          duration: calculateDuration(row.created_at),
        })
      } else {
        // Update existing issue with latest status
        const existing = issueMap.get(issueKey)!
        if (row.to_status) {
          existing.status = row.to_status
        }
        if (row.actor && row.actor !== 'automation') {
          existing.assignee = row.actor
        }
      }
    })
    
    return Array.from(issueMap.values())
  } catch (error) {
    console.error('Error loading Jira issues from CSV:', error)
    throw error
  }
}

export async function loadJiraIssuesByProject(projectId: string): Promise<Issue[]> {
  const allIssues = await loadJiraIssuesFromCSV()
  return allIssues.filter(issue => 
    issue.team === `Project ${projectId}` || 
    issue.key.toLowerCase().includes(projectId.toLowerCase())
  )
}

export function getAvailableProjects(issues: Issue[]): string[] {
  const teams = new Set(issues.map(i => i.team))
  return Array.from(teams).sort()
}

function calculateDueDate(createdAt: string | null): string | null {
  if (!createdAt) return null
  try {
    const created = new Date(createdAt)
    // Random due date 3-14 days after creation
    const daysToAdd = 3 + Math.floor(Math.random() * 12)
    created.setDate(created.getDate() + daysToAdd)
    return created.toISOString()
  } catch {
    return null
  }
}

function calculateDuration(createdAt: string | null): number {
  if (!createdAt) return 0
  try {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.min(diffDays, 14) // Cap at 14 days
  } catch {
    return 0
  }
}
