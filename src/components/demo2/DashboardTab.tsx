export default function DashboardTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pilot Overview</h2>
        <p className="text-gray-600 mt-1">Marketing Operations • 90-Day Pilot • Integration: Asana + HubSpot</p>
      </div>

      {/* ROI Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl p-6">
          <div className="text-sm opacity-90 mb-1">Total Realized Value</div>
          <div className="text-3xl font-bold">$127,450</div>
          <div className="text-sm mt-2 opacity-75">3.2x Platform Fee ROI</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Operational ROI (Tier A)</div>
          <div className="text-3xl font-bold text-green-600">$68,200</div>
          <div className="text-xs text-gray-500 mt-2">12 verified accelerations</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Cost Avoidance (Tier B)</div>
          <div className="text-3xl font-bold text-orange-600">$42,500</div>
          <div className="text-xs text-gray-500 mt-2">8 harvest tasks completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Revenue Impact (Tier C)</div>
          <div className="text-3xl font-bold text-purple-600">$16,750</div>
          <div className="text-xs text-gray-500 mt-2">3 deal accelerations</div>
        </div>
      </div>

      {/* Capacity Summary */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Capacity Minted</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Block Capacity</span>
                <span className="text-sm font-bold text-gray-900">84.5 hours</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6">
                <div
                  className="h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: '72%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Fractional Capacity</span>
                <span className="text-sm font-bold text-gray-900">32.3 hours</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6">
                <div
                  className="h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: '28%' }}
                ></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Total Available</span>
                <span className="text-lg font-bold text-gray-900">116.8 hours</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Integration Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-900">HubSpot</span>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Synced 2m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-900">Asana</span>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Synced 4m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-900">MS 365</span>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Synced 1m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-900">Zapier</span>
              </div>
              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                Not Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Capacity Events</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Block Capacity Minted: Lead Triage Automation</div>
              <div className="text-sm text-gray-600">342 leads auto-processed, 8.5 hours saved</div>
            </div>
            <div className="text-xs text-gray-500">2 hours ago</div>
          </div>
          <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Fractional Capacity: Meeting Efficiency Gain</div>
              <div className="text-sm text-gray-600">4 meetings optimized, 1.7 hours recaptured</div>
            </div>
            <div className="text-xs text-gray-500">5 hours ago</div>
          </div>
          <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">ROI Event: Campaign Launch Accelerated</div>
              <div className="text-sm text-gray-600">3 days saved via capacity allocation, $7,500 CoD value</div>
            </div>
            <div className="text-xs text-gray-500">1 day ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
