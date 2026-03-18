import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { BannerEditIcon } from './BannerEditIcon';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TimelineContainer } from './timeline';
import { AIInsights } from './insights';
import {
  ArrowLeft, LayoutGrid, Users, CheckSquare,
  Clock, Lightbulb, Sparkles, Loader2, ChevronDown, ChevronUp, X, Plus, AlertTriangle, TrendingDown
} from 'lucide-react';

export default function ProjectAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'timeline' | 'insights'>('overview');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<{ taskId: string; currentStatus: string } | null>(null);
  const [updatingTask, setUpdatingTask] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const [isTaskFetching, setIsTaskFetching] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    status: 'not_started',
    assignee_id: '',
    estimated_hours: 0,
    start_date: '',
    due_date: ''
  });

  // New Task Modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    description: '',
    estimated_hours: 0,
    assignee_id: '',
    due_date: ''
  });

  // Completion Warning Modal
  const [showCompletionWarning, setShowCompletionWarning] = useState(false);
  const [incompleteTasks, setIncompleteTasks] = useState<any[]>([]);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);

  // Add Team Member Modal
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loadingOrgMembers, setLoadingOrgMembers] = useState(false);
  const [localAllocatedMembers, setLocalAllocatedMembers] = useState<any[]>([]);
  const [addTeamMemberForm, setAddTeamMemberForm] = useState({
    user_id: '',
    allocation_percentage: 50,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  // Local state for issues/tasks to enable refetching
  const [localIssues, setLocalIssues] = useState<any[]>([]);
  const [showAbandonedTasks, setShowAbandonedTasks] = useState(false);
  const [showAbandonConfirmation, setShowAbandonConfirmation] = useState(false);
  const [taskToAbandon, setTaskToAbandon] = useState<any>(null);

  const { loading, error, project, issues, metrics, teamMembers, allocatedTeamMembers } = useProjectAnalytics(id);
  const { orgId } = useAuth();

  // Sync local issues with hook data
  useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setSelectedTaskStatus(null);
      }
    };

    if (selectedTaskStatus) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedTaskStatus]);

  // Fetch organization members when modal opens
  useEffect(() => {
    if (isAddTeamMemberModalOpen && project) {
      fetchOrgMembers();
    }
  }, [isAddTeamMemberModalOpen, project]);

  // Sync local allocated members with hook data
  useEffect(() => {
    setLocalAllocatedMembers(allocatedTeamMembers);
  }, [allocatedTeamMembers]);

  // Refetch team data when Team tab opens
  useEffect(() => {
    if (activeTab === 'team' && project?.id) {
      refetchAllocatedTeamMembers();
    }
  }, [activeTab, project?.id]);

  // Refetch tasks when Tasks tab opens
  useEffect(() => {
    if (activeTab === 'tasks' && project?.id) {
      refetchTasks();
    }
  }, [activeTab, project?.id]);

  const fetchOrgMembers = async () => {
    setLoadingOrgMembers(true);
    try {
      // Use orgId from auth context, fallback to project.organization_id
      const organizationId = orgId || project?.organization_id;
      
      if (!organizationId) {
        console.error('No organization ID available');
        toast.error('Unable to load organization members - missing organization context');
        return;
      }

      // Fetch from users table instead of organization_members
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Map the response to get user details
      const members = data?.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown Member'
      })) || [];
      
      setOrgMembers(members);
    } catch (err: any) {
      console.error('Error fetching organization members:', err);
      toast.error('Failed to load organization members');
    } finally {
      setLoadingOrgMembers(false);
    }
  };

  const TASK_STATUSES = ['not_started', 'in_progress', 'blocked', 'completed', 'abandoned'];
  const STATUS_COLORS: { [key: string]: string } = {
    'not_started': 'bg-[#F5F5F4] text-[#57534E]',
    'in_progress': 'bg-[#DBEAFE] text-[#1E40AF]',
    'blocked': 'bg-[#FEE2E2] text-[#991B1B]',
    'completed': 'bg-[#DCFCE7] text-[#15803D]',
    'abandoned': 'bg-[#E5E7EB] text-[#6B7280]'
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(' ', '_');
    return STATUS_COLORS[normalizedStatus] || STATUS_COLORS['not_started'];
  };

  const getAbandonedTasks = (tasks: any[]): any[] => {
    return tasks.filter(task => task.status?.toLowerCase() === 'abandoned');
  };

  const getActiveTasks = (tasks: any[]): any[] => {
    return tasks.filter(task => task.status?.toLowerCase() !== 'abandoned');
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdatingTask(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      toast.success(`Task status updated to ${newStatus}`);
      setSelectedTaskStatus(null);
      await refetchTasks();
    } catch (err: any) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status');
    } finally {
      setUpdatingTask(false);
    }
  };

  // Modal handlers
  const openEditModal = () => {
    if (project) {
      setEditForm({
        name: project.name || '',
        description: (project as any).description || '',
        status: (project as any).status || 'active'
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProject = async () => {
    if (!project) return;
    
    // If status is being changed to "completed", trigger the completion check instead
    if (editForm.status === 'completed' && project.status !== 'completed') {
      setIsEditModalOpen(false);
      handleCompleteProject();
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update(editForm)
        .eq('id', project.id);

      if (error) throw error;
      toast.success('Project updated successfully');
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const openTaskModal = (task: any) => {
    setSelectedTask(task);
    setTaskForm({
      name: task.summary || '',
      description: task.description || '',
      status: task.status || 'not_started',
      assignee_id: task.assignee_id || '',
      estimated_hours: task.original_estimate_seconds ? Math.round(task.original_estimate_seconds / 3600) : 0,
      start_date: task.start_date || '',
      due_date: task.due_date || ''
    });
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    setIsTaskSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          name: taskForm.name,
          description: taskForm.description,
          status: taskForm.status,
          assignee_id: taskForm.assignee_id || null,
          estimated_hours: taskForm.estimated_hours,
          start_date: taskForm.start_date || null,
          due_date: taskForm.due_date || null
        })
        .eq('id', selectedTask.id);

      if (error) throw error;
      toast.success('Task updated successfully');
      setIsTaskModalOpen(false);
      await refetchTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    } finally {
      setIsTaskSaving(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskForm.name || !id) {
      toast.error('Task name is required');
      return;
    }

    setIsTaskSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: id,
          name: newTaskForm.name,
          description: newTaskForm.description,
          estimated_hours: newTaskForm.estimated_hours,
          assignee_id: newTaskForm.assignee_id || null,
          due_date: newTaskForm.due_date || null,
          status: 'not_started'
        });

      if (error) throw error;
      toast.success('Task created successfully');
      setIsNewTaskModalOpen(false);
      setNewTaskForm({ name: '', description: '', estimated_hours: 0, assignee_id: '', due_date: '' });
      await refetchTasks();
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
    } finally {
      setIsTaskSaving(false);
    }
  };

  const handleCompleteProject = () => {
    // Filter incomplete tasks, excluding abandoned ones
    const incomplete = localIssues.filter(i => {
      const isAbandoned = i.status?.toLowerCase() === 'abandoned';
      const isDone = ['done', 'resolved', 'closed', 'complete', 'completed'].some(s => i.status?.toLowerCase().includes(s));
      return !isDone && !isAbandoned;
    });
    
    if (incomplete.length > 0) {
      setIncompleteTasks(incomplete);
      setShowCompletionWarning(true);
      setIsConfirmingCompletion(false); // Reset confirmation state
    } else {
      // All active tasks complete, allow completion
      completeProjectWithConfirmation();
    }
  };

  const handleCompleteAnyway = () => {
    setIsConfirmingCompletion(true);
  };

  const handleConfirmCompletion = async () => {
    await completeProjectWithConfirmation();
  };

  const completeProjectWithConfirmation = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', project?.id);

      if (error) throw error;
      toast.success('Project marked as completed');
      setShowCompletionWarning(false);
      setIsConfirmingCompletion(false);
      // Optionally navigate back
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err: any) {
      console.error('Error completing project:', err);
      toast.error('Failed to complete project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsAbandoned = (task: any) => {
    setTaskToAbandon(task);
    setShowAbandonConfirmation(true);
  };

  const handleConfirmAbandon = async () => {
    if (!taskToAbandon) return;

    setUpdatingTask(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'abandoned' })
        .eq('id', taskToAbandon.id);

      if (error) throw error;
      toast.success(`Task "${taskToAbandon.summary}" marked as abandoned`);
      setShowAbandonConfirmation(false);
      setTaskToAbandon(null);
      setIsTaskModalOpen(false);
      await refetchTasks();
    } catch (err: any) {
      console.error('Error abandoning task:', err);
      toast.error('Failed to abandon task');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleRestoreTask = async (task: any) => {
    setUpdatingTask(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'not_started' })
        .eq('id', task.id);

      if (error) throw error;
      toast.success(`Task "${task.summary}" restored`);
      await refetchTasks();
    } catch (err: any) {
      console.error('Error restoring task:', err);
      toast.error('Failed to restore task');
    } finally {
      setUpdatingTask(false);
    }
  };

  const refetchAllocatedTeamMembers = async () => {
    if (!project?.id) return;
    
    try {
      // Fetch fresh data from project_team_allocations
      const { data: allocations, error } = await supabase
        .from('project_team_allocations')
        .select('id, user_id, allocation_percentage, start_date, end_date, users(id, name, email)')
        .eq('project_id', project.id);

      if (error) throw error;

      const freshMembers = allocations?.map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        name: a.users?.name || 'Unknown',
        email: a.users?.email,
        role: 'Team Member',
        allocated_hours: Math.round((40 * a.allocation_percentage) / 100),
        start_date: a.start_date,
        end_date: a.end_date,
        allocation_percentage: a.allocation_percentage
      })) || [];

      setLocalAllocatedMembers(freshMembers);
    } catch (err: any) {
      console.error('Error refetching team members:', err);
    }
  };

  const refetchTasks = async () => {
    if (!project?.id) return;
    
    try {
      // Fetch fresh task data
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project.id);

      if (error) throw error;

      // Fetch all organization users for mapping assignees
      const { data: orgUsers } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', project.organization_id);

      const orgUsersMap = new Map(orgUsers?.map(u => [u.id, u]) || []);

      // Map tasks to issues format
      const freshIssues = (tasksData || []).map(t => {
        const assignedUser = orgUsersMap.get(t.assignee_id);
        return {
          id: t.id,
          issue_key: `TASK-${t.id.substring(0, 4)}`,
          issue_type: 'Task',
          summary: t.name,
          status: t.status || 'not_started',
          assignee: assignedUser?.name || 'Unassigned',
          time_spent_seconds: (t.actual_hours || 0) * 3600,
          original_estimate_seconds: (t.estimated_hours || 0) * 3600,
          created_date: t.created_at,
          description: t.description,
          assignee_id: t.assignee_id,
          estimated_hours: t.estimated_hours,
          actual_hours: t.actual_hours,
          start_date: t.start_date,
          due_date: t.due_date
        };
      });

      setLocalIssues(freshIssues);
    } catch (err: any) {
      console.error('Error refetching tasks:', err);
    }
  };

  const handleAddTeamMember = async () => {
    if (!addTeamMemberForm.user_id || !addTeamMemberForm.end_date || !project) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsAddingTeamMember(true);
    try {
      // Validate organization context before insert
      if (!project.organization_id) {
        console.warn('Project missing organization_id:', project.id);
        toast.error('Project configuration error: missing organization context');
        return;
      }

      const { error } = await supabase
        .from('project_team_allocations')
        .insert({
          project_id: project.id,
          user_id: addTeamMemberForm.user_id,
          allocation_percentage: addTeamMemberForm.allocation_percentage,
          start_date: addTeamMemberForm.start_date,
          end_date: addTeamMemberForm.end_date
        });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint,
          fullError: error
        });
        throw error;
      }
      
      toast.success('Team member added successfully');
      setIsAddTeamMemberModalOpen(false);
      setAddTeamMemberForm({
        user_id: '',
        allocation_percentage: 50,
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
      
      // Refetch allocated team members to show the newly added member
      await refetchAllocatedTeamMembers();
    } catch (err: any) {
      console.error('Error adding team member:', err);
      
      // Show more detailed error message
      let errorMsg = 'Failed to add team member';
      if (err.message) {
        errorMsg = err.message;
        if (err.message.includes('policy')) {
          errorMsg = 'Permission denied: ' + err.message + ' (Check if user and project are in the same organization)';
        } else if (err.message.includes('UNIQUE')) {
          errorMsg = 'This team member is already allocated to this project';
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setIsAddingTeamMember(false);
    }
  };


  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif] animate-in fade-in duration-300 relative">
        <div className="max-w-[1200px] mx-auto space-y-8">

          {!loading && !project && !error && (
            <div className="text-center py-12">
              <p className="text-[#78716C]">Project not found</p>
            </div>
          )}

          {project && (() => {
            const startDate = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <>
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Projects
                </button>

                <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group">
                  {/* Edit Icon - Top Right Corner */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <BannerEditIcon onEdit={openEditModal} isLoading={isSaving} />
                  </div>

                  <div className="space-y-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${metrics.isAtRisk ? 'bg-[#FFF1F2] text-[#BE123C]' : 'bg-[#F0FDFA] text-[#0F766E]'}`}>
                      {metrics.isAtRisk ? 'At Risk' : 'On Track'}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-light text-[#1C1917] tracking-tight">
                      {project.name}
                    </h1>
                    <p className="text-sm text-[#78716C]">
                      {startDate} &rarr; Active · <span className="text-[#A8A29E]">{metrics.totalTasks} issues tracked</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-[#A8A29E] mb-2 uppercase tracking-wider">Health Score</p>
                      <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl font-light mx-auto ${metrics.isAtRisk ? 'border-pink-100 bg-pink-50 text-pink-500' : 'border-teal-100 bg-teal-50 text-teal-600'}`}>
                        {metrics.healthScore}
                      </div>
                      <p className="text-xs text-[#A8A29E] mt-2">Feasibility {metrics.feasibility}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-[#F5F5F4] rounded-xl w-fit border border-[#E7E5E4]">
                  {(() => {
                    const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
                      <button
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeTab === id ? 'bg-white shadow-sm text-[#1C1917] font-medium border border-[#E7E5E4]' : 'text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917]'}`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                    return (
                      <>
                        <TabButton id="overview" label="Overview" icon={LayoutGrid} />
                        <TabButton id="team" label="Team" icon={Users} />
                        <TabButton id="tasks" label="Tasks" icon={CheckSquare} />
                        <TabButton id="timeline" label="Timeline" icon={Clock} />
                        <TabButton id="insights" label="AI Insights" icon={Lightbulb} />
                      </>
                    );
                  })()}
                </div>

                {/* --- TAB CONTENT: OVERVIEW --- */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 divide-x divide-[#E7E5E4]">
                        {[
                          { val: metrics.totalEstHours, label: 'Total Est. Hours' },
                          { val: metrics.actualHours, label: 'Actual Hours' },
                          { val: metrics.remainingHours, label: 'Remaining' },
                          { val: `${metrics.completionPct}%`, label: 'Completion' },
                          { val: metrics.teamSize, label: 'Team Size' },
                        ].map((stat, i) => (
                          <div key={i} className={`px-4 ${i === 0 ? 'first:px-0' : ''}`}>
                            <p className="text-4xl font-light text-[#1C1917]">{stat.val}</p>
                            <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Completion Progress */}
                      <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm space-y-6">
                        <h3 className="text-[#1C1917] text-lg font-light">Completion Progress</h3>
                        <div>
                          <div className="flex justify-between text-sm mb-3">
                            <span className="text-[#78716C]">Overall</span>
                            <span className="text-[#1C1917]">{metrics.completionPct}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                            <div className="h-full bg-[#1C1917] rounded-full transition-all duration-1000" style={{ width: `${Math.min(metrics.completionPct, 100)}%` }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="bg-[#F0FDFA] rounded-xl p-6 border border-teal-100">
                            <p className="text-3xl text-[#0F766E] font-light">{metrics.tasksCompleted}</p>
                            <p className="text-xs text-[#0F766E] mt-2">Tasks Completed</p>
                          </div>
                          <div className="bg-[#FFF7ED] rounded-xl p-6 border border-orange-100">
                            <p className="text-3xl text-[#C2410C] font-light">{metrics.tasksRemaining}</p>
                            <p className="text-xs text-[#C2410C] mt-2">Tasks Remaining</p>
                          </div>
                        </div>
                      </div>

                      {/* Hours Breakdown */}
                      <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm space-y-6">
                        <h3 className="text-[#1C1917] text-lg font-light">Hours Breakdown</h3>
                        <div className="space-y-8 pt-2">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-[#78716C]">Estimated</span>
                              <span className="text-[#1C1917]">{metrics.totalEstHours}h</span>
                            </div>
                            <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                              <div className="h-full bg-[#E7E5E4] rounded-full" style={{ width: '100%' }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-[#78716C]">Logged</span>
                              <span className="text-[#1C1917]">{metrics.actualHours}h</span>
                            </div>
                            <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                              <div className="h-full bg-[#0F766E] rounded-full transition-all duration-1000" style={{ width: `${metrics.totalEstHours > 0 ? Math.min((metrics.actualHours / metrics.totalEstHours) * 100, 100) : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F0FDFA] border border-teal-100 rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#CCFBF1] p-3 rounded-xl text-[#0F766E]">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-[#0F766E] font-medium uppercase tracking-wider mb-1">AI Health Check</p>
                          <p className="text-[#1C1917] text-sm">
                            {metrics.actualHours > metrics.totalEstHours ? 'Project is exceeding estimated hours. Immediate review of scope required.' : 'Project is tracking within estimated time budget.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB CONTENT: TEAM --- */}
                {activeTab === 'team' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Team Analytics Summary */}
                    {teamMembers.length > 0 && (
                      <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                        <h3 className="text-lg font-light text-[#1C1917] mb-6">Team Analytics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          <div className="border-r border-[#E7E5E4] pr-4">
                            <p className="text-4xl font-light text-[#1C1917]">{teamMembers.length}</p>
                            <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Team Size</p>
                          </div>
                          <div className="border-r border-[#E7E5E4] pr-4">
                            <p className="text-4xl font-light text-[#1C1917]">{metrics.totalTasks}</p>
                            <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Total Tasks</p>
                          </div>
                          <div className="border-r border-[#E7E5E4] pr-4">
                            <p className="text-4xl font-light text-[#0F766E]">{Math.round(metrics.totalTasks / Math.max(teamMembers.length, 1))}</p>
                            <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Avg per Person</p>
                          </div>
                          <div className="border-r border-[#E7E5E4] pr-4">
                            <p className="text-4xl font-light text-[#1C1917]">{metrics.tasksCompleted}</p>
                            <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Completed</p>
                          </div>
                          <div className="pr-4">
                            <p className="text-4xl font-light text-[#C2410C]">{metrics.tasksRemaining}</p>
                            <p className="text-xs text-[#A8A29E] mt-2 uppercase tracking-wider">Remaining</p>
                          </div>
                        </div>

                        {/* Workload Distribution by Status */}
                        <div className="mt-6 grid grid-cols-3 gap-4">
                          {(() => {
                            const healthy = teamMembers.filter(m => m.status === 'Healthy').length;
                            const overloaded = teamMembers.filter(m => m.status === 'Overloaded').length;
                            const underutilized = teamMembers.filter(m => m.status === 'Underutilized').length;
                            return (
                              <>
                                <div className="bg-[#F0FDFA] rounded-lg p-4 border border-teal-100">
                                  <p className="text-sm font-medium text-[#0F766E]">{healthy} Healthy</p>
                                  <p className="text-xs text-[#0F766E] opacity-75 mt-1">{Math.round((healthy / teamMembers.length) * 100)}% of team</p>
                                </div>
                                <div className="bg-[#FFF1F2] rounded-lg p-4 border border-pink-100">
                                  <p className="text-sm font-medium text-[#BE123C]">{overloaded} Overloaded</p>
                                  <p className="text-xs text-[#BE123C] opacity-75 mt-1">{Math.round((overloaded / teamMembers.length) * 100)}% of team</p>
                                </div>
                                <div className="bg-[#FFF7ED] rounded-lg p-4 border border-orange-100">
                                  <p className="text-sm font-medium text-[#C2410C]">{underutilized} Underutilized</p>
                                  <p className="text-xs text-[#C2410C] opacity-75 mt-1">{Math.round((underutilized / teamMembers.length) * 100)}% of team</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Allocated Team Members Section */}
                    {localAllocatedMembers.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-light text-[#1C1917]">Project Team</h3>
                            <span className="text-xs font-medium bg-[#F0FDFA] text-[#0F766E] px-3 py-1 rounded-full border border-teal-100">
                              {localAllocatedMembers.length} members
                            </span>
                          </div>
                          <Button onClick={() => setIsAddTeamMemberModalOpen(true)} className="bg-[#0F766E] hover:bg-[#0D635C] text-white rounded-xl px-4 py-2 h-auto font-light text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Team Member
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {localAllocatedMembers.map((member) => {
                            const startD = new Date(member.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const endD = new Date(member.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
                            return (
                              <div key={member.id} className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] font-medium border border-teal-100">
                                      {member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-[#1C1917] text-lg">{member.name}</p>
                                      <p className="text-sm text-[#78716C]">{member.role}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs px-3 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-teal-100 font-medium">
                                    {member.allocation_percentage}%
                                  </span>
                                </div>
                                <div className="space-y-4 pt-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#78716C] font-light">Allocated Hours</span>
                                    <span className="text-[#1C1917] font-medium">{member.allocated_hours}h</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#78716C] font-light">Duration</span>
                                    <span className="text-[#1C1917] font-medium text-xs">{startD} to {endD}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Task-Assigned Team Members Section */}
                    {teamMembers.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-light text-[#1C1917]">Task Assignments</h3>
                          <span className="text-xs font-medium bg-[#FFF7ED] text-[#C2410C] px-3 py-1 rounded-full border border-orange-100">
                            {teamMembers.length} team members
                          </span>
                        </div>
                        <div className="space-y-4">
                          {teamMembers.map((member) => {
                            const isExpanded = expandedMember === member.id;
                            return (
                              <div key={member.id} className="bg-white rounded-[24px] border border-[#E7E5E4] shadow-sm overflow-hidden">
                                {/* Member Header */}
                                <div 
                                  className="p-6 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
                                  onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className="w-12 h-12 rounded-full bg-[#F5F5F4] flex items-center justify-center text-[#1C1917] font-medium border border-[#E7E5E4]">
                                        {member.initials}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-[#1C1917] text-lg">{member.name}</p>
                                        <p className="text-sm text-[#78716C]">{member.role}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-[#1C1917]">{member.tasks_assigned}</p>
                                        <p className="text-xs text-[#78716C]">tasks assigned</p>
                                      </div>
                                      <span className={`text-xs px-3 py-1 rounded-full border ${member.status === 'Overloaded' ? 'bg-[#FFF1F2] text-[#BE123C] border-pink-100' :
                                        member.status === 'Underutilized' ? 'bg-[#FFF7ED] text-[#C2410C] border-orange-100' :
                                          'bg-[#F0FDFA] text-[#0F766E] border-teal-100'
                                        }`}>
                                        {member.status}
                                      </span>
                                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#78716C]" /> : <ChevronDown className="w-5 h-5 text-[#78716C]" />}
                                    </div>
                                  </div>

                                  {/* Quick Stats */}
                                  <div className="mt-4 grid grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs text-[#78716C] font-light">Completed</p>
                                      <p className="text-sm font-medium text-[#0F766E]">{member.tasks_completed}/{member.tasks_assigned}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[#78716C] font-light">Hours</p>
                                      <p className="text-sm font-medium text-[#1C1917]">{member.actual_hours}h</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[#78716C] font-light">Utilization</p>
                                      <p className="text-sm font-medium text-[#1C1917]">{member.utilization}%</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[#78716C] font-light">Health</p>
                                      <div className="w-full bg-[#E7E5E4] rounded-full h-1.5 mt-1 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${member.status === 'Overloaded' ? 'bg-[#BE123C]' :
                                            member.status === 'Underutilized' ? 'bg-[#C2410C]' : 'bg-[#0F766E]'
                                            }`}
                                          style={{ width: `${Math.min(member.utilization, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Expandable Tasks Section */}
                                {isExpanded && (
                                  <div className="border-t border-[#E7E5E4] p-6 bg-[#FAFAF9]">
                                    <h4 className="text-sm font-medium text-[#1C1917] mb-4">Assigned Tasks ({member.tasks.length})</h4>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                      {member.tasks.length > 0 ? (
                                        member.tasks.map((task, idx) => {
                                          const isDone = task.status?.toLowerCase() === 'completed';
                                          const isStatusOpen = selectedTaskStatus?.taskId === task.id;
                                          return (
                                            <div key={idx} className="bg-white rounded-lg border border-[#E7E5E4] p-4 relative">
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-[#0F766E] border-[#0F766E]' : 'border-[#E7E5E4]'}`}>
                                                      {isDone && <span className="text-white text-xs">✓</span>}
                                                    </div>
                                                    <p className={`text-sm font-medium ${isDone ? 'text-[#A8A29E] line-through' : 'text-[#1C1917]'}`}>
                                                      {task.name}
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-2 ml-7 mt-2">
                                                    <p className="text-xs text-[#78716C]">Status:</p>
                                                    <button
                                                      onClick={() => setSelectedTaskStatus(selectedTaskStatus?.taskId === task.id ? null : { taskId: task.id, currentStatus: task.status })}
                                                      className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors hover:opacity-80 ${getStatusColor(task.status)}`}
                                                    >
                                                      {task.status}
                                                    </button>
                                                  </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                  <p className="text-xs text-[#78716C]">Est / Actual</p>
                                                  <p className="text-sm font-medium text-[#1C1917]">{task.estimated_hours.toFixed(1)}h / {task.actual_hours.toFixed(1)}h</p>
                                                </div>
                                              </div>

                                              {/* Status Dropdown */}
                                              {isStatusOpen && (
                                                <div ref={statusDropdownRef} className="absolute top-full left-7 mt-2 bg-white border border-[#E7E5E4] rounded-lg shadow-lg z-50 min-w-[160px]">
                                                  {TASK_STATUSES.map((status) => (
                                                    <button
                                                      key={status}
                                                      onClick={() => updateTaskStatus(task.id, status)}
                                                      disabled={updatingTask}
                                                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[#FAFAF9] disabled:opacity-50 ${
                                                        task.status === status ? 'bg-[#F0FDFA] font-medium' : ''
                                                      } ${status === 'completed' ? 'border-b border-[#E7E5E4]' : ''}`}
                                                    >
                                                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(status)}`}>
                                                        {status}
                                                      </span>
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-sm text-[#A8A29E] text-center py-4">No tasks assigned</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {localAllocatedMembers.length === 0 && teamMembers.length === 0 && (
                      <div className="col-span-full text-center py-16 text-[#A8A29E] bg-white rounded-[24px] border border-[#E7E5E4] border-dashed">
                        <Users className="w-12 h-12 mx-auto mb-4 text-[#A8A29E] opacity-50" />
                        <p className="mb-6">No team members allocated or assigned to this project yet.</p>
                        <Button onClick={() => setIsAddTeamMemberModalOpen(true)} className="bg-[#0F766E] hover:bg-[#0D635C] text-white rounded-xl px-6 py-2 h-auto font-light flex items-center gap-2 mx-auto">
                          <Plus className="w-4 h-4" /> Add Team Member
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB CONTENT: TASKS --- */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h2 className="text-lg font-light text-[#1C1917]">Tasks</h2>
                        {getAbandonedTasks(localIssues).length > 0 && (
                          <button
                            onClick={() => setShowAbandonedTasks(!showAbandonedTasks)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                              showAbandonedTasks
                                ? 'bg-[#E5E7EB] text-[#6B7280] border-gray-300'
                                : 'bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#6B7280]'
                            }`}
                            title={`${getAbandonedTasks(localIssues).length} abandoned task${getAbandonedTasks(localIssues).length !== 1 ? 's' : ''}`}
                          >
                            {showAbandonedTasks ? '✓' : '○'} Abandoned ({getAbandonedTasks(localIssues).length})
                          </button>
                        )}
                      </div>
                      <Button onClick={() => setIsNewTaskModalOpen(true)} className="bg-[#0F766E] hover:bg-[#0D635C] text-white rounded-xl px-4 py-2 h-auto font-light transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Task
                      </Button>
                    </div>
                    <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                      <div className="space-y-2">
                        {(() => {
                          const tasksToDisplay = showAbandonedTasks ? localIssues : getActiveTasks(localIssues);
                          return (
                            <>
                              {tasksToDisplay.map(issue => {
                                const estHours = issue.original_estimate_seconds ? Math.round(issue.original_estimate_seconds / 3600) : 0;
                                const isAbandoned = issue.status?.toLowerCase() === 'abandoned';
                                return (
                                  <div 
                                    key={issue.id} 
                                    onClick={() => openTaskModal(issue)}
                                    className={`cursor-pointer flex justify-between items-center p-4 hover:bg-[#FAFAF9] rounded-xl border border-transparent hover:border-[#E7E5E4] transition-all ${isAbandoned ? 'opacity-60' : ''}`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-[#0F766E] bg-[#F0FDFA] px-2 py-1 rounded-md border border-teal-100">
                                          {issue.issue_key}
                                        </span>
                                        <span className={`text-[#1C1917] font-medium ${isAbandoned ? 'line-through text-[#A8A29E]' : ''}`}>
                                          {issue.summary}
                                        </span>
                                        {isAbandoned && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#6B7280] font-medium">Abandoned</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-[#78716C] mt-2 pl-1 flex items-center gap-2">
                                        <span>{issue.issue_type}</span>
                                        <span>·</span>
                                        <span>Assigned to <span className="font-medium text-[#1C1917]">{issue.assignee || 'Unassigned'}</span></span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 font-medium text-[#1C1917]">
                                          <Clock className="w-3 h-3 text-[#A8A29E]" />
                                          {estHours}h est.
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className={`text-xs px-2 py-1 rounded border ${
                                        isAbandoned ? 'bg-[#E5E7EB] text-[#6B7280] border-gray-300' :
                                        ['done', 'resolved', 'closed', 'complete'].some(s => issue.status?.toLowerCase().includes(s))
                                          ? 'bg-[#F0FDFA] text-[#0F766E] border-teal-100'
                                          : 'bg-[#FFF7ED] text-[#C2410C] border-orange-100'
                                        }`}>
                                        {issue.status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {tasksToDisplay.length === 0 && (
                                <p className="text-center text-[#A8A29E] py-8">
                                  {showAbandonedTasks && localIssues.some(t => t.status?.toLowerCase() === 'abandoned') ? 'No abandoned tasks.' : 'No active tasks found. Create your first task using the Add Task button.'}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB CONTENT: TIMELINE --- */}
                {activeTab === 'timeline' && (
                  <div className="animate-in fade-in duration-300">
                    <TimelineContainer
                      tasks={localIssues.map(issue => ({
                        id: issue.id,
                        name: issue.summary,
                        status: (issue.status?.toLowerCase()?.replace(' ', '_') || 'not_started') as 'not_started' | 'in_progress' | 'completed' | 'abandoned',
                        start_date: issue.start_date || null,
                        due_date: issue.due_date || null,
                        assignee: issue.assignee || 'Unassigned',
                        issue_key: issue.issue_key
                      }))}
                      loading={loading}
                      projectName={project?.title}
                    />
                  </div>
                )}

                {/* --- TAB CONTENT: AI INSIGHTS --- */}
                {activeTab === 'insights' && (
                  <div className="animate-in fade-in duration-300">
                    <AIInsights
                      tasks={localIssues.map(issue => ({
                        id: issue.id,
                        name: issue.summary,
                        status: issue.status || 'not_started',
                        start_date: issue.start_date || null,
                        due_date: issue.due_date || null,
                        estimated_hours: (issue.original_estimate_seconds || 0) / 3600,
                        actual_hours: (issue.time_spent_seconds || 0) / 3600,
                        assignee: issue.assignee || 'Unassigned',
                        issue_key: issue.issue_key
                      }))}
                      teamMembers={teamMembers.map(member => ({
                        name: member.name,
                        tasks_assigned: member.tasks_assigned,
                        tasks_completed: member.tasks_completed,
                        actual_hours: member.actual_hours,
                        status: member.status
                      }))}
                      loading={loading}
                      projectName={project?.title}
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* --- COMPLETION WARNING MODAL --- */}
      {showCompletionWarning && !isConfirmingCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCompletionWarning(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCompletionWarning(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors" disabled={isSaving}>
              <X className="w-5 h-5 text-[#78716C]" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="bg-[#FEE2E2] p-3 rounded-lg text-[#BE123C] flex-shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-[#1C1917]">Incomplete Tasks Remaining</h2>
                <p className="text-sm text-[#78716C] mt-2">
                  This project has <span className="font-semibold text-[#1C1917]">{incompleteTasks.length}</span> incomplete task{incompleteTasks.length !== 1 ? 's' : ''} that need attention before completion.
                </p>
              </div>
            </div>

            <div className="bg-[#FFF1F2] border border-pink-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-[#BE123C] mb-3">Incomplete Tasks List</p>
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {incompleteTasks.slice(0, 5).map((task, idx) => (
                  <li key={idx} className="text-xs text-[#78716C] flex gap-2 items-start">
                    <span className="flex-shrink-0 text-[#BE123C] mt-0.5">•</span>
                    <span className="flex-1">{task.summary || task.name || 'Unnamed task'}</span>
                  </li>
                ))}
                {incompleteTasks.length > 5 && (
                  <li className="text-xs text-[#BE123C] font-medium pt-2 border-t border-pink-200">
                    +{incompleteTasks.length - 5} more incomplete task{incompleteTasks.length - 5 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-[#F5F5F4] rounded-xl p-4 mb-6">
              <p className="text-xs text-[#78716C] mb-2">What would you like to do?</p>
              <ul className="text-xs text-[#78716C] space-y-1 list-disc list-inside">
                <li>Review and complete remaining tasks</li>
                <li>Or mark project complete anyway (not recommended)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <Button variant="outline" className="md:flex-1 h-12 rounded-xl" onClick={() => setShowCompletionWarning(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button className="md:flex-1 h-12 text-white bg-[#0F766E] hover:bg-[#0D635C] rounded-xl" onClick={() => { setShowCompletionWarning(false); setActiveTab('tasks'); }} disabled={isSaving}>
                View Tasks
              </Button>
              <Button 
                className="md:flex-1 h-12 text-white bg-[#BE123C] hover:bg-[#9D1A2F] rounded-xl disabled:opacity-50" 
                onClick={handleCompleteAnyway}
                disabled={isSaving}
              >
                Complete Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMPLETION CONFIRMATION MODAL --- */}
      {isConfirmingCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-[#FEE2E2] p-3 rounded-lg text-[#BE123C] flex-shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-light text-[#1C1917]">Confirm Project Completion?</h2>
                <p className="text-sm text-[#78716C] mt-2">
                  You're about to mark this project as complete with {incompleteTasks.length} incomplete task{incompleteTasks.length !== 1 ? 's' : ''}. This action is not easily reversible.
                </p>
              </div>
            </div>

            <div className="bg-[#FFF5F5] border border-pink-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-[#BE123C] mb-2">⚠️ Are you sure?</p>
              <p className="text-xs text-[#78716C]">
                Incomplete tasks won't be archived. Consider completing them first or removing them from the project.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl" 
                onClick={() => setIsConfirmingCompletion(false)} 
                disabled={isSaving}
              >
                Go Back
              </Button>
              <Button 
                className="w-full h-12 text-white bg-[#BE123C] hover:bg-[#9D1A2F] rounded-xl disabled:opacity-50" 
                onClick={handleConfirmCompletion}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Yes, Complete Project'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- ABANDON TASK CONFIRMATION MODAL --- */}
      {showAbandonConfirmation && taskToAbandon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-[#FEE2E2] p-3 rounded-lg text-[#BE123C] flex-shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-light text-[#1C1917]">Abandon Task?</h2>
                <p className="text-sm text-[#78716C] mt-2">
                  Mark "<span className="font-semibold">{taskToAbandon.summary}</span>" as abandoned. It will be excluded from completion metrics.
                </p>
              </div>
            </div>

            <div className="bg-[#FFF5F5] border border-pink-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-[#78716C]">
                Abandoned tasks are hidden by default but can be restored later. They won't affect project completion percentage.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl" 
                onClick={() => { setShowAbandonConfirmation(false); setTaskToAbandon(null); }} 
                disabled={updatingTask}
              >
                Cancel
              </Button>
              <Button 
                className="w-full h-12 text-white bg-[#BE123C] hover:bg-[#9D1A2F] rounded-xl disabled:opacity-50" 
                onClick={handleConfirmAbandon}
                disabled={updatingTask}
              >
                {updatingTask ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Abandoning...
                  </>
                ) : (
                  'Yes, Abandon Task'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW TASK MODAL --- */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isTaskSaving && setIsNewTaskModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsNewTaskModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors" disabled={isTaskSaving}>
              <X className="w-5 h-5 text-[#78716C]" />
            </button>
            <h2 className="text-2xl font-light text-[#1C1917] mb-6">Add Task</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#78716C] mb-1 font-medium">Task Name</label>
                <input type="text" value={newTaskForm.name} onChange={(e) => setNewTaskForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all" disabled={isTaskSaving} placeholder="Enter task name" />
              </div>

              <div>
                <label className="block text-sm text-[#78716C] mb-1 font-medium">Description</label>
                <textarea value={newTaskForm.description} onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all resize-none" disabled={isTaskSaving} placeholder="Enter task description" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">Est. Hours</label>
                  <input type="number" min="0" value={newTaskForm.estimated_hours} onChange={(e) => setNewTaskForm(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                </div>
                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">Assignee</label>
                  <select value={newTaskForm.assignee_id} onChange={(e) => setNewTaskForm(prev => ({ ...prev, assignee_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20" disabled={isTaskSaving}>
                    <option value="">Unassigned</option>
                    {localAllocatedMembers.map(member => (
                      <option key={member.user_id} value={member.user_id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#78716C] mb-1 font-medium">Due Date</label>
                <input type="date" value={newTaskForm.due_date} onChange={(e) => setNewTaskForm(prev => ({ ...prev, due_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
              </div>

              <div className="pt-6 flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsNewTaskModalOpen(false)} disabled={isTaskSaving}>Cancel</Button>
                <Button className="flex-1 h-12 text-white bg-[#0F766E] hover:bg-[#0D635C] rounded-xl" onClick={handleCreateTask} disabled={isTaskSaving}>
                  {isTaskSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isSaving && setIsEditModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors" disabled={isSaving}>
              <X className="w-5 h-5 text-[#78716C]" />
            </button>
            <h2 className="text-2xl font-light text-[#1C1917] mb-6">Edit Project</h2>
            {isFetchingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#78716C]"><Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0F766E]" /><p>Loading details...</p></div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-[#78716C] mb-2 font-medium">Project Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all" disabled={isSaving} />
                </div>
                <div>
                  <label className="block text-sm text-[#78716C] mb-2 font-medium">Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all resize-none" disabled={isSaving} />
                </div>
                <div>
                  <label className="block text-sm text-[#78716C] mb-2 font-medium">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20" disabled={isSaving}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</Button>
                  <Button className="flex-1 h-12 text-white bg-[#1C1917] hover:bg-[#292524] rounded-xl" onClick={handleUpdateProject} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TASK EDIT MODAL --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isTaskSaving && setIsTaskModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors" disabled={isTaskSaving}>
              <X className="w-5 h-5 text-[#78716C]" />
            </button>
            <h2 className="text-2xl font-light text-[#1C1917] mb-6">Edit Task</h2>
            
            {isTaskFetching ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#78716C]">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0F766E]" />
                <p>Loading task details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">Task Name</label>
                  <input type="text" value={taskForm.name} onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all" disabled={isTaskSaving} />
                </div>

                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">Description</label>
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all resize-none" disabled={isTaskSaving} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Status</label>
                    <select value={taskForm.status} onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20" disabled={isTaskSaving}>
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                      <option value="abandoned">Abandoned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Assignee</label>
                    <select value={taskForm.assignee_id} onChange={(e) => setTaskForm(prev => ({ ...prev, assignee_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20" disabled={isTaskSaving}>
                      <option value="">Unassigned</option>
                      {/* Pull from the Team we fetched in the hook! */}
                      {localAllocatedMembers.map(member => (
                        <option key={member.user_id} value={member.user_id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Est. Hours</label>
                    <input type="number" min="0" value={taskForm.estimated_hours} onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Start Date</label>
                    <input type="date" value={taskForm.start_date} onChange={(e) => setTaskForm(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#78716C] mb-1 font-medium">Due Date</label>
                    <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isTaskSaving} />
                  </div>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsTaskModalOpen(false)} disabled={isTaskSaving}>Cancel</Button>
                    <Button className="flex-1 h-12 text-white bg-[#0F766E] hover:bg-[#0D635C] rounded-xl" onClick={handleUpdateTask} disabled={isTaskSaving}>
                      {isTaskSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Update Task'}
                    </Button>
                  </div>
                  
                  {/* Abandon or Restore Task Button */}
                  {selectedTask && (
                    selectedTask.status?.toLowerCase() === 'abandoned' ? (
                      <Button 
                        variant="outline"
                        className="w-full h-12 rounded-xl text-[#0F766E] border-[#0F766E] hover:bg-[#F0FDFA]"
                        onClick={() => handleRestoreTask(selectedTask)}
                        disabled={isTaskSaving}
                      >
                        Restore Task
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="w-full h-12 rounded-xl text-[#BE123C] border-[#BE123C] hover:bg-[#FFF1F2]"
                        onClick={() => handleMarkAsAbandoned(selectedTask)}
                        disabled={isTaskSaving}
                      >
                        Mark as Abandoned
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD TEAM MEMBER MODAL --- */}
      {isAddTeamMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isAddingTeamMember && setIsAddTeamMemberModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddTeamMemberModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors" disabled={isAddingTeamMember}>
              <X className="w-5 h-5 text-[#78716C]" />
            </button>
            <h2 className="text-2xl font-light text-[#1C1917] mb-6">Add Team Member</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#78716C] mb-1 font-medium">Team Member *</label>
                <select value={addTeamMemberForm.user_id} onChange={(e) => setAddTeamMemberForm(prev => ({ ...prev, user_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] bg-white focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isAddingTeamMember || loadingOrgMembers}>
                  <option value="">{loadingOrgMembers ? 'Loading members...' : 'Select a member from organization'}</option>
                  {orgMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.email ? `(${member.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">Allocation %</label>
                  <input type="number" min="0" max="100" value={addTeamMemberForm.allocation_percentage} onChange={(e) => setAddTeamMemberForm(prev => ({ ...prev, allocation_percentage: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isAddingTeamMember} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">Start Date *</label>
                  <input type="date" value={addTeamMemberForm.start_date} onChange={(e) => setAddTeamMemberForm(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isAddingTeamMember} />
                </div>
                <div>
                  <label className="block text-sm text-[#78716C] mb-1 font-medium">End Date *</label>
                  <input type="date" value={addTeamMemberForm.end_date} onChange={(e) => setAddTeamMemberForm(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" disabled={isAddingTeamMember} />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsAddTeamMemberModalOpen(false)} disabled={isAddingTeamMember}>Cancel</Button>
                <Button className="flex-1 h-12 text-white bg-[#0F766E] hover:bg-[#0D635C] rounded-xl" onClick={handleAddTeamMember} disabled={isAddingTeamMember}>
                  {isAddingTeamMember ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add Member'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </VelocityAISidebar>
  );
}