import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DASHBOARD_STYLES } from './styles';
import { fetchProjectsHybrid, fetchAllIssuesHybrid } from '@/lib/jiraDbClient';

interface ProjectDeadline {
  projectKey: string;
  projectName: string;
  dueDate: Date | null;
  daysRemaining: number;
  status: 'at-risk' | 'active' | 'upcoming';
}

interface TeamMember {
  name: string;
  email: string;
  assignments: Array<{
    name: string;
    startDate: Date;
    dueDate: Date;
    status: 'onTrack' | 'atRisk' | 'available';
    color: string;
  }>;
}

export const MainDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [projectDeadlines, setProjectDeadlines] = useState<ProjectDeadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [teamCapacity, setTeamCapacity] = useState<TeamMember[]>([]);
  const [capacityPopup, setCapacityPopup] = useState<any>(null);

  // Fetch and calculate all dashboard data from Jira/DB
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const { projects } = await fetchProjectsHybrid();
        const { issues } = await fetchAllIssuesHybrid();

        // Group issues by project
        const issuesByProject = new Map<string, any[]>();
        const issuesByAssignee = new Map<string, any[]>();
        
        issues.forEach(issue => {
          const projectKey = issue.project_key || 'unknown';
          if (!issuesByProject.has(projectKey)) {
            issuesByProject.set(projectKey, []);
          }
          issuesByProject.get(projectKey)!.push(issue);

          // Group by assignee
          const assignee = issue.assignee || 'Unassigned';
          if (!issuesByAssignee.has(assignee)) {
            issuesByAssignee.set(assignee, []);
          }
          issuesByAssignee.get(assignee)!.push(issue);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate metrics
        const activeProjectsSet = new Set<string>();
        const projectsAtRiskSet = new Set<string>();
        let totalCapacity = 0;
        let usedCapacity = 0;
        let totalAssignees = 0;
        let completedHours = 0;
        let totalHours = 0;

        // Helper to count business days
        const countBusinessDays = (startDate: Date, endDate: Date): number => {
          let count = 0;
          const current = new Date(startDate);
          current.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          
          while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              count++;
            }
            current.setDate(current.getDate() + 1);
          }
          return count;
        };

        // Process issues for metrics
        const uniqueAssignees = new Set<string>();
        
        issues.forEach((issue: any) => {
          const issueDueDate = issue.due ? new Date(issue.due) : null;
          const issueStartDate = issue.start ? new Date(issue.start) : null;
          const projectKey = issue.key?.split('-')[0] || 'Unknown';
          
          if (issue.assignee) {
            uniqueAssignees.add(issue.assignee);
          }

          const hours = typeof issue.duration === 'string' ? parseInt(issue.duration) || 8 : (issue.duration || 8);
          totalHours += hours;

          // Active projects
          if ((issueDueDate && issueDueDate.getTime() === today.getTime() && issue.status !== 'Done') ||
              issue.status === 'In Progress' || issue.status === 'In_Progress') {
            activeProjectsSet.add(projectKey);
          }

          // Projects at risk
          if (issueDueDate && issueDueDate < today && issue.status !== 'Done') {
            projectsAtRiskSet.add(projectKey);
          }

          // Calculate capacity
          if (issueStartDate && issueDueDate) {
            const businessDays = countBusinessDays(issueStartDate, issueDueDate);
            const capacityNeeded = businessDays * 8;
            usedCapacity += capacityNeeded;
          }

          // Track completed hours
          if (issue.status?.toLowerCase?.()?.includes('done') || 
              issue.status?.toLowerCase?.()?.includes('completed') ||
              issue.status?.toLowerCase?.()?.includes('closed')) {
            completedHours += hours;
          }
        });

        totalAssignees = uniqueAssignees.size;
        totalCapacity = totalAssignees * 40 * 4; // 40 hours per week, 4 weeks
        const availableCapacity = Math.max(0, totalCapacity - usedCapacity);
        const utilization = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

        // Update metrics
        const calculatedMetrics = [
          {
            label: 'ACTIVE PROJECTS',
            value: activeProjectsSet.size.toString(),
            trend: activeProjectsSet.size > 0 ? 'up' : 'down',
            color: 'text-[#0F766E]',
          },
          {
            label: 'TEAM UTILIZATION',
            value: `${utilization}%`,
            trend: utilization >= 80 ? 'up' : 'down',
            sublabel: 'Target: 85%',
            color: 'text-[#0F766E]',
          },
          {
            label: 'AVAILABLE CAPACITY',
            value: `${Math.round(availableCapacity)}h`,
            trend: availableCapacity > 0 ? 'up' : 'down',
            sublabel: 'Next 4 weeks',
            color: 'text-[#C2410C]',
            popup: {
              title: 'Capacity Breakdown',
              total: totalCapacity,
              used: Math.round(usedCapacity),
              available: Math.round(availableCapacity),
              team: totalAssignees,
            }
          },
          {
            label: 'PROJECTS AT RISK',
            value: projectsAtRiskSet.size.toString(),
            trend: projectsAtRiskSet.size > 0 ? 'down' : 'up',
            color: 'text-[#BE123C]',
          },
        ];

        setMetrics(calculatedMetrics);

        // Calculate deadlines
        const deadlines = projects
          .map(project => {
            const projectIssues = issuesByProject.get(project.key) || [];
            
            let earliestDueDate: Date | null = null;
            projectIssues.forEach(issue => {
              if (issue.due && issue.status !== 'Done' && issue.status !== 'Closed') {
                const dueDate = new Date(issue.due);
                dueDate.setHours(0, 0, 0, 0);
                if (!earliestDueDate || dueDate < earliestDueDate) {
                  earliestDueDate = dueDate;
                }
              }
            });

            if (!earliestDueDate) return null;

            const daysRemaining = Math.ceil(
              (earliestDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            let status: 'at-risk' | 'active' | 'upcoming' = 'upcoming';
            if (daysRemaining < 0) {
              status = 'at-risk';
            } else if (daysRemaining <= 7) {
              status = 'active';
            }

            return {
              projectKey: project.key,
              projectName: project.title,
              dueDate: earliestDueDate,
              daysRemaining,
              status,
            };
          })
          .filter((d): d is ProjectDeadline => d !== null)
          .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
          .slice(0, 5);

        setProjectDeadlines(deadlines);

        // Calculate team capacity from issues
        const teamMap = new Map<string, TeamMember>();
        
        issues.forEach(issue => {
          if (!issue.assignee) return;
          
          if (!teamMap.has(issue.assignee)) {
            teamMap.set(issue.assignee, {
              name: issue.assignee,
              email: issue.assigneeEmail || '',
              assignments: [],
            });
          }

          const member = teamMap.get(issue.assignee)!;
          
          if (issue.start && issue.due) {
            const startDate = new Date(issue.start);
            const dueDate = new Date(issue.due);
            
            let status: 'onTrack' | 'atRisk' | 'available' = 'available';
            if (dueDate < today && issue.status !== 'Done') {
              status = 'atRisk';
            } else if (issue.status === 'In Progress' || issue.status === 'In_Progress') {
              status = 'onTrack';
            }

            member.assignments.push({
              name: issue.summary || 'Task',
              startDate,
              dueDate,
              status,
              color: status === 'onTrack' ? 'bg-[#0F766E]' : 
                     status === 'atRisk' ? 'bg-[#C2410C]' : 'bg-[#E7E5E4]',
            });
          }
        });

        setTeamCapacity(Array.from(teamMap.values()).slice(0, 10)); // Show top 10 team members
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Generate dates for day view (10 days starting from current month)
  const generateDayDates = (date: Date) => {
    const dates = [];
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    for (let i = 0; i < 10; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      dates.push({
        date: currentDate,
        label: currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })
      });
    }
    
    return dates;
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
  const dayDates = generateDayDates(currentMonth);

  const MetricCard = ({ label, value, sublabel, trend, color, index, popup }: any) => (
    <div 
      className={`bg-white rounded-2xl p-8 shadow-sm border border-[#E7E5E4] hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in relative group`}
      style={{
        animationDelay: `${index * 80}ms`
      }}
      onMouseEnter={() => popup && setCapacityPopup(popup)}
      onMouseLeave={() => setCapacityPopup(null)}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">{label}</div>
        <div className="flex items-center gap-2">
          <div className={`${color} transition-transform hover:scale-110`}>
            {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </div>
          {popup && <Info className="w-4 h-4 text-[#A8A29E] opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
      <div className={`text-4xl font-light ${color} mb-2`}>{value}</div>
      {sublabel && <div className="text-xs text-[#78716C] font-light">{sublabel}</div>}

      {/* Popup Tooltip */}
      {popup && capacityPopup && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-900 text-white rounded-lg p-4 w-48 shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <div className="text-sm font-medium mb-3">{popup.title}</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Capacity:</span>
              <span className="font-semibold">{popup.total}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Used:</span>
              <span className="font-semibold">{popup.used}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Available:</span>
              <span className="font-semibold text-green-400">{popup.available}h</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-300">Team Size:</span>
              <span className="font-semibold">{popup.team}</span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className={DASHBOARD_STYLES.pageContainer}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={DASHBOARD_STYLES.backgroundGradient} />

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className={DASHBOARD_STYLES.headingMain}>Dashboard</h1>
              <p className="text-[#78716C] font-light mt-2">Overview of your team's capacity and project health.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-smooth"
              >
                <Calendar className="w-4 h-4" />
                <span>Last 30 Days</span>
              </Button>
              <Button className={DASHBOARD_STYLES.buttonPrimary + ' gap-2'}>
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, idx) => (
            <MetricCard key={idx} {...metric} index={idx} />
          ))}
        </div>

        {/* Upcoming Deadlines Section */}
        <div className={DASHBOARD_STYLES.cardBase + ' mb-12'}>
          <div className="flex items-center justify-between mb-8">
            <h2 className={DASHBOARD_STYLES.headingSection}>Upcoming Deadlines</h2>
            <button className="text-sm font-light text-[#0F766E] hover:text-[#2DD4BF] transition-colors">
              View All
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0F766E] border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-[#78716C] font-light">Loading deadlines...</p>
            </div>
          ) : projectDeadlines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#78716C] font-light">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectDeadlines.map((deadline, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-5 bg-white rounded-xl border border-[#E7E5E4] hover:shadow-md hover:border-[#D3D0CC] transition-all duration-200 group cursor-pointer"
                >
                  {/* Left side - Project info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Project icon */}
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0F766E]/10 transition-colors">
                      <Calendar className="w-5 h-5 text-[#78716C] group-hover:text-[#0F766E] transition-colors" />
                    </div>

                    {/* Project name and date */}
                    <div>
                      <div className="text-sm font-light text-[#1C1917] group-hover:text-[#0F766E] transition-colors">
                        {deadline.projectName}
                      </div>
                      <div className="text-xs text-[#A8A29E] font-light mt-1">
                        {deadline.dueDate?.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Days remaining and status */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-light text-[#1C1917]">
                        {Math.abs(deadline.daysRemaining)} {deadline.daysRemaining === 1 || deadline.daysRemaining === -1 ? 'day' : 'days'}
                      </div>
                      <div className="text-xs text-[#A8A29E] font-light mt-0.5">
                        {deadline.daysRemaining < 0 ? 'OVERDUE' : 'REMAINING'}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      {deadline.status === 'at-risk' ? (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#BE123C]/10 border border-[#BE123C]/30">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#BE123C] mr-2"></div>
                          <span className="text-xs font-light text-[#BE123C]">At Risk</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/30">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F766E] mr-2"></div>
                          <span className="text-xs font-light text-[#0F766E]">Active</span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="w-5 h-5 text-[#A8A29E] group-hover:text-[#0F766E] transition-colors ml-2">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Capacity & Allocation */}
        <div className={DASHBOARD_STYLES.cardBase}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className={DASHBOARD_STYLES.headingSection}>Team Capacity & Allocation</h2>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-smooth"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-smooth"
              >
                Sort
              </Button>
              <div className="flex items-center gap-2 border border-[#E7E5E4] rounded-lg px-3 py-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="text-[#78716C] hover:text-[#1C1917]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-light text-[#1C1917] w-24 text-center">{monthName}</span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="text-[#78716C] hover:text-[#1C1917]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-8 mb-8 pb-6 border-b border-[#E7E5E4]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0F766E]"></div>
              <span className="text-sm font-light text-[#78716C]">On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C2410C]"></div>
              <span className="text-sm font-light text-[#78716C]">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E7E5E4]"></div>
              <span className="text-sm font-light text-[#78716C]">Available</span>
            </div>
          </div>

          {/* Gantt Chart - Day View Only */}
          <div className="overflow-x-auto">
            {/* Column Headers */}
            <div className="flex gap-1 mb-4 pb-4 border-b border-[#E7E5E4]">
              <div className="w-40 flex-shrink-0">
                <div className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">TEAM MEMBER</div>
              </div>

              {/* Day columns */}
              <div className="flex gap-4">
                {dayDates.map((day, idx) => (
                  <div key={idx} className="w-16 text-center flex-shrink-0">
                    <div className="text-xs text-[#78716C] font-light">{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team rows */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#78716C] font-light">Loading team capacity...</p>
              </div>
            ) : teamCapacity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#78716C] font-light">No team members with assignments</p>
              </div>
            ) : (
              teamCapacity.map((member, idx) => (
                <div key={idx} className="flex gap-1 py-6 border-b border-[#E7E5E4] last:border-b-0 hover-lift rounded-lg px-4 -mx-4 group transition-smooth">
                  <div className="w-40 flex-shrink-0">
                    <div>
                      <div className="text-sm font-light text-[#1C1917] mb-1 group-hover:text-[#2DD4BF] transition-colors">{member.name}</div>
                      <div className="text-xs text-[#78716C] font-light">{member.email}</div>
                    </div>
                  </div>

                  {/* Day assignment blocks */}
                  <div className="flex gap-4 flex-1">
                    {dayDates.map((day, dayIdx) => {
                      // Find assignments that fall on this day
                      const assignmentsOnDay = member.assignments.filter(assignment => {
                        const assignStart = new Date(assignment.startDate);
                        const assignEnd = new Date(assignment.dueDate);
                        assignStart.setHours(0, 0, 0, 0);
                        assignEnd.setHours(0, 0, 0, 0);
                        const dayDate = new Date(day.date);
                        dayDate.setHours(0, 0, 0, 0);
                        return dayDate >= assignStart && dayDate <= assignEnd;
                      });

                      return (
                        <div key={dayIdx} className="w-16 flex-shrink-0 h-12 relative">
                          {assignmentsOnDay.length > 0 ? (
                            <div className="flex flex-col gap-1 h-full">
                              {assignmentsOnDay.slice(0, 2).map((assignment, aIdx) => (
                                <div
                                  key={aIdx}
                                  className={`${assignment.color} rounded-lg px-1.5 py-1 text-xs font-light text-white cursor-pointer hover:opacity-90 transition-all hover:scale-105 whitespace-nowrap overflow-hidden text-ellipsis shadow-sm hover:shadow-md flex-1 flex items-center justify-center`}
                                  title={assignment.name}
                                >
                                  {assignment.name.split(' ')[0]}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full bg-[#F5F5F4]/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
