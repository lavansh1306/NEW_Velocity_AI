import React, { useMemo } from 'react';
import { AlertTriangle, Lightbulb, TrendingDown, Users, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { generateProjectInsights, type TaskData, type TeamMemberData, type ProjectInsights } from './InsightsGenerator';

interface AIInsightsProps {
  tasks: TaskData[];
  teamMembers: TeamMemberData[];
  loading?: boolean;
  projectName?: string;
}

const getRiskIcon = (level: string) => {
  switch (level) {
    case 'critical':
      return AlertTriangle;
    case 'warning':
      return Clock;
    default:
      return Info;
  }
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-700'
      };
    case 'warning':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700'
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700'
      };
  }
};

export const AIInsights: React.FC<AIInsightsProps> = ({
  tasks,
  teamMembers,
  loading = false,
  projectName = 'Project'
}) => {
  const insights = useMemo(() => {
    return generateProjectInsights(tasks, teamMembers);
  }, [tasks, teamMembers]);

  // Empty state
  if (!insights.hasData || tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Not enough data</h3>
            <p className="text-sm text-gray-600">Add tasks with dates and assignees to generate insights</p>
          </div>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(insights.riskLevel);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className={`rounded-2xl border-2 ${riskColor.border} ${riskColor.bg} p-6 shadow-sm`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${riskColor.badge}`}>
              {insights.riskLevel === 'critical' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : insights.riskLevel === 'warning' ? (
                <Clock className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${riskColor.text}`}>
                {insights.riskLevel === 'critical' && '🚨 Critical Issues Detected'}
                {insights.riskLevel === 'warning' && '⚠️ Attention Needed'}
                {insights.riskLevel === 'healthy' && '✅ Project is Healthy'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {insights.summary.completionPercentage}% complete  
                {insights.summary.overdueTasks > 0 && ` • ${insights.summary.overdueTasks} overdue`}
                {insights.summary.atRiskTasks > 0 && ` • ${insights.summary.atRiskTasks} at risk`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{insights.summary.completionPercentage}%</p>
            <p className="text-xs text-gray-500 mt-1">{insights.summary.completedTasks}/{insights.summary.totalTasks} tasks</p>
          </div>
        </div>
      </div>

      {/* Risk Detection */}
      {insights.risks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-50 p-2 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Issues Detected</h3>
            <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              {insights.risks.length}
            </span>
          </div>

          <div className="space-y-3">
            {insights.risks.map((risk, idx) => {
              const RiskIcon = getRiskIcon(risk.level);
              const colors = getRiskColor(risk.level);

              return (
                <div key={idx} className={`border-l-4 ${colors.border} ${colors.bg} p-4 rounded-lg`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-1`}>
                      <div className={`w-5 h-5 rounded-full ${colors.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-semibold text-sm ${colors.text}`}>
                            {risk.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                        </div>
                        {risk.metric && (
                          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${colors.badge} whitespace-nowrap`}>
                            {risk.metric}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
            <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              {insights.recommendations.length}
            </span>
          </div>

          <ul className="space-y-3">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-sm leading-relaxed">
                <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">→</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No risks detected */}
      {insights.risks.length === 0 && insights.recommendations.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No major issues</h3>
          <p className="text-sm text-gray-600 mt-2">Your project is on track with no critical risks or blockers detected.</p>
        </div>
      )}

      {/* Detailed Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 uppercase">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{insights.summary.totalTasks}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 uppercase">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{insights.summary.completedTasks}</p>
          </div>

          {insights.summary.overdueTasks > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 uppercase">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{insights.summary.overdueTasks}</p>
            </div>
          )}

          {insights.summary.atRiskTasks > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 uppercase">At Risk</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{insights.summary.atRiskTasks}</p>
            </div>
          )}

          {insights.summary.overloadedMembers > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 uppercase">Overloaded</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{insights.summary.overloadedMembers}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
