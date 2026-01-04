import { useState } from 'react';

interface VeloNavTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children?: React.ReactNode;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '' },
  { id: 'projects', label: 'Projects', icon: '' },
  { id: 'stc', label: 'Standard Time Catalog', icon: '' },
  { id: 'activity', label: 'Project Activity', icon: '' },
  { id: 'ledger', label: 'Capacity Ledger', icon: '' },
  { id: 'hotspots', label: 'Hotspot Scoring', icon: '' },
  { id: 'redeployment', label: 'Redeployment', icon: '' },
  { id: 'roi', label: 'ROI Verification', icon: '' },
];

export default function VeloNavTabs({ activeTab, onTabChange, children }: VeloNavTabsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Dashboard';
  const currentTabIcon = tabs.find(t => t.id === activeTab)?.icon || '';

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 h-screen sticky top-20 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col py-6 w-full overflow-y-auto">
          <div className="px-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left px-4 py-3 font-semibold text-sm rounded-lg transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600 ml-0 pl-3'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden sticky top-20 bg-white border-b border-gray-200 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{currentTabIcon}</span>
              <span className="font-semibold text-sm text-gray-900 truncate">{currentTabLabel}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 md:hidden transition-transform duration-300 ease-in-out pt-20 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button at top */}
          <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900">Navigation</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu items */}
          <div className="px-2 py-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full text-left px-4 py-4 font-semibold text-base rounded-lg transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Main content injected by page */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
