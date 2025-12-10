interface VeloNavTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'integrations', label: 'Data Integrations' },
  { id: 'stc', label: 'Standard Time Catalog' },
  { id: 'ledger', label: 'Capacity Ledger' },
  { id: 'hotspots', label: 'Hotspot Scoring' },
  { id: 'redeployment', label: 'Redeployment' },
  { id: 'roi', label: 'ROI Verification' },
];

export default function VeloNavTabs({ activeTab, onTabChange }: VeloNavTabsProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-4 font-semibold text-sm ${
                activeTab === tab.id
                  ? 'border-b-3 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === tab.id ? { borderBottomWidth: '3px' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
