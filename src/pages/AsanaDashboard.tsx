import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IssuesTable, GanttChart, ManagerGantt, ManagerSummary } from '@/components/asana'
import { Issue } from '@/components/asana/types'
import { apiUrl } from '@/lib/api'

export default function AsanaDashboard() {
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
      handleSwitchProject(projectParam)
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
      const response = await fetch(apiUrl(`/api/asana/issues?projectKey=${projectKey}`))
      if (!response.ok) {
        throw new Error('Failed to fetch project tasks')
      }
      const projectTasks = await response.json()
      const formattedIssues = (Array.isArray(projectTasks) ? projectTasks : (projectTasks.issues || [])).map((issue: any) => ({
        key: issue.key || '-',
        issueType: issue.issueType || issue.type || '-',
        summary: issue.summary || '-',
        description: issue.description || '-',
        priority: issue.priority || '-',
        status: issue.status || '-',
        assignee: issue.assignee || 'Unassigned',
        team: issue.team || '-',
        startDate: issue.startDate || null,
        due: issue.due || null,
        duration: issue.duration === undefined ? '' : issue.duration,
      }))
      return formattedIssues
    } catch (err) {
      throw err
    }
  }

  const handleAddProject = async () => {
    const projectKey = projectKeyInput.trim()
    if (!projectKey) {
      alert('Please enter an Asana Project ID')
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
      
      // Add to loaded projects if not already there
      if (!loadedProjects.includes(projectKey)) {
        setLoadedProjects(prev => [...prev, projectKey])
      }
      
      const newAssignees = [...new Set(formattedIssues.map(i => i.assignee))].sort()
      setAssignees(newAssignees)
      setSelectedAssignee('')
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-2 md:px-4">
      {/* Loading Overlay */}
      {addingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-lg font-semibold text-gray-700 mb-4">Fetching Asana Project Data...</div>
            <div className="inline-block">
              <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
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
            📊 Asana Tasks Dashboard
          </h1>
          <p className="text-gray-600">Start Date vs Due Date Analysis - Integrated with Velocity AI</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Asana Project</h3>
            <div className="flex gap-2 flex-col md:flex-row">
              <input
                type="text"
                placeholder="Enter Asana Project ID (e.g., 1212641939726128)"
                value={projectKeyInput}
                onChange={(e) => setProjectKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                disabled={addingProject || refreshing}
              />
              <button
                onClick={handleAddProject}
                disabled={addingProject || refreshing}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {addingProject ? 'Loading...' : 'Load Project'}
              </button>
            </div>
            {error && <div className="mt-3 text-sm text-red-600 font-medium">{error}</div>}
            {currentProject && <div className="mt-3 text-sm text-green-600 font-medium">✓ Current Project: {currentProject}</div>}
          </div>

          {loadedProjects.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Loaded Projects:</label>
              <div className="flex gap-2 flex-col md:flex-row items-start md:items-center flex-wrap">
                <select
                  value={currentProject || ''}
                  onChange={(e) => handleSwitchProject(e.target.value)}
                  disabled={refreshing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition disabled:bg-gray-100"
                >
                  <option value="">-- Select a project --</option>
                  {loadedProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
                <button
                  onClick={handleRefreshProject}
                  disabled={!currentProject || refreshing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
                >
                  {refreshing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Syncing...
                    </>
                  ) : (
                    <>🔄 Sync Changes</>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentProject && (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Assignee for Gantt Chart:</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                disabled={refreshing}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition disabled:bg-gray-100"
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
            <p className="text-gray-600 mb-4">Enter an Asana Project ID above to load tasks.</p>
            <p className="text-sm text-gray-500">Example: Enter your Asana Project ID to fetch all tasks from that project</p>
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
