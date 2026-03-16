import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';

export function EmployeeDashboardScreen() {
  const navigate = useNavigate();
  const { data, loading, error } = useEmployeeDashboard();
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto pb-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">Failed to load dashboard</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <PageSkeleton />;
  }

  const empDashboardTasks = data.tasks || [];
  const empDashboardAlerts = data.alerts || [];
  const empDashboardActivities = data.activities || [];
  const userName = data.userName || 'Employee';

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Dashboard</h1>
        <p className="text-base text-[#78716C] mt-1 font-light">Welcome back, {userName}</p>
        <p className="text-sm text-[#A8A29E] mt-0.5 font-light">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Section 1: Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-12">
        {/* Card 1: My Workload */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-4">MY WORKLOAD</div>
          <div className="text-[28px] font-light text-[#D97706] mb-3">{empDashboardTasks.length}</div>
          <div className="w-full bg-[#F5F5F4] rounded-full h-2 mb-3 overflow-hidden">
            <div className="bg-[#D97706] h-2 rounded-full transition-all" style={{ width: `${Math.min((empDashboardTasks.length / 10) * 100, 100)}%` }} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
            <span className="text-sm text-[#57534E] font-medium">{empDashboardTasks.length > 5 ? 'At Capacity' : 'Healthy'}</span>
          </div>
          <p className="text-xs text-[#78716C] font-light">{empDashboardTasks.length} tasks assigned</p>
        </div>

        {/* Card 2: Active Projects */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-4">ACTIVE PROJECTS</div>
          <div className="text-[28px] font-light text-[#0F766E] mb-3">{data.projects?.length || 0}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              <span className="text-sm text-[#57534E] font-light">In progress</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-4">PENDING TASKS</div>
          <div className="text-[28px] font-light text-[#1C1917] mb-3">{empDashboardTasks.filter(t => t.status === 'Not Started').length}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              <span className="text-sm text-[#57534E] font-light">Not started</span>
            </div>
          </div>
        </div>

        {/* Card 4: Time Off Balance */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-4">NEXT HOLIDAY</div>
          <div className="text-[28px] font-light text-[#0F766E] mb-3">{data.holidays ? data.holidays.name : 'None'}</div>
          <p className="text-sm text-[#57534E] font-light">{data.holidays ? data.holidays.date : 'No upcoming holidays'}</p>
        </div>
      </div>

      {/* Section 2: This Week (Two columns) */}
      <div className="flex gap-6 mb-14">
        {/* Left Column: 60% */}
        <div className="w-[60%]">
          <h2 className="text-xl font-light text-[#1C1917] mb-6">This Week's Focus</h2>

          {/* Priority Tasks Card */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8">
            <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-5">DUE THIS WEEK</div>

            <div className="space-y-1">
              {empDashboardTasks.map((task) => {
                const isChecked = checkedTasks.has(task.id);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#FAFAF9] transition-colors group -mx-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50 ${
                          isChecked
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'border-[#D6D3D1] hover:border-[#78716C]'
                        }`}
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium transition-colors ${isChecked ? 'text-[#A8A29E] line-through' : 'text-[#1C1917]'}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#78716C] font-light">{task.project}</span>
                          <span className="w-1 h-1 bg-[#D6D3D1] rounded-full" />
                          <span className={`text-xs font-light ${task.status === 'In Progress' ? 'text-[#0F766E]' : 'text-[#A8A29E]'}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[#78716C] font-light flex-shrink-0 ml-4">{task.dueDate}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/app/employee/my-projects')}
              className="mt-4 text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 transition-colors hover:underline decoration-[#0F766E]/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50 rounded px-1"
            >
              View All Tasks <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Timesheet Reminder */}
          <div className="bg-[#FFFBEB] border border-[#D6D3D1] rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <Clock className="w-[18px] h-[18px] text-[#D97706] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#1C1917] mb-1">Timesheet Due Friday</div>
                <p className="text-xs text-[#78716C] font-light mb-1">Week of Mar 11-17, 2026</p>
                <p className="text-xs text-[#78716C] font-light">38h logged / 40h standard</p>
              </div>
              <button
                onClick={() => navigate('/app/employee/time')}
                className="text-xs text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 flex-shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50 rounded px-1"
              >
                Complete <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 40% */}
        <div className="w-[40%]">
          <h2 className="text-xl font-light text-[#1C1917] mb-6">Upcoming & Alerts</h2>

          {/* Alerts Stack */}
          <div className="space-y-4 mb-8">
            {empDashboardAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`${alert.bgColor} border ${alert.borderColor} rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5 flex-shrink-0">{alert.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1C1917] mb-1">{alert.title}</div>
                    <p className="text-xs text-[#78716C] font-light leading-relaxed">{alert.description}</p>
                    {alert.secondaryText && (
                      <p className="text-xs text-[#A8A29E] font-light mt-1 leading-relaxed">{alert.secondaryText}</p>
                    )}
                    {alert.actionLabel && (
                      <button
                        onClick={() => alert.actionPath && navigate(alert.actionPath)}
                        className="mt-2 text-xs text-[#0F766E] hover:text-[#0D9488] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50 rounded px-0.5"
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Holiday */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-[#0F766E] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-2">NEXT HOLIDAY</div>
                {data.holidays ? (
                  <>
                    <div className="text-sm font-medium text-[#1C1917] mb-1">{data.holidays.name}</div>
                    <p className="text-xs text-[#78716C] font-light">{data.holidays.date}</p>
                  </>
                ) : (
                  <p className="text-xs text-[#A8A29E] font-light">No upcoming holidays</p>
                )}
              </div>
              <button
                onClick={() => navigate('/app/employee/leave')}
                className="text-xs text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 flex-shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50 rounded px-1"
              >
                See All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Recent Activity */}
      <div>
        <h2 className="text-xl font-light text-[#1C1917] mb-6">Recent Activity</h2>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="space-y-0">
            {empDashboardActivities.map((activity, idx) => (
              <div key={activity.id} className="flex items-start gap-4 relative">
                {/* Timeline line */}
                {idx < empDashboardActivities.length - 1 && (
                  <div className="absolute left-[7px] top-[22px] w-[2px] h-[calc(100%)] bg-[#E7E5E4]" />
                )}
                {/* Timeline dot */}
                <div className="w-4 h-4 rounded-full border-2 border-[#0F766E] bg-white flex-shrink-0 mt-1 z-10" />
                <div className="pb-6 flex-1 min-w-0">
                  <div className="text-xs text-[#A8A29E] font-light mb-1">{activity.timestamp}</div>
                  <div className="text-sm text-[#1C1917] font-light">{activity.description}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="text-sm text-[#0F766E] hover:text-[#0D9488] font-medium flex items-center gap-1 transition-colors hover:underline decoration-[#0F766E]/30 underline-offset-4 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50 rounded px-1"
          >
            View All Activity <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
