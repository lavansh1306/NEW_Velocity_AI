import React from 'react';

const STATUS_VARIANTS: Record<string, string> = {
  'Active': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
  'At Risk': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
  'Delayed': 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]',
  'Completed': 'bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]',
  'Healthy': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
  'Overloaded': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
  'Not Started': 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]',
  'In Progress': 'bg-white text-[#1C1917] border border-[#E7E5E4]',
  'In_Progress': 'bg-white text-[#1C1917] border border-[#E7E5E4]',
  'Pending': 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]',
  'Approved': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
  'Denied': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
  'Done': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
  'To Do': 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]',
  'On Track': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
};

export const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide ${STATUS_VARIANTS[status] || 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]'}`}>
      {status}
    </span>
  );
};