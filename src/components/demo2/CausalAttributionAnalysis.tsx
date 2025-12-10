export default function CausalAttributionAnalysis() {
  const attributions = [
    {
      title: 'Mobile App Launch',
      deployed: '240h deployed',
      metric: 'Pipeline Value',
      method: 'Diff-in-Diff',
      impact: '+$680K',
      confidence: 92,
      impactColor: 'text-green-600',
    },
    {
      title: 'Customer Portal',
      deployed: '160h deployed',
      metric: 'CSAT Score',
      method: 'Causal Inference',
      impact: '+9 points',
      confidence: 88,
      impactColor: 'text-green-600',
    },
    {
      title: 'API Optimization',
      deployed: '120h deployed',
      metric: 'Cycle Time',
      method: 'Regression Analysis',
      impact: '-2.3 days',
      confidence: 91,
      impactColor: 'text-green-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Causal Attribution Analysis</h3>
      
      <div className="space-y-4">
        {attributions.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    {item.deployed}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Metric: {item.metric}</span>
                  <span>•</span>
                  <span>Method: {item.method}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-3xl font-bold ${item.impactColor}`}>
                    {item.impact}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.confidence}% confidence
                  </div>
                </div>
                
                {/* Circular Progress Indicator */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#3b82f6"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - item.confidence / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{item.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
