import React, { useState, useEffect } from 'react';
export interface KPICardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
}

const AnimatedNumber = ({ value }: { value: string | number }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <span className="transition-opacity duration-300">
      {displayValue}
    </span>
  );
};

export const KPICard = ({ label, value, sublabel, trend }: KPICardProps) => (
  <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="text-sm text-[#78716C] font-medium tracking-wide uppercase text-[11px]">{label}</div>
      {trend && (
        <div className={`text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend === 'up' ? '\u2191' : '\u2193'}
        </div>
      )}
    </div>
    <div className="text-4xl font-light text-[#1C1917] mb-2 tracking-tighter group-hover:text-[#0F766E] transition-colors">
      <AnimatedNumber value={value} />
    </div>
    {sublabel && <div className="text-xs text-[#78716C] font-normal pl-0.5">{sublabel}</div>}
  </div>
);

export { AnimatedNumber };