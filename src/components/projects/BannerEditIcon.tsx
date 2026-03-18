import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

interface BannerEditIconProps {
  onEdit: () => void;
  isLoading?: boolean;
}

export const BannerEditIcon: React.FC<BannerEditIconProps> = ({ onEdit, isLoading = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onEdit}
        disabled={isLoading}
        className="
          group relative p-2.5 rounded-lg
          text-[#A8A29E] hover:text-[#78716C]
          bg-transparent hover:bg-white/50
          border border-transparent hover:border-[#E7E5E4]
          transition-all duration-200 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#0F766E]/20
        "
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="Edit banner"
        aria-label="Edit banner"
      >
        <Edit2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute top-full mt-2 right-0 z-40
          px-3 py-1.5 rounded-lg whitespace-nowrap
          bg-[#1C1917] text-white text-xs font-medium
          shadow-lg border border-[#292524]
          animate-in fade-in zoom-in-95 duration-200
          pointer-events-none
        ">
          Edit banner
          {/* Arrow */}
          <div className="
            absolute bottom-full right-3 translate-y-full
            border-l-4 border-r-4 border-b-4
            border-l-transparent border-r-transparent border-b-[#1C1917]
          " />
        </div>
      )}
    </div>
  );
};
