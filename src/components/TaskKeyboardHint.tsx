import React from 'react';

export const TaskKeyboardHint: React.FC = () => (
  <div className="flex items-center gap-3 text-[10px] text-[#A8A29E] select-none">
    {[
      { key: 'J/K', label: 'navigate' },
      { key: 'E', label: 'edit' },
      { key: 'C', label: 'create' },
      { key: 'Esc', label: 'deselect' },
    ].map(({ key, label }) => (
      <span key={key} className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-[#F5F5F4] border border-[#E7E5E4] rounded text-[10px] font-mono text-[#78716C]">
          {key}
        </kbd>
        <span>{label}</span>
      </span>
    ))}
  </div>
);
