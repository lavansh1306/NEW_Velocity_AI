import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  tasks: {
    name: string;
    status: 'on-track' | 'at-risk' | 'available';
    startWeek: number;
    duration: number;
  }[];
}

interface TeamCapacityGanttProps {
  teamMembers?: TeamMember[];
}

export const TeamCapacityGantt: React.FC<TeamCapacityGanttProps> = ({
  teamMembers = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Frontend Lead',
      avatar: 'SC',
      tasks: [
        { name: 'Design System', status: 'on-track', startWeek: 0, duration: 2 },
        { name: 'Review', status: 'at-risk', startWeek: 3, duration: 1 },
        { name: 'Refactor', status: 'on-track', startWeek: 5, duration: 2 },
      ],
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      role: 'Backend Dev',
      avatar: 'MJ',
      tasks: [
        { name: 'API Setup', status: 'on-track', startWeek: 1, duration: 1 },
        { name: 'Database', status: 'on-track', startWeek: 2, duration: 2 },
        { name: 'Security', status: 'available', startWeek: 6, duration: 1 },
      ],
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'Product Designer',
      avatar: 'ER',
      tasks: [
        { name: 'User Research', status: 'on-track', startWeek: 1, duration: 1 },
        { name: 'Wireframes', status: 'at-risk', startWeek: 2, duration: 2 },
      ],
    },
    {
      id: '4',
      name: 'David Kim',
      role: 'Full Stack',
      avatar: 'DK',
      tasks: [
        { name: 'Onboarding', status: 'on-track', startWeek: 0, duration: 1 },
        { name: 'Frontend', status: 'on-track', startWeek: 1, duration: 2 },
        { name: 'QA', status: 'on-track', startWeek: 5, duration: 1 },
      ],
    },
  ],
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1)); // Feb 2026
  const [scrollPosition, setScrollPosition] = useState(0);

  const weeks = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(currentMonth);
    date.setDate(date.getDate() + i * 7);
    return date;
  });

  const formatWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTaskColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-[#A7F3D0]';
      case 'at-risk':
        return 'bg-[#FED7AA]';
      case 'available':
        return 'bg-[#E5E7EB]';
      default:
        return 'bg-gray-300';
    }
  };

  const getTaskBorder = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'border-[#10B981]';
      case 'at-risk':
        return 'border-[#F59E0B]';
      case 'available':
        return 'border-[#9CA3AF]';
      default:
        return 'border-gray-400';
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition((e.target as HTMLDivElement).scrollLeft);
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E7E5E4] w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light text-[#1C1917]">Team Capacity & Allocation</h2>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F5F5F4] text-sm font-light text-[#78716C] transition-all">
            Filter
          </button>
          <button className="px-4 py-2 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F5F5F4] text-sm font-light text-[#78716C] transition-all">
            Sort
          </button>
          <div className="flex items-center gap-3 ml-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-[#F5F5F4] rounded-lg transition-all">
              <ChevronLeft className="w-5 h-5 text-[#78716C]" />
            </button>
            <span className="min-w-[100px] text-center text-sm font-light text-[#1C1917]">
              {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-[#F5F5F4] rounded-lg transition-all">
              <ChevronRight className="w-5 h-5 text-[#78716C]" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#E7E5E4]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
          <span className="text-sm font-light text-[#78716C]">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
          <span className="text-sm font-light text-[#78716C]">At Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#9CA3AF]"></div>
          <span className="text-sm font-light text-[#78716C]">Available</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-auto">
        {/* Table Header */}
        <div className="flex mb-4 sticky top-0 z-10">
          <div className="w-48 flex-shrink-0">
            <div className="text-xs font-medium text-[#A8A29E] uppercase tracking-wide">Team Member</div>
          </div>
          <div className="flex gap-4 px-4">
            {weeks.map((week, i) => (
              <div key={i} className="w-24 flex-shrink-0">
                <div className="text-xs font-medium text-[#78716C] text-center">{formatWeek(week)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members & Tasks */}
        {teamMembers.map((member) => (
          <div key={member.id} className="flex mb-6 pb-6 border-b border-[#E7E5E4] last:border-0">
            <div className="w-48 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#78716C]">
                  {member.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">{member.name}</p>
                  <p className="text-xs text-[#A8A29E]">{member.role}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 px-4 flex-1 relative">
              {/* Week columns background */}
              {weeks.map((_, i) => (
                <div key={i} className="w-24 flex-shrink-0 border-l border-[#E7E5E4] opacity-30 absolute" style={{ left: `${184 + i * 104}px` }} />
              ))}

              {/* Tasks */}
              <div className="relative w-full h-12 flex items-center">
                {member.tasks.map((task, i) => (
                  <div
                    key={i}
                    className={`absolute h-8 rounded-lg border-l-4 flex items-center px-2.5 text-xs font-light text-[#1C1917] whitespace-nowrap ${getTaskColor(task.status)} ${getTaskBorder(task.status)}`}
                    style={{
                      left: `${task.startWeek * 104}px`,
                      width: `${task.duration * 104 - 8}px`,
                    }}
                  >
                    {task.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex-1 h-1 bg-[#E7E5E4] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-[#9CA3AF] rounded-full" style={{ marginLeft: `${scrollPosition * 0.33}px` }} />
        </div>
      </div>
    </div>
  );
};
