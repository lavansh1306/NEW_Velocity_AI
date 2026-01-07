import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IssuesTable, GanttChart, ManagerGantt, ManagerSummary } from '@/components/jira'
import { Issue } from '@/components/jira/types'
import { apiUrl } from '@/lib/api'

export default function JiraDashboard() {
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectKeyInput, setProjectKeyInput] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [currentProject, setCurrentProject] = useState<string | null>(null)
  const [loadedProjects, setLoadedProjects] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // No initial data load - teams start empty
    setLoading(false)
  }, [])

  // Auto-load project if `project` query param is present
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const projectParam = params.get('project')
    if (projectParam) {
      // Attempt to load the specified project right away
      handleSwitchProject(projectParam.toUpperCase())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // Filter tasks by selected assignee
  const selectedTasks = selectedAssignee
    ? allIssues.filter(i => i.assignee === selectedAssignee && i.due)
    : []

  // Clear selected assignee when issues change
  useEffect(() => {
    if (!selectedAssignee) return
    const exists = allIssues.some(i => i.assignee === selectedAssignee)
    if (!exists) setSelectedAssignee('')
  }, [allIssues, selectedAssignee])

  const fetchProjectData = async (projectKey: string): Promise<Issue[]> => {
    try {
      const response = await fetch(apiUrl(`/api/issues?projectKey=${projectKey}`))
      if (!response.ok) {
        throw new Error('Failed to fetch project issues')
      }
      const projectIssues = await response.json()
      const formattedIssues = (Array.isArray(projectIssues) ? projectIssues : (projectIssues.issues || [])).map((issue: any) => ({
        key: issue.key || '-',
        issueType: issue.issueType || issue.type || '-',
        summary: issue.summary || '-',
        description: issue.description || '-',
        priority: issue.priority || '-',
        status: issue.status || '-',
        assignee: issue.assignee || 'Unassigned',
        team: projectKey,
        created: issue.created || null,
        // prefer customfield_10015 (start date) if present
        start: issue.customfield_10015 || issue.start || null,
        due: issue.due || null,
        duration: issue.duration === undefined ? '' : issue.duration,
      }))
      return formattedIssues
    } catch (err) {
      throw err
    }
  }

  const handleAddProject = async () => {
    const projectKey = projectKeyInput.trim().toUpperCase()
    if (!projectKey) {
      alert('Please enter a project key')
      return
    }

    setAddingProject(true)
    setError(null)
    try {
      const formattedIssues = await fetchProjectData(projectKey)

      // Add to loaded projects if not already there
      if (!loadedProjects.includes(projectKey)) {
        setLoadedProjects([...loadedProjects, projectKey])
      }

      // Load current project data
      setAllIssues(formattedIssues)
      setCurrentProject(projectKey)
      const newAssignees = [...new Set(formattedIssues.map(i => i.assignee))].sort()
      setAssignees(newAssignees)
      setSelectedAssignee('')
      setProjectKeyInput('')
    } catch (err) {
      console.error('Error adding project:', err)
      setError(`Failed to add project: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setAddingProject(false)
    }
  }

  const handleSwitchProject = async (projectKey: string) => {
    setRefreshing(true)
    setError(null)
    try {
      const formattedIssues = await fetchProjectData(projectKey)
      setAllIssues(formattedIssues)
      setCurrentProject(projectKey)
      const newAssignees = [...new Set(formattedIssues.map(i => i.assignee))].sort()
      setAssignees(newAssignees)
      setSelectedAssignee('')
      // Ensure the loadedProjects list includes this project so the select shows it
      setLoadedProjects((prev) => (prev.includes(projectKey) ? prev : [...prev, projectKey]))
    } catch (err) {
      console.error('Error switching project:', err)
      setError(`Failed to load project: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefreshProject = async () => {
    if (!currentProject) return
    setRefreshing(true)
    setError(null)
    try {
      const formattedIssues = await fetchProjectData(currentProject)
      setAllIssues(formattedIssues)
      const newAssignees = [...new Set(formattedIssues.map(i => i.assignee))].sort()
      setAssignees(newAssignees)
    } catch (err) {
      console.error('Error refreshing project:', err)
      setError(`Failed to refresh project: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 md:px-4">
      {/* Loading Overlay */}
      {addingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-lg font-semibold text-gray-700 mb-4">Fetching Project Data...</div>
            <div className="inline-block">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full mx-auto max-w-full px-4 md:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/projects" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Jira Issues Dashboard
          </h1>
          <p className="text-gray-600">Created vs Due Date Analysis - Integrated with Velocity AI</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Controls area (Add Project UI removed) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Manage Jira project loading via the Projects page. Project auto-loads when provided via the Projects list.</p>
          </div>

          {currentProject && (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Assignee for Gantt Chart:</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                disabled={refreshing}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
              >
                <option value="">-- Choose Assignee --</option>
                {assignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={false} onChange={() => {}} disabled/>
                  <span className="text-sm text-gray-600">(Tip) Toggle Manager view below to see aggregated lanes</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Empty State - No Project Loaded */}
        {!currentProject ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Project Loaded</h3>
            <p className="text-gray-600 mb-4">Enter a project key above to load issues from Jira.</p>
            <p className="text-sm text-gray-500">Example: Enter "TEST" to fetch all issues from that project</p>
          </div>
        ) : (
          <>
            {/* Issues Table */}
            <div className="mb-8">
              <IssuesTable issues={allIssues} />
            </div>

            {/* Gantt Chart */}
            <div className="mb-8">
              {selectedAssignee ? (
                <GanttChart tasks={selectedTasks} assignee={selectedAssignee} />
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-4">Manager View</h3>
                  <ManagerSummary tasks={allIssues} />
                  <ManagerGantt tasks={allIssues} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
