export default function ROIVerificationTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ROI Verification & Evidence Layer</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Tiered attribution • Traceable to source events • Realized value only</p>
      </div>

      {/* ROI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm opacity-90">Tier A: Operational ROI</div>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-bold">Direct</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold mb-2">$68,200</div>
          <div className="text-xs sm:text-sm opacity-75">12 verified accelerations</div>
          <div className="text-xs opacity-60 mt-2">Days Saved × CoD/day</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm opacity-90">Tier B: Cost Avoidance</div>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-bold">Validated</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold mb-2">$42,500</div>
          <div className="text-xs sm:text-sm opacity-75">8 harvest tasks completed</div>
          <div className="text-xs opacity-60 mt-2">Contractor/headcount reduction</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm opacity-90">Tier C: Revenue Impact</div>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-bold">Attributed</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold mb-2">$16,750</div>
          <div className="text-xs sm:text-sm opacity-75">3 deal accelerations</div>
          <div className="text-xs opacity-60 mt-2">Deal velocity contribution</div>
        </div>
      </div>

      {/* Evidence Trail */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Evidence Trail</h3>
        <div className="space-y-3 sm:space-y-4">
          {/* Tier A Evidence */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-green-500">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Tier A</span>
                  <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Q4 Campaign Launch Acceleration</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Marketing Operations • Completed Nov 8, 2024</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500">Verified Value</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">$7,500</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs mb-3">
              <div>
                <div className="text-gray-600">Capacity Allocated</div>
                <div className="font-bold text-gray-900">12.5 hours</div>
              </div>
              <div>
                <div className="text-gray-600">Days Saved</div>
                <div className="font-bold text-gray-900">3 days</div>
              </div>
              <div>
                <div className="text-gray-600">Cost of Delay</div>
                <div className="font-bold text-gray-900">$2,500/day</div>
              </div>
              <div>
                <div className="text-gray-600">Evidence Type</div>
                <div className="font-bold text-gray-900">Direct</div>
              </div>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 font-semibold mb-2">View Evidence Chain</summary>
              <div className="bg-white p-2 sm:p-3 rounded border border-gray-200 space-y-1 text-gray-600 text-xs">
                <div>• Capacity Redeployment Event ID: CRE-2024-1108-001</div>
                <div>• Source: Asana Task Completion Webhook (Nov 5, 18:42 UTC)</div>
                <div>• CoD Calculation: Historical launch impact analysis (Q3 2024 baseline)</div>
                <div>• Verification: Project completed 3 days ahead of original due date (Nov 15)</div>
              </div>
            </details>
          </div>

          {/* Tier B Evidence */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-orange-500">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">Tier B</span>
                  <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Lead Triage Automation - Contractor Reduction</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Marketing Operations • Oct 2024 - Ongoing</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500">Validated Savings</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">$18,200</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs mb-3">
              <div>
                <div className="text-gray-600">Hours Saved/Month</div>
                <div className="font-bold text-gray-900">84.5h</div>
              </div>
              <div>
                <div className="text-gray-600">Contractor Rate</div>
                <div className="font-bold text-gray-900">$75/hr</div>
              </div>
              <div>
                <div className="text-gray-600">Period</div>
                <div className="font-bold text-gray-900">3 months</div>
              </div>
              <div>
                <div className="text-gray-600">Evidence Type</div>
                <div className="font-bold text-gray-900">Validated</div>
              </div>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 font-semibold mb-2">View Evidence Chain</summary>
              <div className="bg-white p-2 sm:p-3 rounded border border-gray-200 space-y-1 text-gray-600 text-xs">
                <div>• Block Capacity Source: HubSpot lead.created webhooks (2,847 executions/month)</div>
                <div>• STC Baseline: 1.5 minutes per lead (historical data from Aug 2024)</div>
                <div>• Finance Validation: Contractor invoice reduction confirmed (Oct invoice vs July)</div>
                <div>• Calculation: 84.5h/month × $75/hr × 3 months = $19,012.50 (conservatively $18,200)</div>
              </div>
            </details>
          </div>

          {/* Tier C Evidence */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-gray-400">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded">Tier C</span>
                  <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Enterprise Deal Velocity - POC Support</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Sales Engineering • Deal closed Nov 4, 2024</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500">Attributed Value</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">$9,000</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs mb-3">
              <div>
                <div className="text-gray-600">Capacity Allocated</div>
                <div className="font-bold text-gray-900">18.5 hours</div>
              </div>
              <div>
                <div className="text-gray-600">Deal Value (ARR)</div>
                <div className="font-bold text-gray-900">$180,000</div>
              </div>
              <div>
                <div className="text-gray-600">Attribution %</div>
                <div className="font-bold text-gray-900">5%</div>
              </div>
              <div>
                <div className="text-gray-600">Evidence Type</div>
                <div className="font-bold text-gray-900">Attributed</div>
              </div>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 font-semibold mb-2">View Evidence Chain</summary>
              <div className="bg-white p-2 sm:p-3 rounded border border-gray-200 space-y-1 text-gray-600 text-xs">
                <div>• Deal ID: SFDC-2024-ENT-0842</div>
                <div>• Capacity Allocation: CRE-2024-1022-004 (POC setup acceleration)</div>
                <div>• HubSpot deal.stage progression: Demo → POC → Verbal within 12 days (avg: 28 days)</div>
                <div>• Conservative Attribution: 5% of $180K ARR = $9,000 (acknowledging multiple factors)</div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Pilot Exit Criteria */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-4">90-Day Pilot Exit Criteria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Verified ROI</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Target: $40,000</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">$127,450</div>
            <div className="text-xs text-green-700 font-semibold mt-1">318% of target ✓</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Evidence Depth</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Required: 2+ tiers</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">3 Tiers</div>
            <div className="text-xs text-green-700 font-semibold mt-1">Tier A + B + C ✓</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold sm:font-bold text-xs sm:text-sm text-gray-900">Security Audit</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Read-only scope verified</div>
            <div className="text-xs sm:text-sm font-bold text-green-600">Passed</div>
            <div className="text-xs text-green-700 font-semibold mt-1">IT approved 11/01 ✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
