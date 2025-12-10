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
        <h2 className="text-2xl font-bold text-gray-900">Weekly Capacity Ledger</h2>
        <p className="text-gray-600 mt-1">Aggregated capacity by team/function • Block + Fractional</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Block Capacity (This Week)</div>
          <div className="text-4xl font-bold">84.5 hrs</div>
          <div className="text-sm mt-2 opacity-75">From 4,328 automated executions</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Fractional Capacity (This Week)</div>
          <div className="text-4xl font-bold">32.3 hrs</div>
          <div className="text-sm mt-2 opacity-75">From efficiency improvements</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Total Available</div>
          <div className="text-4xl font-bold">116.8 hrs</div>
          <div className="text-sm mt-2 opacity-75">Ready for redeployment</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Capacity by Team</h3>
        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team.name}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{team.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">Block: {team.block}h</span>
                  <span className="text-xs text-gray-500">Fractional: {team.fractional}h</span>
                  <span className="text-sm font-bold text-gray-900">Total: {team.total}h</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6 mb-2">
                <div className="flex h-6 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${(team.block / team.total) * 100}%` }}
                  >
                    Block
                  </div>
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${(team.fractional / team.total) * 100}%` }}
                  >
                    Frac
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">Available Now</div>
                  <div className="font-bold text-gray-900">{team.total}h</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">Already Deployed</div>
                  <div className="font-bold text-gray-900">{(team.total * 0.3).toFixed(1)}h</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">Remaining Pool</div>
                  <div className="font-bold text-green-600">{(team.total * 0.7).toFixed(1)}h</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
