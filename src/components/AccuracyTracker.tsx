import { Target } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AccuracyStats {
  totalSuggestions: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  thisWeekRate: number;
  trend: 'up' | 'down' | 'flat';
}

interface AccuracyTrackerProps {
  suggestions: any[];
}

export const AccuracyTracker: React.FC<AccuracyTrackerProps> = ({ suggestions }) => {
  const [stats, setStats] = useState<AccuracyStats | null>(null);

  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return;

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const all = suggestions.filter(s => new Date(s.created_at) >= twoWeeksAgo);
    if (!all.length) return;

    const approved = all.filter(s => s.status === 'approved').length;
    const rejected = all.filter(s => s.status === 'rejected').length;
    const total = approved + rejected;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    // This week vs last week
    const thisWeek = all.filter(s => new Date(s.created_at) >= oneWeekAgo);
    const lastWeek = all.filter(s => new Date(s.created_at) < oneWeekAgo);

    const thisWeekApproved = thisWeek.filter(s => s.status === 'approved').length;
    const thisWeekTotal = thisWeek.filter(s => s.status === 'approved' || s.status === 'rejected').length;
    const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekApproved / thisWeekTotal) * 100) : 0;

    const lastWeekApproved = lastWeek.filter(s => s.status === 'approved').length;
    const lastWeekTotal = lastWeek.filter(s => s.status === 'approved' || s.status === 'rejected').length;
    const lastWeekRate = lastWeekTotal > 0 ? Math.round((lastWeekApproved / lastWeekTotal) * 100) : 0;

    const trend = thisWeekRate > lastWeekRate + 5 ? 'up' : thisWeekRate < lastWeekRate - 5 ? 'down' : 'flat';

    setStats({ totalSuggestions: all.length, approvedCount: approved, rejectedCount: rejected, approvalRate, thisWeekRate, trend });
  }, [suggestions]);

  if (!stats || stats.totalSuggestions < 3) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-gray-900">AI Recommendation Accuracy</h3>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
          stats.trend === 'up' ? 'bg-green-100 text-green-700' :
          stats.trend === 'down' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {stats.trend === 'up' ? '↑ Improving' : stats.trend === 'down' ? '↓ Declining' : '→ Stable'}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <p className="text-4xl font-light text-gray-900">{stats.approvalRate}%</p>
        <p className="text-sm text-gray-400 mb-1">approval rate</p>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-primary rounded-full" style={{ width: `${stats.approvalRate}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{stats.approvedCount} approved · {stats.rejectedCount} rejected</span>
        <span>This week: {stats.thisWeekRate}%</span>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Based on {stats.totalSuggestions} AI suggestions in the last 2 weeks
      </p>
    </div>
  );
};
