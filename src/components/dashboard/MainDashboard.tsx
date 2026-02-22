import React, { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DASHBOARD_STYLES } from './styles';

export const MainDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));

  const metrics = [
    {
      label: 'ACTIVE PROJECTS',
      value: '12',
      trend: 'up',
      color: 'text-[#0F766E]',
    },
    {
      label: 'TEAM UTILIZATION',
      value: '87%',
      trend: 'up',
      sublabel: 'Target: 85%',
      color: 'text-[#0F766E]',
    },
    {
      label: 'AVAILABLE CAPACITY',
      value: '312h',
      trend: 'down',
      sublabel: 'Next 2 weeks',
      color: 'text-[#C2410C]',
    },
    {
      label: 'PROJECTS AT RISK',
      value: '3',
      trend: 'down',
      color: 'text-[#BE123C]',
    },
  ];

  const teamCapacity = [
    {
      name: 'Sarah Chen',
      role: 'Frontend Lead',
      initials: 'SC',
      assignments: [
        { name: 'Design System', startDay: 5, duration: 3, status: 'onTrack', color: 'bg-[#0F766E]' },
        { name: 'Review', startDay: 9, duration: 2, status: 'atRisk', color: 'bg-[#C2410C]' },
        { name: 'Refactor', startDay: 14, duration: 3, status: 'onTrack', color: 'bg-[#0F766E]' },
      ],
    },
    {
      name: 'Marcus Johnson',
      role: 'Backend Dev',
      initials: 'MJ',
      assignments: [
        { name: 'API Setup', startDay: 3, duration: 3, status: 'onTrack', color: 'bg-[#0F766E]' },
        { name: 'Database', startDay: 7, duration: 4, status: 'onTrack', color: 'bg-[#0F766E]' },
        { name: 'Security', startDay: 12, duration: 3, status: 'available', color: 'bg-[#E7E5E4]' },
      ],
    },
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getWeekDates = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const daysInMonth = getDaysInMonth(date);
    const weeks: number[] = [];
    
    for (let i = 1; i <= daysInMonth; i += 7) {
      weeks.push(i);
    }
    
    return weeks;
  };

  const weekDates = getWeekDates(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' });

  const MetricCard = ({ label, value, sublabel, trend, color }: any) => (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E7E5E4] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">{label}</div>
        <div className={`${color} transition-transform`}>
          {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        </div>
      </div>
      <div className={`text-4xl font-light ${color} mb-2`}>{value}</div>
      {sublabel && <div className="text-xs text-[#78716C] font-light">{sublabel}</div>}
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
                className="gap-2 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]"
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
            <MetricCard key={idx} {...metric} />
          ))}
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
                className="gap-2 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]"
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

          {/* Gantt Chart */}
          <div className="overflow-x-auto">
            {/* Column Headers */}
            <div className="flex gap-1 mb-4 pb-4 border-b border-[#E7E5E4]">
              <div className="w-40 flex-shrink-0">
                <div className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">TEAM MEMBER</div>
              </div>
              <div className="w-14 flex-shrink-0">
                <div className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Week</div>
              </div>

              {/* Week columns */}
              <div className="flex gap-6">
                {[
                  'Feb 22',
                  'Mar 01',
                  'Mar 08',
                  'Mar 15',
                  'Mar 22',
                  'Mar 29',
                  'Apr 05',
                  'Apr 12',
                  'Apr...',
                ].map((date, idx) => (
                  <div key={idx} className="w-20 text-center flex-shrink-0">
                    <div className="text-xs text-[#78716C] font-light">{date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team rows */}
            {teamCapacity.map((member, idx) => (
              <div key={idx} className="flex gap-1 py-6 border-b border-[#E7E5E4] last:border-b-0">
                <div className="w-40 flex-shrink-0">
                  <div>
                    <div className="text-sm font-light text-[#1C1917] mb-1">{member.name}</div>
                    <div className="text-xs text-[#78716C] font-light">{member.role}</div>
                  </div>
                </div>
                <div className="w-14 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] flex items-center justify-center text-xs font-light text-[#1C1917]">
                    {member.initials}
                  </div>
                </div>

                {/* Assignment blocks */}
                <div className="flex gap-6 flex-1">
                  {member.assignments.map((assignment, aIdx) => (
                    <div key={aIdx} className="flex-shrink-0 relative" style={{ width: `${assignment.duration * 20 + 4}px` }}>
                      <div
                        className={`${assignment.color} rounded-lg px-2 py-1.5 text-xs font-light text-white cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis`}
                        title={assignment.name}
                      >
                        {assignment.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
