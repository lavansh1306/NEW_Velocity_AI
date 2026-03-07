import React from 'react';

export const SystemStatus = () => {
    return (
        <div className="flex items-center gap-2 text-xs text-[#78716C] font-medium bg-white/50 px-3 py-1.5 rounded-full border border-[#E7E5E4] shadow-sm">
            <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full animate-pulse" />
            System Active
        </div>
    );
};
