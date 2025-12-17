export default function HotspotScoringTab() {
  const hotspots = [
    {
      title: 'Q4 Product Launch Campaign - Asset Finalization',
      team: 'Marketing Operations',
      dueDate: 'Nov 18, 2024',
      status: 'At Risk',
      hotspotScore: 94,
      slack: '-3 days',
      cod: '$2,500/day',
      proximity: '8 days',
      dependencies: '14 downstream',
      impact: 'Launch delay will push past Black Friday window. Downstream tasks include email sequence setup, paid media launch, and sales enablement.',
      borderColor: 'border-red-400',
    },
    {
      title: 'Enterprise Deal - Technical POC Setup',
      team: 'Sales Engineering',
      dueDate: 'Nov 19, 2024',
      status: 'Critical',
      hotspotScore: 91,
      slack: '-2 days',
      cod: '$6,000/day',
      proximity: '9 days',
      dependencies: '3 downstream',
      impact: '$180K ARR deal dependent on technical proof of concept. Sales team scheduled demo for Nov 21.',
      borderColor: 'border-red-400',
    },
    {
      title: 'Q4 Board Deck - Data Analysis & Visualization',
      team: 'Operations',
      dueDate: 'Nov 25, 2024',
      status: 'Moderate',
      hotspotScore: 72,
      slack: '+2 days',
      cod: '$1,200/day',
      proximity: '15 days',
      dependencies: '7 downstream',
      impact: 'Executive team review meeting. Delay affects strategic planning visibility.',
      borderColor: 'border-yellow-400',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Task Hotspot Scoring</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">Ranked by slack, proximity, and Cost of Delay (CoD)</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-6 overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-full sm:min-w-0">
          <div className="flex-1">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Filter by Priority</label>
            <select className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Hotspots</option>
              <option>Critical Only</option>
              <option>At Risk</option>
              <option>Moderate</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Team</label>
            <select className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Teams</option>
              <option>Marketing</option>
              <option>Sales</option>
              <option>Operations</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Time Horizon</label>
            <select className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Next 30 Days</option>
              <option>Next 7 Days</option>
              <option>Next 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {hotspots.map((hotspot, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg border ${hotspot.borderColor} border-l-4 p-4 sm:p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-base sm:text-lg mb-2">{hotspot.title}</div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <span className="text-gray-600 truncate">{hotspot.team}</span>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span className="text-gray-600">Due: {hotspot.dueDate}</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex-shrink-0">
                    {hotspot.status}
                  </span>
                </div>
              </div>
              <button className="px-4 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 text-xs sm:text-sm flex-shrink-0 w-full sm:w-auto transition-colors">
                Investigate
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4">
              <div className="bg-red-50 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Hotspot Score</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{hotspot.hotspotScore}</div>
              </div>
              <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Slack</div>
                <div className="text-base sm:text-lg font-bold text-orange-600">{hotspot.slack}</div>
              </div>
              <div className={`${hotspot.slack.includes('-') ? 'bg-yellow-50' : 'bg-green-50'} p-2 sm:p-3 rounded-lg`}>
                <div className="text-xs text-gray-600 mb-1">Cost of Delay</div>
                <div className={`text-base sm:text-lg font-bold ${hotspot.slack.includes('-') ? 'text-yellow-600' : 'text-green-600'}`}>
                  {hotspot.cod}
                </div>
              </div>
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Proximity</div>
                <div className="text-base sm:text-lg font-bold text-blue-600">{hotspot.proximity}</div>
              </div>
              <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Dependencies</div>
                <div className="text-base sm:text-lg font-bold text-purple-600">{hotspot.dependencies}</div>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-700">
              <strong>Impact:</strong> {hotspot.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
