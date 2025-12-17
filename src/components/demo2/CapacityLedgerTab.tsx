export default function CapacityLedgerTab() {
  const teams = [
    {
      name: 'Marketing Operations',
      total: 42.3,
      block: 28.7,
      fractional: 13.6,
      percentage: 68,
    },
    {
      name: 'Sales Team',
      total: 38.2,
      block: 24.1,
      fractional: 14.1,
      percentage: 57,
    },
    {
      name: 'Customer Success',
      total: 36.3,
      block: 31.7,
      fractional: 4.6,
      percentage: 86,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Weekly Capacity Ledger</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Aggregated capacity by team/function • Block + Fractional</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">Block Capacity (This Week)</div>
          <div className="text-3xl sm:text-4xl font-bold">84.5 hrs</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">From 4,328 automated executions</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">Fractional Capacity (This Week)</div>
          <div className="text-3xl sm:text-4xl font-bold">32.3 hrs</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">From efficiency improvements</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="text-xs sm:text-sm opacity-90 mb-1">Total Available</div>
          <div className="text-3xl sm:text-4xl font-bold">116.8 hrs</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">Ready for redeployment</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Capacity by Team</h3>
        <div className="space-y-4 sm:space-y-6">
          {teams.map((team) => (
            <div key={team.name}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{team.name}</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                  <span className="text-gray-500">Block: {team.block}h</span>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span className="text-gray-500">Frac: {team.fractional}h</span>
                  <span className="text-gray-400 sm:hidden">•</span>
                  <span className="font-bold text-gray-900">Total: {team.total}h</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-5 sm:h-6 mb-2">
                <div className="flex h-full rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${(team.block / team.total) * 100}%` }}
                  >
                    {((team.block / team.total) * 100) > 25 ? 'Block' : ''}
                  </div>
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${(team.fractional / team.total) * 100}%` }}
                  >
                    {((team.fractional / team.total) * 100) > 25 ? 'Frac' : ''}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <div className="text-gray-500 text-xs">Available Now</div>
                  <div className="font-bold text-gray-900 text-sm">{team.total}h</div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <div className="text-gray-500 text-xs">Already Deployed</div>
                  <div className="font-bold text-gray-900 text-sm">{(team.total * 0.3).toFixed(1)}h</div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <div className="text-gray-500 text-xs">Remaining Pool</div>
                  <div className="font-bold text-green-600 text-sm">{(team.total * 0.7).toFixed(1)}h</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
