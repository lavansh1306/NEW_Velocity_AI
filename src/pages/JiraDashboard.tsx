import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IssuesTable, GanttChart, ManagerGantt, ManagerSummary } from '@/components/jira'
import { Issue } from '@/components/jira/types'
import { apiUrl } from '@/lib/api'
import { fetchProjectsHybrid, fetchIssuesHybrid, syncProjectFromJira } from '@/lib/jiraDbClient'
import { setCurrentOrgId } from '@/lib/orgContext'
import ProjectManagementDashboard from '@/components/projects/ProjectManagementDashboard'

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
  const [availableProjects, setAvailableProjects] = useState<Array<{ key: string; title: string }>>([])
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; name: string; url: string }>>([])
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null)

  useEffect(() => {
    // Check Jira connection status and get available sites
    const checkJiraStatus = async () => {
      try {
        const response = await fetch(apiUrl('/api/jira/auth/status'), { 
          credentials: 'include' 
        })
        if (response.ok) {
          const data = await response.json()
          // Store orgId in localStorage for jiraDbClient
          if (data.orgId) {
            setCurrentOrgId(data.orgId)
          }
          setCurrentSiteId(data.site?.cloudId || null)
          if (data.availableSites && Array.isArray(data.availableSites)) {
            setAvailableSites(data.availableSites)
          }
        }
      } catch (err) {
        console.error('[JiraDashboard] Error checking status:', err)
      }
    }
    checkJiraStatus()
  }, [])

  const handleSwitchSite = async (siteId: string) => {
    try {
      console.log('[JiraDashboard] Switching to site:', siteId);
      setRefreshing(true);
      
      const response = await fetch(apiUrl(`/api/jira/auth/switch-site/${siteId}`), {
        method: 'POST',
        credentials: 'include',
      })
      
      console.log('[JiraDashboard] Switch site response status:', response.status);
      
      if (response.ok) {
        const data = await response.json()
        console.log('[JiraDashboard] Switched to site:', data.site);
        setCurrentSiteId(data.site.id)
        setAvailableProjects([])
        setCurrentProject(null)
        
        // Wait a moment then re-fetch projects from the new site
        setTimeout(() => {
          fetchProjectsFromNewSite();
        }, 500);
      } else {
        console.error('[JiraDashboard] Failed to switch site:', response.status);
        setRefreshing(false);
      }
    } catch (err) {
      console.error('[JiraDashboard] Error switching site:', err)
      setRefreshing(false);
    }
  }

  const fetchProjectsFromNewSite = async () => {
    try {
      console.log('[JiraDashboard] Fetching projects from new site (API → DB)');
      // After switching site, we need live API (which writes to DB)
      const url = apiUrl('/api/jira/projects')
      const response = await fetch(url, { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        const projects = data.projects || []
        console.log('[JiraDashboard] Fetched projects from new site:', projects.length);
        setAvailableProjects(projects.map((p: any) => ({ key: p.key, title: p.title || p.name || p.key })))
        setRefreshing(false);
        
        if (projects.length > 0) {
          const firstProjectKey = projects[0].key
          console.log('[JiraDashboard] Auto-loading first project from new site:', firstProjectKey)
          handleSwitchProject(firstProjectKey)
        }
      } else {
        console.error('[JiraDashboard] Failed to fetch projects:', response.status);
        setRefreshing(false);
      }
    } catch (err) {
      console.error('[JiraDashboard] Error fetching projects from new site:', err)
      setRefreshing(false);
    }
  }

  const handleFetchProjects = async () => {
    try {
      const { projects } = await fetchProjectsHybrid()
      setAvailableProjects(projects.map(p => ({ key: p.key, title: p.title })))
    } catch (err) {
      console.error('[JiraDashboard] Error fetching projects:', err)
    }
  }

  useEffect(() => {
    // Auto-fetch available projects on mount — DB-first
    const fetchAvailableProjects = async () => {
      try {
        // Try DB first (no session needed)
        const { projects, source } = await fetchProjectsHybrid()
        console.log(`[JiraDashboard] Loaded ${projects.length} projects from ${source}`)

        if (projects.length > 0) {
          setAvailableProjects(projects.map(p => ({ key: p.key, title: p.title })))
          setProjectsLoaded(true)

          // Auto-load first project
          const firstProjectKey = projects[0].key
          console.log('[JiraDashboard] Auto-loading first project:', firstProjectKey)
          handleSwitchProject(firstProjectKey)
        } else {
          console.log('[JiraDashboard] No projects found in DB or API')
          setProjectsLoaded(true)
          setLoading(false)
        }
      } catch (err) {
        console.error('[JiraDashboard] Error fetching projects:', err)
        setProjectsLoaded(true)
        setLoading(false)
      }
    }
    
    fetchAvailableProjects()
  }, [])

  // Auto-load project if `project` query param is present
  const location = useLocation()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenProjectId, setFullscreenProjectId] = useState<string | null>(null)
  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const projectParam = params.get('project')
    const fullscreenParam = params.get('fullscreen')
    
    setIsFullscreen(fullscreenParam === 'true')
    if (fullscreenParam === 'true') {
      setFullscreenProjectId(projectParam)
    }
    
    console.log('[JiraDashboard] URL params:', location.search, 'project param:', projectParam, 'fullscreen:', fullscreenParam)
    if (projectParam) {
      // Attempt to load the specified project right away
      console.log('[JiraDashboard] Auto-loading project:', projectParam.toUpperCase())
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
      console.log('[fetchProjectData] Fetching from DB (hybrid) for:', projectKey)
      const { issues: rawIssues, source } = await fetchIssuesHybrid(projectKey)
      console.log(`[fetchProjectData] Got ${rawIssues.length} issues from ${source}`)

      const formattedIssues = rawIssues.map((issue: any) => ({
        key: issue.key || '-',
        issueType: issue.issueType || issue.type || '-',
        summary: issue.summary || '-',
        description: issue.description || '-',
        priority: issue.priority || '-',
        status: issue.status || '-',
        assignee: issue.assignee || 'Unassigned',
        team: projectKey,
        start: issue.customfield_10015 || issue.start || null,
        due: issue.due || null,
        duration: issue.duration === undefined ? '' : issue.duration,
      }))
      console.log('[fetchProjectData] Formatted issues:', formattedIssues.length)
      return formattedIssues
    } catch (err) {
      console.error('[fetchProjectData] Error:', err)
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
      // Ensure initial loading state is cleared after adding/loading a project
      if (loading) setLoading(false)
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
      // Clear initial loading if still set (first load via URL or auto-load)
      if (loading) setLoading(false)
    }
  }

  const handleRefreshProject = async () => {
    if (!currentProject) return
    setRefreshing(true)
    setError(null)
    try {
      // Force a live sync from Jira API (writes to DB), then use that data
      console.log('[JiraDashboard] Refreshing from live Jira API for:', currentProject)
      const liveIssues = await syncProjectFromJira(currentProject)
      const formattedIssues = liveIssues.map((issue: any) => ({
        key: issue.key || '-',
        issueType: issue.issueType || '-',
        summary: issue.summary || '-',
        description: issue.description || '-',
        priority: issue.priority || '-',
        status: issue.status || '-',
        assignee: issue.assignee || 'Unassigned',
        team: currentProject,
        start: issue.customfield_10015 || issue.start || null,
        due: issue.due || null,
        duration: issue.duration === undefined ? '' : issue.duration,
      }))
      setAllIssues(formattedIssues)
      const newAssignees = [...new Set(formattedIssues.map(i => i.assignee))].sort()
      setAssignees(newAssignees)
    } catch (err) {
      console.error('Error refreshing project:', err)
      setError(`Failed to refresh project: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRefreshing(false)
      if (loading) setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-light text-gray-700">Loading...</div>
      </div>
    )
  }

  // Show fullscreen project management dashboard if requested
  if (isFullscreen && currentProject) {
    const currentProjectTitle = availableProjects.find(p => p.key === currentProject)?.title || currentProject
    return (
      <ProjectManagementDashboard
        isOpen={true}
        onClose={() => window.history.back()}
        projectId={currentProject}
        projectTitle={currentProjectTitle}
        issues={allIssues}
        healthScore={0} // Will be calculated from issues
        endDate={undefined}
        weeksRemaining={undefined}
        team={assignees}
        fullscreen={true}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-4">
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
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            📊 Jira Issues Dashboard
          </h1>
          <p className="text-gray-600">Created vs Due Date Analysis - Integrated with Velocity AI</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Site Selector or Re-connect Button */}
          {projectsLoaded && availableSites.length > 0 ? (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Jira Site:
              </label>
              <select
                value={currentSiteId || ''}
                onChange={(e) => {
                  const siteId = e.target.value
                  if (siteId) {
                    handleSwitchSite(siteId)
                  }
                }}
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">Choose a site...</option>
                {availableSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          ) : projectsLoaded ? (
            <div className="mb-6 pb-6 border-b border-gray-200 bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 mb-4">No Jira sites loaded. You may need to re-connect.</p>
              <Button 
                onClick={() => window.location.href = apiUrl('/api/jira/auth/connect')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Re-connect to Jira
              </Button>
            </div>
          ) : null}

          {/* Project Selector */}
          {projectsLoaded && availableProjects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Project:
              </label>
              <select
                value={currentProject || ''}
                onChange={(e) => {
                  const projectKey = e.target.value
                  if (projectKey) {
                    handleSwitchProject(projectKey)
                  }
                }}
                disabled={refreshing}
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
              >
                <option value="">Choose a project...</option>
                {availableProjects.map((project) => (
                  <option key={project.key} value={project.key}>
                    {project.title} ({project.key})
                  </option>
                ))}
              </select>
            </div>
          )}
          
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
