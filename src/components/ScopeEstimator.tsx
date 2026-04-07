import React, { useState } from 'react';
import { getDashboardData } from '@/services/dashboardService';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';

interface EstimateResult {
  estimatedTasks: number;
  totalHours: number;
  availableCapacityPerWeek: number;
  realisticWeeks: number;
  confidence: number;
  breakdown: string;
}

interface ScopeEstimatorProps {
  projectDescription: string;
  projectTitle: string;
}

export const ScopeEstimator: React.FC<ScopeEstimatorProps> = ({ projectDescription, projectTitle }) => {
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleEstimate = async () => {
    if (!projectDescription.trim() && !projectTitle.trim()) return;
    setLoading(true);
    try {
      // Get real team capacity from dashboard
      const dashData = await getDashboardData() as any;
      const capacityKpi = dashData?.kpis?.find((k: any) => k.label === 'AVAILABLE CAPACITY');
      const availableHours = parseInt(capacityKpi?.value?.replace('h', '') || '40');

      // Estimate based on description complexity (word count + complexity keywords)
      const text = (projectTitle + ' ' + projectDescription).toLowerCase();
      const words = text.split(/\s+/).length;
      const complexityKeywords = ['integration', 'api', 'database', 'authentication', 'dashboard', 'real-time', 'mobile', 'payment', 'security', 'ml', 'ai'];
      const complexityScore = complexityKeywords.filter(k => text.includes(k)).length;

      // Base estimate: 1 task per 20 words, adjusted for complexity
      const baseTasks = Math.max(5, Math.round(words / 15));
      const adjustedTasks = baseTasks + (complexityScore * 2);
      const hoursPerTask = 6 + (complexityScore * 0.5);
      const totalHours = Math.round(adjustedTasks * hoursPerTask);
      const weeklyCapacity = availableHours > 0 ? availableHours : 30;
      const weeks = Math.ceil(totalHours / weeklyCapacity);
      const confidence = Math.max(50, Math.min(92, 85 - (complexityScore * 3) - (words < 20 ? 20 : 0)));

      setEstimate({
        estimatedTasks: adjustedTasks,
        totalHours,
        availableCapacityPerWeek: weeklyCapacity,
        realisticWeeks: weeks,
        confidence,
        breakdown: `Based on ${words} words of description with ${complexityScore} complex integration point${complexityScore !== 1 ? 's' : ''} detected.`,
      });
      setExpanded(true);
    } catch (e) {
      console.error('Scope estimate error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={estimate ? () => setExpanded(!expanded) : handleEstimate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-gray-600 hover:text-primary disabled:opacity-50"
      >
        <Calculator className="w-4 h-4" />
        {loading ? 'Estimating...' : 'Estimate Timeline'}
        {estimate && (expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {expanded && estimate && (
        <div className="mt-3 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Based on your team capacity</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Estimated tasks', value: estimate.estimatedTasks.toString() },
              { label: 'Total hours', value: `${estimate.totalHours}h` },
              { label: 'Available capacity', value: `${estimate.availableCapacityPerWeek}h/week` },
              { label: 'Realistic delivery', value: `${estimate.realisticWeeks} week${estimate.realisticWeeks !== 1 ? 's' : ''}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-light text-gray-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${estimate.confidence}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-12">{estimate.confidence}%</span>
            <span className="text-xs text-gray-400">confidence</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">{estimate.breakdown}</p>
        </div>
      )}
    </div>
  );
};
