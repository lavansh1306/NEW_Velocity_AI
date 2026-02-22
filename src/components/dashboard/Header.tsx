import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Header = () => {
  const [searchValue, setSearchValue] = useState('');
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/settings') return 'Settings';
    if (location.pathname === '/projects') return 'Projects';
    
    // Check for tabs in velocity-ai
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (location.pathname === '/velocity-ai') {
      if (tabParam === 'leave') return 'Leave';
      if (tabParam === 'deployment') return 'Plan';
      return 'Dashboard';
    }
    
    return 'Dashboard';
  };

  return (
    <div className="sticky top-0 z-40 h-16 bg-white border-b border-[#E7E5E4] shadow-sm">
      <div className="h-full px-8 flex items-center justify-between gap-6">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 min-w-fit">
          <span className="text-sm font-light text-[#78716C]">Velocity AI</span>
          <span className="text-sm font-light text-[#78716C]">›</span>
          <span className="text-sm font-light text-[#1C1917]">{getPageTitle()}</span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A8A39E]" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search dashboard..."
              className="w-full h-10 pl-10 pr-4 bg-[#F5F5F4] border border-[#E7E5E4] rounded-full text-sm font-light text-[#1C1917] placeholder-[#A8A39E] focus:outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917]/10 transition-all"
            />
          </div>
        </div>

        {/* Right: Status & Notifications */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F4] rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#16A34A]"></div>
            <span className="text-xs font-light text-[#78716C]">System Operational</span>
          </div>
          <button className="p-2 hover:bg-[#F5F5F4] rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-[#78716C] hover:text-[#1C1917]" />
          </button>
        </div>
      </div>
    </div>
  );
};
