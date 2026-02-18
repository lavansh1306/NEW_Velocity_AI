import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Plus,
  Loader2,
  Upload,
  ExternalLink,
  FileText,
  Settings,
  UserPlus,
  Briefcase,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Employee {
  id: string;
  name: string;
  skills: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed";
  createdAt: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  requiredSkills: string[];
  assignedTo?: string;
  status: "todo" | "in-progress" | "completed";
  aiSuggestions?: Employee[];
}

interface AssignmentResult {
  taskId: string;
  assignedEmployeeId: string;
  score: number;
  skillMatchConfidence: number;
}

export const DeploymentView = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"csv" | "jira" | null>(null);

  // Project creation
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: ""
  });

  // Task creation
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    estimatedHours: 0,
    requiredSkills: ""
  });

  // CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  // Jira Connection
  const [jiraConnected, setJiraConnected] = useState(false);
  const [jiraProjects, setJiraProjects] = useState<any[]>([]);
  const [selectedJiraProjects, setSelectedJiraProjects] = useState<string[]>([]);
  const [extractingJira, setExtractingJira] = useState(false);

  const { toast } = useToast();

  // Load employees and check Jira status on mount
  useEffect(() => {
    loadEmployees();
    checkJiraStatus();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch(apiUrl('/api/employees'));
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // CSV Upload Handler
  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setUploadingCsv(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch(apiUrl('/api/employees/upload-csv'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadEmployees();
        setDataSource("csv");
        toast({
          title: "Success",
          description: "Employee data uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload CSV file",
        variant: "destructive",
      });
    } finally {
      setUploadingCsv(false);
    }
  };

  // Jira Connection
  const handleJiraConnect = () => {
    window.location.href = apiUrl('/api/jira/auth/connect');
  };

  const checkJiraStatus = async () => {
    try {
      const response = await fetch(apiUrl('/api/jira/auth/status'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setJiraConnected(data.connected);
        if (data.connected) {
          await loadJiraProjects();
        }
      }
    } catch (error) {
      console.error('Error checking Jira status:', error);
    }
  };

  const loadJiraProjects = async () => {
    try {
      const response = await fetch(apiUrl('/api/jira/projects'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setJiraProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading Jira projects:', error);
    }
  };

  const handleJiraProjectExtract = async () => {
    if (selectedJiraProjects.length === 0) return;

    setExtractingJira(true);
    try {
      const response = await fetch(apiUrl('/api/jira/extract-employee-skills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectKeys: selectedJiraProjects })
      });

      if (response.ok) {
        const data = await response.json();
        // Save to CSV
        await fetch(apiUrl('/api/jira/save-employee-skills'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ employees: data.employees })
        });

        await loadEmployees();
        setDataSource("jira");
        toast({
          title: "Success",
          description: `Extracted skills for ${data.employees?.length || 0} employees`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extract employee skills from Jira",
        variant: "destructive",
      });
    } finally {
      setExtractingJira(false);
    }
  };

  // Project Management
  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: `proj_${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: "planning",
      createdAt: new Date().toISOString(),
      tasks: []
    };

    setProjects(prev => [...prev, project]);
    setCurrentProject(project);
    setNewProject({ name: "", description: "" });
    setShowProjectDialog(false);

    toast({
      title: "Project created",
      description: `"${project.name}" has been created successfully`,
    });
  };

  // Task Management
  const handleCreateTask = async () => {
    if (!currentProject || !newTask.title.trim()) return;

    setLoading(true);
    try {
      const task: Task = {
        id: `task_${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        estimatedHours: newTask.estimatedHours,
        requiredSkills: newTask.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
        status: "todo"
      };

      // Get AI suggestions
      if (employees.length > 0) {
        const suggestions = await getAISuggestions(task);
        task.aiSuggestions = suggestions;
      }

      setCurrentProject(prev => prev ? {
        ...prev,
        tasks: [...prev.tasks, task]
      } : null);

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        estimatedHours: 0,
        requiredSkills: ""
      });
      setShowTaskDialog(false);

      toast({
        title: "Task created",
        description: `"${task.title}" has been created with AI suggestions`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAISuggestions = async (task: Task): Promise<Employee[]> => {
    try {
      const response = await fetch(apiUrl('/api/deployed/get-ai-suggestions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription: `${task.title} ${task.description}`,
          requiredSkills: task.requiredSkills
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
    return [];
  };

  const handleAssignTask = async (taskId: string, employeeId: string) => {
    if (!currentProject) return;

    try {
      const response = await fetch(apiUrl('/api/deployed/assign-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          employeeId,
          projectId: currentProject.id
        })
      });

      if (response.ok) {
        setCurrentProject(prev => prev ? {
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === taskId
              ? { ...task, assignedTo: employeeId, status: "in-progress" }
              : task
          )
        } : null);

        toast({
          title: "Task assigned",
          description: "Task has been assigned successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkJiraStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">
            🚀 Deployment Dashboard
          </h1>
          <p className="text-gray-500 font-light">
            Manage projects, tasks, and AI-powered employee assignments
          </p>
        </div>

        {/* Jira Project Selection */}
        {jiraConnected && employees.length === 0 && (
          <Card className="mb-8 border-gray-100 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light">
                <FileText className="h-5 w-5" />
                Select Jira Projects for Data Extraction
              </CardTitle>
              <CardDescription className="font-light">
                Choose which Jira projects to extract employee skills from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-light">Connected to Jira</span>
                </div>

                {jiraProjects.length > 0 ? (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Available Projects ({jiraProjects.length}):
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                      {jiraProjects.map(project => (
                        <div
                          key={project.key}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                            selectedJiraProjects.includes(project.key)
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedJiraProjects(prev =>
                              prev.includes(project.key)
                                ? prev.filter(key => key !== project.key)
                                : [...prev, project.key]
                            );
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{project.title}</div>
                              <div className="text-xs text-gray-500 mt-1">{project.key}</div>
                              {project.description && (
                                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {project.description}
                                </div>
                              )}
                            </div>
                            {selectedJiraProjects.includes(project.key) && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        {selectedJiraProjects.length} project{selectedJiraProjects.length !== 1 ? 's' : ''} selected
                      </div>
                      <Button
                        onClick={handleJiraProjectExtract}
                        disabled={selectedJiraProjects.length === 0 || extractingJira}
                        className="bg-blue-600 hover:bg-blue-700 font-light"
                      >
                        {extractingJira ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Extracting Skills...
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            Extract from {selectedJiraProjects.length || 'Selected'} Project{selectedJiraProjects.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading Jira projects...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Source Setup - CSV Upload */}
        {!jiraConnected && employees.length === 0 && (
          <Card className="mb-8 border-gray-100 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light">
                <Settings className="h-5 w-5" />
                Setup Employee Data Source
              </CardTitle>
              <CardDescription className="font-light">
                Choose how to load employee data for AI-powered task assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={dataSource || "select"} onValueChange={(value) => setDataSource(value as any)}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="csv" className="font-light">Upload CSV</TabsTrigger>
                  <TabsTrigger value="jira" className="font-light">Connect Jira</TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="csv-upload" className="text-sm font-light">
                        Drop your employee CSV file here, or click to browse
                      </Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        className="max-w-xs mx-auto"
                      />
                      {csvFile && (
                        <p className="text-sm text-gray-600">Selected: {csvFile.name}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleCsvUpload}
                    disabled={!csvFile || uploadingCsv}
                    className="w-full bg-blue-600 hover:bg-blue-700 font-light"
                  >
                    {uploadingCsv ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CSV
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="jira" className="space-y-4">
                  <div className="text-center py-8">
                    <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-light mb-2">Connect to Jira</h3>
                    <p className="text-gray-600 mb-4 font-light">
                      Extract employee skills automatically from your Jira projects
                    </p>
                    <Button onClick={handleJiraConnect} className="bg-blue-600 hover:bg-blue-700 font-light">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Jira Account
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Projects and Tasks */}
        {employees.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Projects Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-gray-100 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-light">
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Projects
                    </span>
                    <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-light">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-light">Create New Project</DialogTitle>
                          <DialogDescription className="font-light">
                            Add a new project to organize your tasks and assignments.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="project-name" className="font-light">Project Name</Label>
                            <Input
                              id="project-name"
                              value={newProject.name}
                              onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter project name"
                              className="border-gray-200 focus:border-blue-500 font-light"
                            />
                          </div>
                          <div>
                            <Label htmlFor="project-desc" className="font-light">Description</Label>
                            <Textarea
                              id="project-desc"
                              value={newProject.description}
                              onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter project description"
                              className="border-gray-200 focus:border-blue-500 font-light"
                            />
                          </div>
                          <Button onClick={handleCreateProject} className="w-full bg-blue-600 hover:bg-blue-700 font-light">
                            Create Project
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentProject?.id === project.id
                            ? 'bg-blue-100 border-blue-300'
                            : 'hover:bg-gray-100'
                        } border`}
                        onClick={() => setCurrentProject(project)}
                      >
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-600">{project.tasks.length} tasks</div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No projects yet</p>
                        <p className="text-sm">Create your first project to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Area */}
            <div className="lg:col-span-2">
              {currentProject ? (
                <Card className="border-gray-100 rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between font-light">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {currentProject.name}
                      </span>
                      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-light">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-light">Add New Task</DialogTitle>
                            <DialogDescription className="font-light">
                              Create a task and get AI-powered employee suggestions.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="task-title" className="font-light">Task Title</Label>
                              <Input
                                id="task-title"
                                value={newTask.title}
                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter task title"
                                className="border-gray-200 focus:border-blue-500 font-light"
                              />
                            </div>
                            <div>
                              <Label htmlFor="task-desc" className="font-light">Description</Label>
                              <Textarea
                                id="task-desc"
                                value={newTask.description}
                                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter task description"
                                className="border-gray-200 focus:border-blue-500 font-light"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="task-priority" className="font-light">Priority</Label>
                                <Select
                                  value={newTask.priority}
                                  onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}
                                >
                                  <SelectTrigger className="border-gray-200 font-light">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="task-hours" className="font-light">Estimated Hours</Label>
                                <Input
                                  id="task-hours"
                                  type="number"
                                  value={newTask.estimatedHours}
                                  onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                                  placeholder="0"
                                  className="border-gray-200 focus:border-blue-500 font-light"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="task-skills" className="font-light">Required Skills (comma-separated)</Label>
                              <Input
                                id="task-skills"
                                value={newTask.requiredSkills}
                                onChange={(e) => setNewTask(prev => ({ ...prev, requiredSkills: e.target.value }))}
                                placeholder="React, JavaScript, API"
                                className="border-gray-200 focus:border-blue-500 font-light"
                              />
                            </div>
                            <Button onClick={handleCreateTask} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 font-light">
                              {loading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Creating Task...
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-2" />
                                  Create Task with AI Suggestions
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentProject.tasks.map(task => (
                        <Card key={task.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={
                                  task.priority === 'high' ? 'destructive' :
                                  task.priority === 'medium' ? 'default' : 'secondary'
                                }>
                                  {task.priority}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {task.estimatedHours}h estimated
                                </span>
                              </div>
                              {task.requiredSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.requiredSkills.map(skill => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in-progress' ? 'secondary' : 'outline'
                            }>
                              {task.status}
                            </Badge>
                          </div>

                          {/* AI Suggestions */}
                          {task.aiSuggestions && task.aiSuggestions.length > 0 && !task.assignedTo && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                AI Suggestions
                              </h5>
                              <div className="space-y-2">
                                {task.aiSuggestions.slice(0, 3).map(employee => (
                                  <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div>
                                      <span className="font-medium">{employee.name}</span>
                                      <div className="flex gap-1 mt-1">
                                        {employee.skills.slice(0, 2).map(skill => (
                                          <Badge key={skill} variant="outline" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAssignTask(task.id, employee.id)}
                                    >
                                      Assign
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assigned Employee */}
                          {task.assignedTo && (
                            <div className="mt-4 p-2 bg-green-50 rounded flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Assigned to: {employees.find(e => e.id === task.assignedTo)?.name}
                              </span>
                            </div>
                          )}
                        </Card>
                      ))}

                      {currentProject.tasks.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No tasks yet</p>
                          <p className="text-sm">Add your first task to get AI-powered employee suggestions</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Select a Project</p>
                      <p className="text-sm">Choose a project from the sidebar to view and manage tasks</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

