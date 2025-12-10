interface VeloNavTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'integrations', label: 'Data Integrations' },
  { id: 'stc', label: 'Standard Time Catalog' },
  { id: 'activity', label: 'Project Activity' },
  { id: 'ledger', label: 'Capacity Ledger' },
  { id: 'hotspots', label: 'Hotspot Scoring' },
  { id: 'redeployment', label: 'Redeployment' },
  { id: 'roi', label: 'ROI Verification' },
];

export default function VeloNavTabs({ activeTab, onTabChange }: VeloNavTabsProps) {
  return (
    <aside className="w-56 h-screen sticky top-20 bg-white border-r border-gray-200">
      <div className="flex flex-col py-6">
        <div className="px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-4 py-3 font-semibold text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
