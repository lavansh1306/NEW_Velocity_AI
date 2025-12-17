import { useState } from 'react';

export default function RedeploymentTab() {
  const [allocatedHours, setAllocatedHours] = useState(12);

  const daysSaved = Math.ceil(allocatedHours / 8);
  const codPerDay = 2500;
  const predictedValue = daysSaved * codPerDay;

  const currentDue = new Date('2024-11-18');
  const newDate = new Date(currentDue);
  newDate.setDate(newDate.getDate() - daysSaved);
  const newCompletionStr = newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Capacity Redeployment Engine</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Drag capacity hours to tasks • Predict acceleration • Track outcomes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Available Capacity Pool */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Available Capacity Pool</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg cursor-move hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Marketing - Block Capacity</span>
                <span className="text-base sm:text-lg font-bold text-green-600">28.7h</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">From lead triage automation</div>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Sales - Fractional Capacity</span>
                <span className="text-base sm:text-lg font-bold text-blue-600">14.1h</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">From meeting efficiency gains</div>
            </div>
            <div className="p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg cursor-move hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Operations - Mixed</span>
                <span className="text-base sm:text-lg font-bold text-purple-600">18.3h</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">From report automation</div>
            </div>
          </div>
        </div>

        {/* Allocation Target */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Allocation Target</h3>
          <div className="p-3 sm:p-4 bg-red-50 border-2 border-red-300 rounded-lg mb-4">
            <div className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900 mb-2">Q4 Product Launch Campaign - Asset Finalization</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-3">
              <div>
                <span className="text-gray-600">Current Due Date:</span>
                <div className="font-bold text-gray-900">Nov 18, 2024</div>
              </div>
              <div>
                <span className="text-gray-600">Slack Deficit:</span>
                <div className="font-bold text-red-600">-3 days</div>
              </div>
            </div>
            <div className="border-t border-red-200 pt-3 mt-3">
              <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Allocate Hours:</label>
              <input
                type="range"
                min="0"
                max="40"
                value={allocatedHours}
                onChange={(e) => setAllocatedHours(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center mt-2 text-base sm:text-lg font-bold text-blue-600">{allocatedHours} hours</div>
            </div>
          </div>

          {/* Prediction Display */}
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm font-bold text-blue-900">Predicted Impact</span>
            </div>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">New Completion Date:</span>
                <span className="font-bold text-green-600">{newCompletionStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Saved:</span>
                <span className="font-bold text-green-600">{daysSaved} day{daysSaved > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Predicted Value:</span>
                <span className="font-bold text-green-600">${predictedValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5 sm:pt-2 border-t border-blue-200">
                <span className="text-gray-600">ROI Tier:</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Tier A - Direct</span>
              </div>
            </div>
            <button className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-xs sm:text-sm">
              Commit Allocation
            </button>
          </div>
        </div>
      </div>

      {/* Active Allocations */}
      <div className="mt-4 sm:mt-6 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Active Capacity Allocations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-bold text-gray-700 uppercase">Task</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-bold text-gray-700 uppercase">Hours</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-bold text-gray-700 uppercase">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-bold text-gray-700 uppercase">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold text-gray-900">Enterprise POC Setup</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600">18.5 hours</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">In Progress</span></td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 font-bold text-green-600">$12,000</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold text-gray-900">Board Deck Analysis</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600">8.0 hours</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Completed</span></td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 font-bold text-green-600">$2,400</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
