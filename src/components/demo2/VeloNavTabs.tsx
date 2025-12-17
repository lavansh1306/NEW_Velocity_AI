import { useState } from 'react';

interface VeloNavTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'integrations', label: 'Data Integrations' },
  { id: 'stc', label: 'Standard Time Catalog' },
  { id: 'activity', label: 'Project Activity' },
  { id: 'ledger', label: 'Capacity Ledger' },
  { id: 'hotspots', label: 'Hotspot Scoring' },
  { id: 'redeployment', label: 'Redeployment' },
  { id: 'roi', label: 'ROI Verification' },
];

export default function VeloNavTabs({ activeTab, onTabChange }: VeloNavTabsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 h-screen sticky top-20 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col py-6 w-full overflow-y-auto">
          <div className="px-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left px-4 py-3 font-semibold text-sm rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600 ml-0 pl-3'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col">
        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden sticky top-20 bg-white border-b border-gray-200 z-40 shadow-sm">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-sm sm:text-base text-gray-900 truncate\">{currentTabLabel}</span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ml-2 ${mobileMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke=\"currentColor\"
              viewBox=\"0 0 24 24\"
            >
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 14l-7 7m0 0l-7-7m7 7V3\" />
            </svg>
          </button>

          {mobileMenuOpen && (
            <div className=\"border-t border-gray-200 bg-gray-50 max-h-[calc(100vh-200px)] overflow-y-auto\">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`w-full text-left px-4 py-3 font-semibold text-sm transition-colors flex items-center gap-2 border-l-4 active:bg-gray-100 ${
                    activeTab === tab.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-transparent text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
