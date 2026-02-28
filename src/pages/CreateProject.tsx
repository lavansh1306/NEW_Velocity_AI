import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, ChevronDown, Check, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TeamMemberDisplay {
  id: string;
  name: string;
  role: string;
  availability: string;
  initials: string;
  avatar_url?: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [projectType, setProjectType] = useState('Scrum Software Development');
  const [projectLead, setProjectLead] = useState('');
  const [description, setDescription] = useState('');
  
  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Database Setup', assignee: 'Unassigned', hours: '0', timeline: 'Week 1' }
  ]);

  // Fetch Members (Schema compliant: uses organization_id)
  useEffect(() => {
    const fetchMembers = async () => {
      // 1. Get the real Org ID from the logged-in user profile
      if (!user) return;

      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        const orgId = userProfile?.organization_id;
        
        if (!orgId) return;

        const { data: users, error } = await supabase
          .from('users')
          .select('id, name, email, role, skills, avatar_url')
          .eq('organization_id', orgId);

        if (error) throw error;

        let formattedMembers: TeamMemberDisplay[] = [];

        if (users && users.length > 0) {
          formattedMembers = users.map((u: any) => ({
            id: u.id,
            name: u.name || u.email?.split('@')[0] || 'Unknown',
            role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Member',
            availability: '100%',
            initials: (u.name || u.email || '??').substring(0, 2).toUpperCase(),
            avatar_url: u.avatar_url
          }));
        } 
        
        // Fallback for solo users
        if (formattedMembers.length === 0 && user) {
           formattedMembers.push({
             id: user.id,
             name: user.email?.split('@')[0] || 'Me',
             role: 'Owner',
             availability: '100%',
             initials: 'ME',
             avatar_url: undefined
           });
        }

        setTeamMembers(formattedMembers);
        if (formattedMembers.length > 0) {
          setSelectedMembers([formattedMembers[0].id]);
          setProjectLead(formattedMembers[0].name);
        }

      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [user]);

  // Handlers
  const handleAddTask = () => setTasks([...tasks, { id: Date.now(), name: '', assignee: '', hours: '', timeline: '' }]);
  const handleDeleteTask = (id: number) => { if (tasks.length > 1) setTasks(tasks.filter(t => t.id !== id)); };
  const handleTaskChange = (id: number, field: string, value: string) => setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  const toggleMember = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectKey.trim()) {
      toast({ title: "Validation Error", description: "Project Name and Key are required.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Auth Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get accurate Org ID
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const orgId = userProfile?.organization_id;
      if (!orgId) throw new Error("No Organization linked to your account.");

      // 2. Fetch Cloud ID (required by schema)
      const { data: connectionData } = await supabase
        .from('jira_connections')
        .select('cloud_id')
        .eq('org_id', orgId)
        .limit(1)
        .single();

      const cloudId = connectionData?.cloud_id || `local-${orgId}`;

      // 3. Insert Project (FIXED: Removing lead_name, mapping category)
      const { data: projectData, error: projectError } = await supabase
        .from('jira_projects')
        .insert({
          org_id: orgId,
          cloud_id: cloudId,
          jira_project_id: `local-${Date.now()}`, // Placeholder required by schema
          key: projectKey.toUpperCase(),
          title: projectName,
          category: projectType, // Mapped to 'category' column
          description: description || '',
          // lead_name: REMOVED (Not in schema)
          created_at: new Date().toISOString()
        })
        .select('id, key')
        .single();

      if (projectError) {
        if (projectError.code === '23505') throw new Error(`Project key "${projectKey}" already exists.`);
        throw projectError;
      }

      // 4. Insert Tasks
      const validTasks = tasks.filter(t => t.name.trim() !== '');
      if (validTasks.length > 0) {
        const issuesPayload = validTasks.map(t => ({
          org_id: orgId,
          cloud_id: cloudId,
          project_key: projectData.key,
          summary: t.name,
          issue_key: `${projectData.key}-${Math.floor(Math.random() * 10000)}`,
          assignee: t.assignee !== 'Unassigned' ? t.assignee : 'Unassigned',
          status: 'To Do',
          issue_type: 'Task',
          original_estimate_seconds: (parseInt(t.hours) || 0) * 3600,
          created_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }));

        const { error: tasksError } = await supabase.from('jira_issues').insert(issuesPayload);
        if (tasksError) throw tasksError;
      }

      toast({ title: "Success!", description: `Project "${projectName}" created successfully.` });
      navigate('/projects');

    } catch (error: any) {
      console.error('Create Project Error:', error);
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/projects')} className="p-2 hover:bg-[#E7E5E4] rounded-full transition-colors text-[#78716C]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">Create New Project</h1>
          </div>

          <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-3 space-y-2">
                    <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Name *</label>
                    <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Mobile App Redesign" className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] placeholder:text-[#A8A29E] transition-all" />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Key *</label>
                    <input type="text" value={projectKey} onChange={(e) => setProjectKey(e.target.value.toUpperCase())} placeholder="MOB" maxLength={5} className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Type</label>
                  <div className="relative">
                    <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] transition-all cursor-pointer">
                      <option>Scrum Software Development</option>
                      <option>Kanban</option>
                      <option>Task Tracking</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Lead</label>
                  <div className="relative">
                    <select value={projectLead} onChange={(e) => setProjectLead(e.target.value)} className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#78716C] transition-all cursor-pointer">
                      <option value="" disabled>Select a lead</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project goals and objectives..." className="w-full h-32 px-4 py-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] placeholder:text-[#A8A29E] resize-none transition-all" />
                </div>
              </div>

              <div className="lg:col-span-1 border-l border-[#E7E5E4] lg:pl-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-medium text-[#1C1917]">Add Team Members</h3>
                  <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-1 rounded-md">{selectedMembers.length} selected</span>
                </div>
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingMembers ? <div className="text-center py-8 text-[#A8A29E] text-sm"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading team...</div> : 
                   teamMembers.map(member => {
                      const isSelected = selectedMembers.includes(member.id);
                      return (
                        <div key={member.id} onClick={() => toggleMember(member.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[#FAFAF9] border-[#1C1917] shadow-sm' : 'bg-white border-transparent hover:bg-[#FAFAF9]'}`}>
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-medium shadow-sm transition-colors ${isSelected ? 'bg-white border-[#E7E5E4] text-[#1C1917]' : 'bg-[#F5F5F4] border-transparent text-[#78716C]'}`}>{member.initials}</div>
                          <div className="flex-1"><p className={`text-sm font-medium ${isSelected ? 'text-[#1C1917]' : 'text-[#78716C]'}`}>{member.name}</p><p className="text-xs text-[#A8A29E]">{member.role}</p></div>
                          {isSelected && <div className="w-5 h-5 bg-[#1C1917] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        </div>
                      );
                   })
                  }
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-[#E7E5E4]">
              <div className="flex justify-between items-end mb-6">
                <div><h3 className="text-lg font-medium text-[#1C1917]">Initial Project Plan</h3></div>
                <Button onClick={handleAddTask} variant="outline" className="bg-white border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF9] h-9 text-xs rounded-lg gap-2"><Plus className="w-3.5 h-3.5" /> Add Task</Button>
              </div>
              <div className="bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] overflow-hidden">
                <div className="divide-y divide-[#E7E5E4]">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-3 bg-white items-center">
                      <div className="col-span-5"><input type="text" value={task.name} onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)} placeholder="Task name" className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917]" /></div>
                      <div className="col-span-3"><select value={task.assignee} onChange={(e) => handleTaskChange(task.id, 'assignee', e.target.value)} className="w-full text-sm bg-transparent focus:outline-none text-[#78716C]"><option>Unassigned</option>{teamMembers.map(m => <option key={m.id}>{m.name}</option>)}</select></div>
                      <div className="col-span-2"><input type="number" value={task.hours} onChange={(e) => handleTaskChange(task.id, 'hours', e.target.value)} placeholder="0" className="w-20 text-sm bg-transparent focus:outline-none text-[#1C1917]" /></div>
                      <div className="col-span-2 flex justify-between"><input type="text" value={task.timeline} onChange={(e) => handleTaskChange(task.id, 'timeline', e.target.value)} className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917]" /> <button onClick={() => handleDeleteTask(task.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => navigate('/projects')}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={isSubmitting} className="bg-[#1C1917] text-white px-8 rounded-xl h-11">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}</Button>
            </div>
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}