import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { supabase } from '@/lib/supabase'; // Added for the update logic
import { toast } from 'sonner';
import {
  ArrowLeft, LayoutGrid, Users, CheckSquare,
  Clock, Lightbulb, AlertCircle, Sparkles, X, Loader2
} from 'lucide-react';

export default function ProjectAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'timeline' | 'insights'>('overview');

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'active' });

  // Use the realtime analytics hook
  const { loading, error, project, issues, metrics, teamMembers, allocatedTeamMembers } = useProjectAnalytics(id);

  // --- EDIT PROJECT LOGIC ---
  const openEditModal = async () => {
    if (!project) return;
    setIsEditModalOpen(true);
    setIsFetchingDetails(true);
    
    try {
      // Fetch the latest description and status since they aren't in the base hook's ProjectData
      const { data, error } = await supabase
        .from('projects')
        .select('description, status')
        .eq('id', project.id)
        .single();
        
      if (error) throw error;
      
      setEditForm({
        title: project.title || '',
        description: data?.description || '',
        status: data?.status || 'active'
      });
    } catch (err) {
      toast.error("Failed to load project details for editing.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!project) return;
    if (!editForm.title.trim()) return toast.error("Project title cannot be empty.");

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editForm.title,
          description: editForm.description,
          status: editForm.status
        })
        .eq('id', project.id);

      if (error) throw error;
      
      toast.success("Project updated successfully!");
      setIsEditModalOpen(false);
      
      // Reload to reflect changes in the UI (since the hook drives the main state)
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message || "Failed to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif] animate-in fade-in duration-300 relative">
        <div className="max-w-[1200px] mx-auto space-y-8">

          {/* Error State */}
          {error && (
            <div className="bg-white border border-red-200 rounded-[24px] p-6 text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Unable to Load Project</h3>
                  <p className="text-sm mt-1">{error}</p>
                  <button onClick={() => navigate('/projects')} className="text-sm font-medium mt-3 hover:underline">
                    Return to Projects →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show empty state while loading or if no project */}
          {!loading && !project && !error && (
            <div className="text-center py-12">
              <p className="text-[#78716C]">Project not found</p>
            </div>
          )}

          {/* Main Content - only show if project loaded */}
          {project && (() => {
            const startDate = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <>
                {/* Back Nav */}
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Projects
                </button>

                {/* Project Header Card */}
                <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${metrics.isAtRisk ? 'bg-[#FFF1F2] text-[#BE123C]' : 'bg-[#F0FDFA] text-[#0F766E]'}`}>
                      {metrics.isAtRisk ? 'At Risk' : 'On Track'}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-light text-[#1C1917] tracking-tight">
                      {project.title || project.key}
                    </h1>
                    <p className="text-sm text-[#78716C]">
                      {startDate} &rarr; Active · <span className="text-[#A8A29E]">{metrics.totalTasks} issues tracked</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-[#A8A29E] mb-2 uppercase tracking-wider">Health Score</p>
                      <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl font-light mx-auto ${metrics.isAtRisk ? 'border-pink-100 bg-pink-50 text-pink-500' : 'border-teal-100 bg-teal-50 text-teal-600'
                        }`}>
                        {metrics.healthScore}
                      </div>
                      <p className="text-xs text-[#A8A29E] mt-2">Feasibility {metrics.feasibility}%</p>
                    </div>
                    {/* WIRED UP THE EDIT BUTTON */}
                    <Button onClick={openEditModal} className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl px-6 py-6 h-auto font-light transition-all">
                      Edit Project
                    </Button>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-[#F5F5F4] rounded-xl w-fit border border-[#E7E5E4]">
                  {(() => {
                    const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
                      <button
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeTab === id
                          ? 'bg-white shadow-sm text-[#1C1917] font-medium border border-[#E7E5E4]'
                          : 'text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917]'
                          }`}
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

                    {/* 5-Column Stats Grid */}
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

                    {/* Charts Row */}
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
                            <div
                              className="h-full bg-[#1C1917] rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(metrics.completionPct, 100)}%` }}
                            />
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
                              <div
                                className="h-full bg-[#0F766E] rounded-full transition-all duration-1000"
                                style={{ width: `${metrics.totalEstHours > 0 ? Math.min((metrics.actualHours / metrics.totalEstHours) * 100, 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation Banner */}
                    <div className="bg-[#F0FDFA] border border-teal-100 rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#CCFBF1] p-3 rounded-xl text-[#0F766E]">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-[#0F766E] font-medium uppercase tracking-wider mb-1">AI Health Check</p>
                          <p className="text-[#1C1917] text-sm">
                            {metrics.actualHours > metrics.totalEstHours
                              ? 'Project is exceeding estimated hours. Immediate review of scope required.'
                              : 'Project is tracking within estimated time budget.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB CONTENT: TEAM --- */}
                {activeTab === 'team' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Allocated Team Members Section */}
                    {allocatedTeamMembers.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-light text-[#1C1917]">Allocated Team Members</h3>
                          <span className="text-xs font-medium bg-[#F0FDFA] text-[#0F766E] px-3 py-1 rounded-full border border-teal-100">
                            {allocatedTeamMembers.length} members
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {allocatedTeamMembers.map((member) => {
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
                                  <div className="pt-2 border-t border-[#F5F5F4] mt-2">
                                    <p className="text-xs text-[#78716C] mb-2">Allocation</p>
                                    <div className="w-full bg-[#E7E5E4] rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-full bg-[#0F766E] rounded-full"
                                        style={{ width: `${Math.min(member.allocation_percentage, 100)}%` }}
                                      />
                                    </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {teamMembers.map((member, i) => (
                            <div key={i} className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-[#F5F5F4] flex items-center justify-center text-[#1C1917] font-medium border border-[#E7E5E4]">
                                    {member.initials}
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#1C1917] text-lg">{member.name}</p>
                                    <p className="text-sm text-[#78716C]">{member.role}</p>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${member.status === 'Overloaded' ? 'bg-[#FFF1F2] text-[#BE123C] border-pink-100' :
                                  member.status === 'Underutilized' ? 'bg-[#FFF7ED] text-[#C2410C] border-orange-100' :
                                    'bg-[#F0FDFA] text-[#0F766E] border-teal-100'
                                  }`}>
                                  {member.status}
                                </span>
                              </div>

                              <div className="space-y-4 pt-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#78716C] font-light">Assigned</span>
                                  <span className="text-[#1C1917] font-medium">{member.tasks_assigned} tasks</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#78716C] font-light">Completed</span>
                                  <span className="text-[#0F766E] font-medium">{member.tasks_completed} tasks</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[#78716C] font-light">Hours</span>
                                  <span className="text-[#1C1917] font-medium">{member.actual_hours}h</span>
                                </div>

                                <div className="pt-2 border-t border-[#F5F5F4] mt-2">
                                  <div className="flex justify-between text-xs text-[#78716C] mb-2">
                                    <span>Utilization</span>
                                    <span>{member.utilization}%</span>
                                  </div>
                                  <div className="w-full bg-[#E7E5E4] rounded-full h-1.5 overflow-hidden">
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
                          ))}
                        </div>
                      </div>
                    )}

                    {allocatedTeamMembers.length === 0 && teamMembers.length === 0 && (
                      <div className="col-span-full text-center py-12 text-[#A8A29E] bg-white rounded-[24px] border border-[#E7E5E4] border-dashed">
                        No team members allocated or assigned to this project. Start by allocating team members or assigning tasks.
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB CONTENT: TASKS --- */}
                {activeTab === 'tasks' && (
                  <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm animate-in fade-in duration-300">
                    <div className="space-y-2">
                      {issues.map(issue => (
                        <div key={issue.id} className="flex justify-between items-center p-4 hover:bg-[#FAFAF9] rounded-xl border border-transparent hover:border-[#E7E5E4] transition-all">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-[#0F766E] bg-[#F0FDFA] px-2 py-1 rounded-md border border-teal-100">
                                {issue.issue_key}
                              </span>
                              <span className="text-[#1C1917] font-medium">{issue.summary}</span>
                            </div>
                            <p className="text-xs text-[#78716C] mt-2 pl-1">
                              {issue.issue_type} · Assigned to <span className="font-medium text-[#1C1917]">{issue.assignee || 'Unassigned'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded border ${['done', 'resolved', 'closed', 'complete'].some(s => issue.status?.toLowerCase().includes(s))
                              ? 'bg-[#F0FDFA] text-[#0F766E] border-teal-100'
                              : 'bg-[#FFF7ED] text-[#C2410C] border-orange-100'
                              }`}>
                              {issue.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {issues.length === 0 && <p className="text-center text-[#A8A29E] py-8">No issues found.</p>}
                    </div>
                  </div>
                )}

                {/* --- TAB CONTENT: PLACEHOLDER --- */}
                {(activeTab === 'timeline' || activeTab === 'insights') && (
                  <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-24 text-center shadow-sm">
                    <p className="text-[#78716C]">Advanced module coming soon</p>
                  </div>
                )}
              </>
            );
          })()}

        </div>
      </div>

      {/* --- EDIT PROJECT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isSaving && setIsEditModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F4] transition-colors"
              disabled={isSaving}
            >
              <X className="w-5 h-5 text-[#78716C]" />
            </button>

            <h2 className="text-2xl font-light text-[#1C1917] mb-6">Edit Project</h2>

            {isFetchingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#78716C]">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0F766E]" />
                <p>Loading project details...</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-[#78716C] mb-2 font-medium">Project Title</label>
                  <input 
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
                    placeholder="Enter project title"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#78716C] mb-2 font-medium">Description</label>
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all resize-none"
                    placeholder="Enter project description"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#78716C] mb-2 font-medium">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7E5E4] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all bg-white"
                    disabled={isSaving}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl" 
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 h-12 text-white bg-[#1C1917] hover:bg-[#292524] rounded-xl"
                    onClick={handleUpdateProject}
                    disabled={isSaving}
                  >
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </VelocityAISidebar>
  );
}