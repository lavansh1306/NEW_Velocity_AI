import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProjects, type ProjectItem } from '@/lib/dataService';
import { fetchIssuesHybrid } from '@/lib/jiraDbClient';
import { calculateProjectHealthScore } from '@/lib/metrics';

interface TeamMember {
  name: string;
  role: string;
  utilization: number;
  status: 'Healthy' | 'Overloaded' | 'Underutilized';
  taskCount: number;
  allocatedHours: number;
}

export default function ProjectAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        // Load project
        const projects = await loadProjects();
        const targetProject = projects.find(p => p.id === decodeURIComponent(id));
        
        if (!targetProject) {
          setProject(null);
          setLoading(false);
          return;
        }

        setProject(targetProject);

        // Fetch JIRA issues for this project
        const { issues: rawIssues } = await fetchIssuesHybrid(targetProject.id);
        setIssues(rawIssues as any[]);

        // Calculate health score
        const startDates = rawIssues
          .filter((i: any) => i.created)
          .map((i: any) => new Date(i.created).getTime());
        const endDates = rawIssues
          .filter((i: any) => i.due)
          .map((i: any) => new Date(i.due).getTime());
        
        const projectStart = startDates.length > 0 ? new Date(Math.min(...startDates)) : new Date(2026, 0, 1);
        const projectEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : new Date(2026, 2, 31);

        const score = calculateProjectHealthScore({
          issues: rawIssues,
          startDate: projectStart,
          endDate: projectEnd,
        });
        setHealthScore(score);

        // Calculate team allocation
        const teamMap = new Map<string, { count: number; hours: number }>();
        rawIssues.forEach((issue: any) => {
          if (issue.assignee && issue.assignee !== 'Unassigned') {
            const current = teamMap.get(issue.assignee) || { count: 0, hours: 0 };
            const hours = issue.duration ? parseInt(issue.duration, 10) : 8;
            teamMap.set(issue.assignee, {
              count: current.count + 1,
              hours: current.hours + (isNaN(hours) ? 8 : hours),
            });
          }
        });

        // Build team member list with utilization
        const members: TeamMember[] = Array.from(teamMap.entries()).map(([name, data]) => {
          const utilization = Math.round((data.hours / 40) * 100);
          let status: 'Healthy' | 'Overloaded' | 'Underutilized';
          if (utilization > 110) status = 'Overloaded';
          else if (utilization < 50) status = 'Underutilized';
          else status = 'Healthy';

          return {
            name,
            role: 'Developer', // Default role
            utilization,
            status,
            taskCount: data.count,
            allocatedHours: data.hours,
          };
        });

        setTeamMembers(members.sort((a, b) => b.allocatedHours - a.allocatedHours));
      } catch (error) {
        console.error('Error loading project analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleReturn = () => {
    const returnPage = localStorage.getItem('returnPage') || '/projects';
    localStorage.removeItem('returnPage');
    navigate(returnPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-light">Loading project analytics...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-12">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleReturn}
            variant="outline"
            className="gap-2 mb-6 font-light rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Projects
          </Button>
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <p className="text-gray-500 font-light">Project not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics from issues
  const completedCount = issues.filter((i: any) =>
    i.status?.toLowerCase?.()?.includes('done') ||
    i.status?.toLowerCase?.()?.includes('completed') ||
    i.status?.toLowerCase?.()?.includes('closed')
  ).length;
  const totalIssues = issues.length;
  const completionPercent = totalIssues > 0 ? Math.round((completedCount / totalIssues) * 100) : 0;
  
  // Calculate hours
  const totalEstHours = issues.reduce((sum: number, i: any) => {
    const hours = i.duration ? parseInt(i.duration, 10) : 8;
    return sum + (isNaN(hours) ? 8 : hours);
  }, 0);
  
  const actualHours = issues.filter((i: any) =>
    i.status?.toLowerCase?.()?.includes('done') ||
    i.status?.toLowerCase?.()?.includes('completed')
  ).reduce((sum: number, i: any) => {
    const hours = i.duration ? parseInt(i.duration, 10) : 8;
    return sum + (isNaN(hours) ? 8 : hours);
  }, 0);
  
  const remainingHours = totalEstHours - actualHours;

  // Get project dates
  const startDates = issues
    .filter((i: any) => i.created)
    .map((i: any) => new Date(i.created));
  const endDates = issues
    .filter((i: any) => i.due)
    .map((i: any) => new Date(i.due));
  
  const startDate = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date(2026, 0, 15);
  const endDate = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date(2026, 2, 30);
  
  const daysRemaining = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine status based on health score
  const getStatusBadge = (score: number) => {
    if (score >= 80) return { text: 'On Track', bg: 'bg-emerald-50', textColor: 'text-emerald-700' };
    if (score >= 60) return { text: 'At Risk', bg: 'bg-amber-50', textColor: 'text-amber-700' };
    return { text: 'Critical', bg: 'bg-red-50', textColor: 'text-red-700' };
  };

  const statusBadge = getStatusBadge(healthScore);
  const feasibility = Math.min(100, Math.round(healthScore + completionPercent) / 2);

  return (
    <div className="min-h-screen bg-gray-50 p-12">
      <div className="max-w-7xl mx-auto">
        {/* Return Button */}
        <Button
          onClick={handleReturn}
          variant="outline"
          className="gap-2 mb-8 font-light rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Projects
        </Button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.textColor}`}>
                {statusBadge.text}
              </div>
              <div>
                <h1 className="text-3xl font-light text-gray-900">{project.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 font-light">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} → {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span>· {daysRemaining} days remaining</span>
                </div>
              </div>
            </div>
            <Button className="rounded-xl font-light">Edit Project</Button>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 font-light uppercase tracking-wider mb-2">Health Score</p>
              <p className="text-4xl font-light text-gray-900">{healthScore}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-light uppercase tracking-wider mb-2">Feasibility</p>
              <p className="text-4xl font-light text-blue-600">{feasibility}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-light uppercase tracking-wider mb-2">Team Size</p>
              <p className="text-4xl font-light text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        {/* Hours & Completion Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Hours Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-light text-gray-900 mb-6">Hours Summary</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-light text-gray-600">Total Est. Hours</p>
                  <p className="text-2xl font-light text-gray-900">{totalEstHours}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-light text-gray-600">Actual Hours</p>
                  <p className="text-2xl font-light text-emerald-600">{actualHours}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-light text-gray-600">Remaining</p>
                  <p className="text-2xl font-light text-blue-600">{remainingHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Completion & Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-light text-gray-900 mb-6">Progress</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-light text-gray-600">Completion</p>
                  <p className="text-2xl font-light text-gray-900">{completionPercent}%</p>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-600 font-light">{completedCount} of {totalIssues} tasks completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Allocation Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-light text-gray-900 mb-6">Team Allocation</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-light text-gray-500 uppercase tracking-wider">Team Member</th>
                  <th className="text-left py-3 px-4 text-xs font-light text-gray-500 uppercase tracking-wider">Tasks</th>
                  <th className="text-left py-3 px-4 text-xs font-light text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="text-left py-3 px-4 text-xs font-light text-gray-500 uppercase tracking-wider">Utilization</th>
                  <th className="text-left py-3 px-4 text-xs font-light text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, idx) => {
                  const statusColors = {
                    Healthy: 'bg-emerald-50 text-emerald-700',
                    Overloaded: 'bg-red-50 text-red-700',
                    Underutilized: 'bg-amber-50 text-amber-700',
                  };

                  const utilizationColor = member.utilization > 110 ? 'text-red-600' :
                                           member.utilization < 50 ? 'text-amber-600' : 'text-emerald-600';

                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-light text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500 font-light">Developer</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-light text-gray-700">{member.taskCount}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-light text-gray-700">{member.allocatedHours}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className={`font-light ${utilizationColor}`}>{member.utilization}%</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-light ${statusColors[member.status]}`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
