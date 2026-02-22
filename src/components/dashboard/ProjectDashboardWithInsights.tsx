import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DASHBOARD_STYLES,
  getStatusBadgeStyle,
  getPriorityBadgeStyle,
  getHealthIndicatorStyle,
  getUtilizationBarColor,
  getUtilizationTextColor,
} from './styles';

// ==================== PROJECT DASHBOARD WITH AI INSIGHTS ====================

export const ProjectDashboardWithInsights = ({ projectId, projectName }: { projectId: string; projectName: string }) => {
  const [selectedScenario, setSelectedScenario] = useState(0);

  const projectData = {
    health: 72,
    status: 'At Risk',
    deadline: 'Mar 30, 2026',
    startDate: 'Jan 15, 2026',
    daysRemaining: 44,
    feasibility: 85,
    totalEstHours: 1240,
    actualHours: 856,
    remainingHours: 384,
    completion: 69,
    teamSize: 8,
  };

  const tasks = [
    {
      id: 1,
      title: 'User Authentication System',
      key: 'AUTH-001',
      assignee: 'MJ',
      assigneeInitials: 'MJ',
      status: 'In Progress',
      priority: 'High',
    },
    {
      id: 2,
      title: 'Dashboard UI Components',
      key: 'UI-045',
      assignee: 'SC',
      assigneeInitials: 'SC',
      status: 'In Progress',
      priority: 'High',
    },
    {
      id: 3,
      title: 'API Integration',
      key: 'API-023',
      assignee: 'ER',
      assigneeInitials: 'ER',
      status: 'In Progress',
      priority: 'Medium',
    },
    {
      id: 4,
      title: 'Design System Setup',
      key: 'DES-008',
      assignee: 'DK',
      assigneeInitials: 'DK',
      status: 'Completed',
      priority: 'Medium',
    },
  ];

  const teamMembers = [
    { name: 'Sarah Chen', role: 'Lead Frontend', avatar: 'SC', utilization: 95, status: 'Active' },
    { name: 'Michael J.', role: 'Backend Engineer', avatar: 'MJ', utilization: 120, status: 'At Risk' },
    { name: 'Emily Rodriguez', role: 'Full Stack', avatar: 'ER', utilization: 85, status: 'Active' },
    { name: 'David Kim', role: 'DevOps Engineer', avatar: 'DK', utilization: 75, status: 'Active' },
  ];

  const scenarios = [
    {
      title: 'Accelerated Timeline',
      metrics: { hours: '+120h budget', team: '+2 engineers' },
      pros: ['Complete by Mar 15', 'Buffer for QA'],
      cons: ['Higher budget', 'Team strain'],
    },
    {
      title: 'Current Plan',
      metrics: { hours: 'On track', team: 'Stable' },
      pros: ['Sustainable pace', 'Budget aligned'],
      cons: ['Tight deadline', 'Minimal buffer'],
    },
    {
      title: 'Extended Scope',
      metrics: { hours: '+60h', team: 'Current' },
      pros: ['Polish features', 'Better QA'],
      cons: ['Move deadline', 'More testing'],
    },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const className = getStatusBadgeStyle(status);
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-light ${className}`}>
        {status}
      </span>
    );
  };

  const MetricCard = ({ label, value }: { label: string; value: string }) => (
    <div className={DASHBOARD_STYLES.metricContainer}>
      <div className={DASHBOARD_STYLES.metricValue}>{value}</div>
      <div className={DASHBOARD_STYLES.metricCardLabel}>{label}</div>
    </div>
  );

  const Divider = () => <div className={DASHBOARD_STYLES.divider}></div>;

  const UtilizationBar = ({ value }: { value: number }) => {
    const color = getUtilizationBarColor(value);
    const width = Math.min(value, 150);

    return (
      <div className={DASHBOARD_STYLES.utilizationBarContainer}>
        <div className={`${DASHBOARD_STYLES.utilizationBarFill} ${color}`} style={{ width: `${width}%` }} />
      </div>
    );
  };

  const HealthIndicator = ({ score }: { score: number }) => {
    const { container, text } = getHealthIndicatorStyle(score);

    return (
      <div className={container}>
        <span className={text}>{score}</span>
      </div>
    );
  };

  const AIRecommendationCard = ({
    title,
    metrics,
    pros,
    cons,
    isSelected,
    onSelect,
  }: {
    title: string;
    metrics: Record<string, string>;
    pros: string[];
    cons: string[];
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <div
      onClick={onSelect}
      className={`${DASHBOARD_STYLES.aiCardBase} ${
        isSelected ? DASHBOARD_STYLES.aiCardSelected : DASHBOARD_STYLES.aiCardDefault
      }`}
    >
      <h3 className={DASHBOARD_STYLES.aiCardTitle}>{title}</h3>
      <div className={DASHBOARD_STYLES.aiCardMetrics}>
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key}>{value}</div>
        ))}
      </div>
      {isSelected && (
        <div className="text-xs space-y-2">
          <div>
            <div className={DASHBOARD_STYLES.aiCardProLabel}>Pros:</div>
            {pros.map((pro, idx) => (
              <div key={idx} className={DASHBOARD_STYLES.aiCardBullet}>• {pro}</div>
            ))}
          </div>
          <div>
            <div className={DASHBOARD_STYLES.aiCardConLabel}>Cons:</div>
            {cons.map((con, idx) => (
              <div key={idx} className={DASHBOARD_STYLES.aiCardBullet}>• {con}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const AIInsightsPanel = () => (
    <div className={DASHBOARD_STYLES.cardSticky}>
      <h2 className={DASHBOARD_STYLES.headingSection}>AI Recommendations</h2>

      <div className="space-y-4 mt-8">
        {scenarios.map((scenario, idx) => (
          <AIRecommendationCard
            key={idx}
            title={scenario.title}
            metrics={scenario.metrics}
            pros={scenario.pros}
            cons={scenario.cons}
            isSelected={selectedScenario === idx}
            onSelect={() => setSelectedScenario(idx)}
          />
        ))}
      </div>
    </div>
  );

  const TaskTrackerSection = () => (
    <div className={DASHBOARD_STYLES.cardBase}>
      <div className="flex items-center justify-between mb-8">
        <h2 className={DASHBOARD_STYLES.headingSection}>Project Tasks</h2>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 text-xs ${DASHBOARD_STYLES.buttonSecondary}`}
        >
          View All Tasks
        </Button>
      </div>

      <div className="w-full">
        {/* Header */}
        <div className={DASHBOARD_STYLES.tableHeader}>
          <div className="flex-1 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Task</div>
          <div className="w-40 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Assignee</div>
          <div className="w-28 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Status</div>
          <div className="w-24 text-right text-xs text-[#A8A29E] uppercase tracking-wider font-light">Priority</div>
        </div>

        {/* Task Rows */}
        <div className="space-y-1">
          {tasks.map((task) => (
            <div key={task.id} className={DASHBOARD_STYLES.tableRow}>
              <div className="flex-1">
                <div className={DASHBOARD_STYLES.taskTitle}>{task.title}</div>
                <div className={DASHBOARD_STYLES.taskKey}>{task.key}</div>
              </div>
              <div className="w-40 flex items-center gap-2">
                <Avatar className={`w-6 h-6 ${DASHBOARD_STYLES.avatar}`}>
                  <AvatarFallback className={`${DASHBOARD_STYLES.avatarFallback} text-[10px]`}>
                    {task.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <span className={DASHBOARD_STYLES.taskAssignee}>{task.assignee}</span>
              </div>
              <div className="w-28">
                <StatusBadge status={task.status} />
              </div>
              <div className="w-24 text-right">
                <span className={`text-xs px-2 py-1 rounded-md ${getPriorityBadgeStyle(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TeamAllocationSection = () => (
    <div className={DASHBOARD_STYLES.cardBase}>
      <h2 className={DASHBOARD_STYLES.headingSection}>Team Allocation</h2>
      <div className="space-y-2 mt-8">
        {teamMembers.map((member, idx) => (
          <div key={idx} className={DASHBOARD_STYLES.allocationRow}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className={`w-10 h-10 ${DASHBOARD_STYLES.avatar} shadow-sm`}>
                  <AvatarFallback className={`${DASHBOARD_STYLES.avatarFallback} text-sm font-light`}>
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className={DASHBOARD_STYLES.memberName}>{member.name}</div>
                  <div className={DASHBOARD_STYLES.memberRole}>{member.role}</div>
                </div>
              </div>

              <div className="w-48 flex items-center gap-3">
                <div className="flex-1">
                  <UtilizationBar value={member.utilization} />
                </div>
                <span className={`text-sm font-light ${getUtilizationTextColor(member.utilization)}`}>
                  {member.utilization}%
                </span>
              </div>

              <div className="w-28 flex justify-end">
                <StatusBadge status={member.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={DASHBOARD_STYLES.pageContainer}>
      {/* Background gradient effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={DASHBOARD_STYLES.backgroundGradient}
      />

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <button className={DASHBOARD_STYLES.backButton}>
            <ArrowLeft className={DASHBOARD_STYLES.backButtonArrow} />
            Back to Projects
          </button>
        </div>

        <div className={DASHBOARD_STYLES.gridMain}>
          {/* MAIN CONTENT - 8 columns */}
          <div className="col-span-8 space-y-10">
            {/* ===== HEADER SECTION ===== */}
            <div className={DASHBOARD_STYLES.cardBase}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3">
                    <StatusBadge status={projectData.status} />
                  </div>
                  <h1 className={DASHBOARD_STYLES.headingMain}>
                    {projectName}
                  </h1>
                  <div className="flex items-center gap-2 text-sm font-light">
                    <span className="text-[#1C1917]">
                      {projectData.startDate} → {projectData.deadline}
                    </span>
                    <span className="text-[#A8A29E]">· {projectData.daysRemaining} days remaining</span>
                  </div>
                </div>
                <div className="flex items-start gap-12 text-right">
                  <div>
                    <div className={DASHBOARD_STYLES.label}>Health Score</div>
                    <div className="flex justify-end">
                      <HealthIndicator score={projectData.health} />
                    </div>
                    <div className={DASHBOARD_STYLES.label + ' mt-2'}>Feasibility {projectData.feasibility}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="mt-4 flex justify-end">
              <Button className={DASHBOARD_STYLES.buttonPrimary}>
                Edit Project
              </Button>
            </div>

            {/* ===== OVERVIEW METRICS ===== */}
            <div className={`flex items-center gap-8 py-8 px-10 ${DASHBOARD_STYLES.cardSmall}`}>
              <MetricCard label="Total Est. Hours" value={projectData.totalEstHours.toString()} />
              <Divider />
              <MetricCard label="Actual Hours" value={projectData.actualHours.toString()} />
              <Divider />
              <MetricCard label="Remaining" value={projectData.remainingHours.toString()} />
              <Divider />
              <MetricCard label="Completion" value={`${projectData.completion}%`} />
              <Divider />
              <MetricCard label="Team Size" value={projectData.teamSize.toString()} />
            </div>

            {/* ===== TASK TRACKER ===== */}
            <TaskTrackerSection />

            {/* ===== TEAM ALLOCATION ===== */}
            <TeamAllocationSection />
          </div>

          {/* AI INSIGHTS PANEL - 4 columns */}
          <div className="col-span-4">
            <AIInsightsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardWithInsights;
