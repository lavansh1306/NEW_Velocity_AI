import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ==================== PROJECT DASHBOARD WITH AI INSIGHTS ====================

export const ProjectDashboardWithInsights = ({ projectId, projectName }: { projectId: string; projectName: string }) => {
  const projectData = {
    health: 72,
    progress: 69,
    deadline: 'Mar 30, 2026',
    team: ['SC', 'MJ', 'ER', 'DK'],
    tasks: [
      {
        name: 'User Authentication System',
        skill: 'Backend',
        assignedTo: 'MJ',
        estimatedHours: 80,
        actualHours: 75,
        status: 'In Progress',
        confidence: 92,
      },
      {
        name: 'Dashboard UI Components',
        skill: 'Frontend',
        assignedTo: 'SC',
        estimatedHours: 160,
        actualHours: 185,
        status: 'In Progress',
        confidence: 68,
      },
      {
        name: 'API Integration',
        skill: 'Backend',
        assignedTo: 'MJ',
        estimatedHours: 100,
        actualHours: 85,
        status: 'In Progress',
        confidence: 85,
      },
      {
        name: 'Design System',
        skill: 'Design',
        assignedTo: 'ER',
        estimatedHours: 60,
        actualHours: 60,
        status: 'Completed',
        confidence: 100,
      },
    ],
  };

  const skillDistribution = [
    { name: 'Frontend', value: 35, fill: '#93c5fd' },
    { name: 'Backend', value: 40, fill: '#dbeafe' },
    { name: 'QA', value: 15, fill: '#bfdbfe' },
    { name: 'Design', value: 10, fill: '#0ea5e9' },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      'Completed': 'bg-emerald-50 text-emerald-700',
      'In Progress': 'bg-blue-50 text-blue-700',
      'Not Started': 'bg-gray-50 text-gray-600',
      'At Risk': 'bg-rose-50 text-rose-700',
      'On Track': 'bg-emerald-50 text-emerald-700',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-light ${variants[status] || 'bg-gray-50 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-12 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">{projectName}</h1>
          <p className="text-gray-500 font-light">Due {projectData.deadline}</p>
        </div>

        <div>
          {/* Main Content */}
          <div className="space-y-12">
            {/* Project Health & Progress */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 font-light mb-4">Project Health</div>
                <div className="flex items-center gap-5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      projectData.health >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : projectData.health >= 60
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <span className="text-2xl font-light">{projectData.health}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 font-light">Status</div>
                    <div className="text-xs text-gray-400 font-light">Monitor closely</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 font-light mb-4">Progress</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Progress value={projectData.progress} className="h-2 flex-1" />
                    <span className="text-sm text-gray-500 font-light">{projectData.progress}%</span>
                  </div>
                  <div className="text-xs text-gray-400 font-light">
                    {projectData.tasks.filter((t) => t.status === 'Completed').length} of {projectData.tasks.length} tasks complete
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Distribution */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">Skill Distribution</h2>
              <div className="flex items-center justify-center h-[240px]">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={skillDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                {skillDistribution.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skill.fill }}></div>
                    <span className="text-sm text-gray-600 font-light">{skill.name} {skill.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">Task Breakdown</h2>
              <div className="space-y-2">
                {projectData.tasks.map((task, idx) => (
                  <div key={idx} className="py-5 px-6 hover:bg-gray-50 rounded-2xl cursor-pointer transition-all duration-300">
                    <div className="flex items-center gap-6">
                      <div className="flex-1 flex items-center gap-3">
                        {task.confidence < 70 && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
                        <span className="text-sm text-gray-900 font-light">{task.name}</span>
                      </div>
                      <span className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-lg font-light">{task.skill}</span>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-light">{task.assignedTo}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-gray-500 font-light w-16 text-right">{task.estimatedHours}h</div>
                      <div className="text-sm text-gray-900 font-light w-16 text-right">{task.actualHours}h</div>
                      <div className="w-28">
                        <StatusBadge status={task.status} />
                      </div>
                      <span className={`text-sm font-light w-12 text-right ${task.confidence < 70 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {task.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardWithInsights;
