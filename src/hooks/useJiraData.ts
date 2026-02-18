import { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { apiUrl } from '@/lib/api'

export interface JiraIssue {
  key: string
  issueType: string
  summary: string
  description: string
  priority: string
  status: string
  assignee: string
  team: string
  start: string | null
  due: string | null
  duration: number | string
  created?: string | null
  project?: string
  projectId?: string
  project_key?: string
  projectKey?: string
}

interface UseJiraDataReturn {
  issues: JiraIssue[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useJiraData(): UseJiraDataReturn {
  const { addToast } = useToast()
  const [issues, setIssues] = useState<JiraIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJiraIssues = async () => {
    try {
      setLoading(true)
      setError(null)
      const allIssues: JiraIssue[] = []

      console.log('[useJiraData] Fetching Jira data...')

      // Fetch all projects
      const projectsResp = await fetch(apiUrl('/api/jira/projects'), {
        credentials: 'include',
      })

      if (!projectsResp.ok) {
        throw new Error('Failed to fetch Jira projects')
      }

      const projectsData = await projectsResp.json()
      const projects = projectsData.projects || []
      console.log('[useJiraData] Found', projects.length, 'Jira projects')

      // Fetch issues for each project
      for (const project of projects) {
        try {
          const issuesResp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(project.key)}`), {
            credentials: 'include',
          })

          if (issuesResp.ok) {
            const issuesData = await issuesResp.json()
            const projectIssues = issuesData.issues || []
            console.log(`[useJiraData] Project ${project.key}: ${projectIssues.length} issues`)

            const mappedIssues = projectIssues.map((iss: any) => {
              // Ensure we have proper date fields - use any available date source
              const start = iss.start || iss.startDate || iss.created || null
              const due = iss.due || iss.dueDate || iss.duedate || null
              
              console.log(`[useJiraData] Mapping issue ${iss.key}:`, {
                rawStart: iss.start,
                rawStartDate: iss.startDate,
                rawCreated: iss.created,
                rawDue: iss.due,
                rawDueDate: iss.dueDate,
                rawDuedate: iss.duedate,
                mappedStart: start,
                mappedDue: due
              })
              
              return {
                key: iss.key || iss.id || '',
                issueType: iss.issueType || iss.type || 'Task',
                summary: iss.summary || iss.title || '',
                description: iss.description || '',
                project: project.key,
                priority: iss.priority || 'Medium',
                status: iss.status || 'Open',
                assignee: iss.assignee || 'Unassigned',
                team: 'Engineering',
                start: start,
                due: due,
                duration: iss.duration || 8,
                created: iss.created || null,
                projectKey: project.key,
              }
            })
            
            if (mappedIssues.length > 0) {
              console.log(`[useJiraData] Sample mapped issue from ${project.key}:`, {
                key: mappedIssues[0].key,
                summary: mappedIssues[0].summary,
                start: mappedIssues[0].start,
                due: mappedIssues[0].due,
                created: mappedIssues[0].created
              })
            }

            allIssues.push(...mappedIssues)
          }
        } catch (err) {
          console.warn(`[useJiraData] Failed to fetch issues for project ${project.key}:`, err)
        }
      }

      console.log('[useJiraData] Total issues collected:', allIssues.length)
      setIssues(allIssues)

      if (allIssues.length > 0) {
        addToast({
          type: 'success',
          title: 'Jira Data Loaded',
          description: `Loaded ${allIssues.length} issues from Jira`,
          duration: 3000,
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch Jira data'
      console.error('[useJiraData] Error:', err)
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Jira Load Failed',
        description: errorMsg,
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJiraIssues()
  }, [])

  return {
    issues,
    loading,
    error,
    refetch: fetchJiraIssues,
  }
}
