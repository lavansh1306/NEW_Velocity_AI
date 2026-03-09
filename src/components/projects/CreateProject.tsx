import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, ChevronDown, Check, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentOrgId } from '@/lib/orgContext';

interface TeamMemberDisplay {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatar_url?: string;
}


function deriveProjectKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  let key = '';
  if (words.length === 1) {
    // Take up to 5 chars of the single word
    key = words[0].substring(0, 5).toUpperCase();
  } else {
    // Take first letter of each word, up to 5 chars
    key = words
      .map(w => w[0])
      .join('')
      .substring(0, 5)
      .toUpperCase();
  }
  // Strip non-alphanumeric characters
  return key.replace(/[^A-Z0-9]/g, '');
}

/** Validate project key: 1–5 uppercase alphanumeric chars */
function isValidProjectKey(key: string): boolean {
  return /^[A-Z0-9]{1,5}$/.test(key);
}

/**
 * Generate a unique-enough sequential issue key for manually created tasks.
 * Uses a timestamp base-36 suffix to minimise collisions.
 */
function generateIssueKey(projectKey: string, index: number): string {
  const suffix = (Date.now() + index).toString(36).toUpperCase().slice(-5);
  return `${projectKey}-${suffix}`;
}

/** Format a Date as YYYY-MM-DD (text field in jira_issues) */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, orgId: contextOrgId } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  // Track whether user has manually overridden the auto-generated key
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [projectType, setProjectType] = useState('Scrum Software Development');
  const [projectLead, setProjectLead] = useState('');
  const [description, setDescription] = useState('');

  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Database Setup', assignee: 'Unassigned', hours: '0', timeline: 'Week 1' },
  ]);

  // --- Fetch org members ---
  const fetchMembers = useCallback(async () => {
    try {
      // Get live session — avoids React state race condition
      const { data: { user: liveUser } } = await supabase.auth.getUser();
      if (!liveUser) {
        setIsLoadingMembers(false);
        return;
      }

      // ── Org ID resolution (4 tiers) ──────────────────────────────────────
      // Tier 1: AuthContext state (resolved from organization_members on login)
      let orgId: string | null = contextOrgId || getCurrentOrgId();

      // Tier 2: public.users email lookup
      if (!orgId && liveUser.email) {
        const { data: byEmail } = await supabase
          .from('users')
          .select('organization_id')
          .eq('email', liveUser.email)
          .maybeSingle();
        orgId = byEmail?.organization_id ?? null;
      }

      // Tier 3: organization_members lookup via auth UID
      if (!orgId) {
        const { data: byMembership } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', liveUser.id)
          .maybeSingle();
        orgId = byMembership?.org_id ?? null;
      }

      // Tier 4: graceful degradation — show current user as solo member
      if (!orgId) {
        console.warn('[CreateProject] Could not resolve org ID — showing current user as fallback.');
        const fallbackName = liveUser.email?.split('@')[0] || 'Me';
        const fallback: TeamMemberDisplay = {
          id: liveUser.id,
          name: fallbackName,
          role: 'Owner',
          initials: fallbackName.substring(0, 2).toUpperCase(),
          avatar_url: undefined,
        };
        setTeamMembers([fallback]);
        setSelectedMembers([fallback.id]);
        setProjectLead(fallback.name);
        setIsLoadingMembers(false);
        return;
      }

      // ── Fetch users in the org ───────────────────────────────────────────
      // Note: no server-side is_active filter — rows with is_active=null would
      // be excluded by .eq('is_active', true). Filter client-side instead.
      const { data: orgUsers, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url, is_active')
        .eq('organization_id', orgId);

      if (error) throw error;

      // Exclude only explicitly deactivated users (is_active = false)
      const activeUsers = (orgUsers || []).filter((u: any) => u.is_active !== false);

      let formattedMembers: TeamMemberDisplay[] = activeUsers.map((u: any) => {
        const displayName = u.name || u.email?.split('@')[0] || 'Unknown';
        return {
          id: u.id,
          name: displayName,
          role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Member',
          initials: displayName
            .trim()
            .split(' ')
            .map((p: string) => p[0]?.toUpperCase() ?? '')
            .slice(0, 2)
            .join(''),
          avatar_url: u.avatar_url,
        };
      });

      // Fallback: show the logged-in user themselves if org has no users yet
      if (formattedMembers.length === 0) {
        const fallbackName = liveUser.email?.split('@')[0] || 'Me';
        formattedMembers.push({
          id: liveUser.id,
          name: fallbackName,
          role: 'Owner',
          initials: fallbackName.substring(0, 2).toUpperCase(),
          avatar_url: undefined,
        });
      }

      setTeamMembers(formattedMembers);
      if (formattedMembers.length > 0) {
        setSelectedMembers([formattedMembers[0].id]);
        setProjectLead(formattedMembers[0].name);
      }
    } catch (err) {
      console.error('[CreateProject] Error fetching members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [contextOrgId]);

  // Re-runs when contextOrgId populates (auth resolves asynchronously after mount)
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);


  // --- Auto-generate project key from name (unless user has manually edited it) ---
  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProjectName(name);
    if (!keyManuallyEdited) {
      setProjectKey(deriveProjectKey(name));
    }
  };

  const handleProjectKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setProjectKey(raw);
    setKeyManuallyEdited(true); // User has taken ownership of the key
  };

  // --- Task handlers ---
  const handleAddTask = () =>
    setTasks(prev => [
      ...prev,
      { id: Date.now(), name: '', assignee: 'Unassigned', hours: '0', timeline: '' },
    ]);

  const handleDeleteTask = (id: number) => {
    if (tasks.length > 1) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleTaskChange = (id: number, field: string, value: string) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));

  const toggleMember = (id: string) =>
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );

  // --- Submission ---
  const handleCreateProject = async () => {
  // Ensure we have a name and a key before proceeding
  if (!projectName.trim() || !projectKey.trim()) return;

  setIsSubmitting(true);
  try {
    // 1. Resolve Organization ID
    const orgId = contextOrgId || getCurrentOrgId();
    if (!orgId) throw new Error("Organization ID not found.");

    // 2. Get or create default team for project assignment
    let teamId: string | null = null;
    const { data: teams } = await supabase
      .from('teams')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1);
    
    if (teams && teams.length > 0) {
      teamId = teams[0].id;
    } else {
      // Create default team if none exists
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          organization_id: orgId,
          name: `${projectName} Team`,
          description: `Default team for ${projectName} project`
        })
        .select('id')
        .single();
      
      if (teamError) throw teamError;
      teamId = newTeam?.id;
    }

    // 3. Insert into projects table (internal project tracking)
    const { data: newInternalProject, error: internalProjectError } = await supabase
      .from('projects')
      .insert([
        {
          organization_id: orgId,
          team_id: teamId,
          name: projectName,
          description: description || null,
          source: 'internal',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
        }
      ])
      .select('id')
      .single();

    if (internalProjectError) throw internalProjectError;
    if (!newInternalProject) throw new Error('Failed to create internal project record');

    const projectId = newInternalProject.id;

    // 4. Insert into jira_projects (Jira tracking)
    const { data: newProject, error: projectError } = await supabase
      .from('jira_projects')
      .insert([
        {
          organization_id: orgId,
          project_key: projectKey.toUpperCase(),
          name: projectName,
          description: description || '', 
          cloud_id: 'local-sync',
          created_at: new Date().toISOString(),
        }
      ])
      .select('id')
      .single();

    if (projectError) throw projectError;

    // 5. Create tasks and task assignments from initial plan
    if (tasks && tasks.length > 0) {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        // Insert task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert([
            {
              project_id: projectId,
              name: task.name || `Task ${i + 1}`,
              description: null,
              estimated_hours: task.hours ? parseFloat(task.hours) : 0,
              actual_hours: 0,
              start_date: new Date().toISOString().split('T')[0],
              due_date: null,
              status: 'not_started',
            }
          ])
          .select('id')
          .single();

        if (taskError) {
          console.error(`Error creating task "${task.name}":`, taskError);
          continue;
        }

        // If task has an assignee (team member), create assignment
        if (newTask && task.assignee !== 'Unassigned') {
          const assignedMember = teamMembers.find(m => m.name === task.assignee);
          if (assignedMember) {
            const { error: assignError } = await supabase
              .from('task_assignments')
              .insert([
                {
                  task_id: newTask.id,
                  user_id: assignedMember.id,
                  allocated_hours_per_week: task.hours ? parseFloat(task.hours) / 4 : 0, // Assume 1 month = 4 weeks
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: null,
                  is_confirmed: true,
                }
              ]);

            if (assignError) {
              console.warn(`Error assigning task to ${task.assignee}:`, assignError);
            }
          }
        }
      }
    }

    // 6. If specific team members were selected, create task_assignments for them on first task
    if (selectedMembers.length > 0 && tasks.length > 0) {
      const { data: firstTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (firstTask) {
        for (const memberId of selectedMembers) {
          // Check if already assigned
          const { data: existing } = await supabase
            .from('task_assignments')
            .select('id')
            .eq('task_id', firstTask.id)
            .eq('user_id', memberId)
            .maybeSingle();

          if (!existing) {
            const { error: assignError } = await supabase
              .from('task_assignments')
              .insert([
                {
                  task_id: firstTask.id,
                  user_id: memberId,
                  allocated_hours_per_week: 10,
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: null,
                  is_confirmed: false, // Pending confirmation
                }
              ]);

            if (assignError) {
              console.warn(`Error assigning member to task:`, assignError);
            }
          }
        }
      }
    }

    // 7. Track project lead
    if (projectLead && selectedMembers.length > 0) {
      const leadMember = teamMembers.find(m => m.name === projectLead);
      if (leadMember) {
        console.log(`[CreateProject] Project lead set to: ${projectLead}`, leadMember);
      }
    }

    toast({
      title: "Success",
      description: `Project "${projectName}" created with ${selectedMembers.length} team members.`,
    });

    navigate(`/projects`);

  } catch (error: any) {
    console.error("Creation Error:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to create project",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1400px] mx-auto">

          {/* Back navigation */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-[#E7E5E4] rounded-full transition-colors text-[#78716C]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">Create New Project</h1>
          </div>

          <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

              {/* ---- LEFT: Project details ---- */}
              <div className="lg:col-span-2 space-y-6">

                {/* Name + Key row */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-3 space-y-2">
                    <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={handleProjectNameChange}
                      placeholder="e.g. Mobile App Redesign"
                      className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] placeholder:text-[#A8A29E] transition-all"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                      Key *
                    </label>
                    <input
                      type="text"
                      value={projectKey}
                      onChange={handleProjectKeyChange}
                      placeholder="MOB"
                      maxLength={5}
                      // FIX: Visual feedback for invalid key
                      className={`w-full h-11 px-4 bg-[#FAFAF9] border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] transition-all ${projectKey && !isValidProjectKey(projectKey)
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-[#E7E5E4]'
                        }`}
                    />
                    {projectKey && !isValidProjectKey(projectKey) && (
                      <p className="text-xs text-rose-500 mt-1">
                        1–5 uppercase letters/numbers only
                      </p>
                    )}
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Type</label>
                  <div className="relative">
                    <select
                      value={projectType}
                      onChange={e => setProjectType(e.target.value)}
                      className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] transition-all cursor-pointer"
                    >
                      <option>Scrum Software Development</option>
                      <option>Kanban</option>
                      <option>Task Tracking</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C] pointer-events-none" />
                  </div>
                </div>

                {/* Project Lead */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Lead</label>
                  <div className="relative">
                    <select
                      value={projectLead}
                      onChange={e => setProjectLead(e.target.value)}
                      className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#78716C] transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select a lead</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C] pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the project goals and objectives..."
                    className="w-full h-32 px-4 py-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] placeholder:text-[#A8A29E] resize-none transition-all"
                  />
                </div>
              </div>

              {/* ---- RIGHT: Team member selection ---- */}
              <div className="lg:col-span-1 border-l border-[#E7E5E4] lg:pl-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-medium text-[#1C1917]">Add Team Members</h3>
                  <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-1 rounded-md">
                    {selectedMembers.length} selected
                  </span>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                  {isLoadingMembers ? (
                    <div className="text-center py-8 text-[#A8A29E] text-sm">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading team...
                    </div>
                  ) : (
                    teamMembers.map(member => {
                      const isSelected = selectedMembers.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                            ? 'bg-[#FAFAF9] border-[#1C1917] shadow-sm'
                            : 'bg-white border-transparent hover:bg-[#FAFAF9]'
                            }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-medium shadow-sm transition-colors ${isSelected
                              ? 'bg-white border-[#E7E5E4] text-[#1C1917]'
                              : 'bg-[#F5F5F4] border-transparent text-[#78716C]'
                              }`}
                          >
                            {member.initials}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isSelected ? 'text-[#1C1917]' : 'text-[#78716C]'}`}>
                              {member.name}
                            </p>
                            <p className="text-xs text-[#A8A29E]">{member.role}</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-[#1C1917] rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ---- Initial tasks table ---- */}
            <div className="mt-16 pt-8 border-t border-[#E7E5E4]">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#1C1917]">Initial Project Plan</h3>
                  <p className="text-xs text-[#A8A29E] mt-1">
                    These tasks will be created as Jira issues under your new project.
                  </p>
                </div>
                <Button
                  onClick={handleAddTask}
                  variant="outline"
                  className="bg-white border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF9] h-9 text-xs rounded-lg gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </Button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">
                <div className="col-span-5">Task Name</div>
                <div className="col-span-3">Assignee</div>
                <div className="col-span-2">Est. Hours</div>
                <div className="col-span-2">Timeline</div>
              </div>

              <div className="bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] overflow-hidden">
                <div className="divide-y divide-[#E7E5E4]">
                  {tasks.map(task => (
                    <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-3 bg-white items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={task.name}
                          onChange={e => handleTaskChange(task.id, 'name', e.target.value)}
                          placeholder="Task name"
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917] placeholder:text-[#A8A29E]"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={task.assignee}
                          onChange={e => handleTaskChange(task.id, 'assignee', e.target.value)}
                          className="w-full text-sm bg-transparent focus:outline-none text-[#78716C]"
                        >
                          <option value="Unassigned">Unassigned</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={task.hours}
                          onChange={e => handleTaskChange(task.id, 'hours', e.target.value)}
                          placeholder="0"
                          className="w-20 text-sm bg-transparent focus:outline-none text-[#1C1917]"
                        />
                      </div>
                      <div className="col-span-2 flex justify-between items-center">
                        <input
                          type="text"
                          value={task.timeline}
                          onChange={e => handleTaskChange(task.id, 'timeline', e.target.value)}
                          placeholder="Week 1"
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917] placeholder:text-[#A8A29E]"
                        />
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={tasks.length <= 1}
                          className="text-rose-400 hover:text-rose-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors ml-2"
                          title="Remove task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit row */}
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => navigate('/projects')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isSubmitting || !projectName.trim() || !isValidProjectKey(projectKey)}
                className="bg-[#1C1917] text-white px-8 rounded-xl h-11 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}