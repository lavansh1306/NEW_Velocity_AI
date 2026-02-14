import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  BookOpen, 
  Calendar as CalendarIcon,
  BrainCircuit,
  Activity
} from 'lucide-react';

interface VeloNavTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children?: React.ReactNode;
}

// Updated tabs configuration
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
  { id: 'leave', label: 'Leave Management', icon: <CalendarIcon className="w-5 h-5" /> }, 
  { id: 'deployment', label: 'Deployment', icon: <BrainCircuit className="w-5 h-5" /> },
  { id: 'progress', label: 'Plan My Project', icon: <Activity className="w-5 h-5" /> },
];

export default function VeloNavTabs({ activeTab, onTabChange, children }: VeloNavTabsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Dashboard';
  const currentTabIcon = tabs.find(t => t.id === activeTab)?.icon;

  return (
    <div className="flex min-h-[calc(100vh-80px)]"> 
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] bg-white border-r border-gray-200 z-30 overflow-y-auto">
        <div className="flex flex-col py-6 w-full">
          <div className="px-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left px-4 py-3 font-medium text-sm rounded-lg transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-20 bg-white border-b border-gray-200 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentTabIcon}
              <span className="font-bold text-gray-900">{currentTabLabel}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="sr-only">Open menu</span>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-white shadow-xl h-full overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                 <h2 className="font-bold">Menu</h2>
                 <button onClick={() => setMobileMenuOpen(false)}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-2 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab.id)}
                    className={`w-full text-left px-4 py-3 font-medium rounded-lg flex items-center gap-3 ${
                      activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}