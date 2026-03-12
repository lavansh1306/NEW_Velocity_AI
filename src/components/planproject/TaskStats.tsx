import React from 'react';

interface TaskStatsProps {
    totalHours: number;
    taskCount: number;
}

export const TaskStats: React.FC<TaskStatsProps> = ({ totalHours, taskCount }) => {
    return (
        <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E7E5E4] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs text-[#78716C] uppercase tracking-wider mb-2">Total Effort</div>
                <div className="text-2xl text-[#1C1917] font-light">{totalHours}h</div>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E7E5E4] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs text-[#78716C] uppercase tracking-wider mb-2">Tasks Generated</div>
                <div className="text-2xl text-[#1C1917] font-light">{taskCount}</div>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E7E5E4] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs text-[#78716C] uppercase tracking-wider mb-2">Est. Duration</div>
                <div className="text-2xl text-[#1C1917] font-light">{Math.ceil(totalHours / 40)}w</div>
            </div>
        </div>
    );
};