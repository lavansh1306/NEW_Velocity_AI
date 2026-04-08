import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';
import { getDashboardData } from '@/services/dashboardService';
import { Calculator, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface EstimateResult {
  estimatedTasks: number;
  totalHours: number;
  availableCapacityPerWeek: number;
  realisticWeeks: number;
  confidence: number;
  breakdown: string;
}

interface ScopeEstimatorProps {
  // Standalone mode — no props needed
  projectDescription?: string;
  projectTitle?: string;
}

export const ScopeEstimator: React.FC<ScopeEstimatorProps> = ({
  projectDescription: propDescription,
  projectTitle: propTitle,
}) => {
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Standalone mode state
  const isStandalone = !propDescription && !propTitle;
  const [projects, setProjects] = useState<{ id: string; name: string; description: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (!isStandalone) return;
    const load = async () => {
      setProjectsLoading(true);
      const orgId = getCurrentOrgId();
      if (!orgId) return;
      try {
        const { data } = await supabase
          .from('projects')
          .select('id, name, description')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .limit(20);
        setProjects(data || []);
      } catch (e) {
        console.error('ScopeEstimator projects error:', e);
      } finally {
        setProjectsLoading(false);
      }
    };
    load();
  }, [isStandalone]);

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    setEstimate(null);
    setExpanded(false);
    const project = projects.find(p => p.id === id);
    if (project) {
      setManualTitle(project.name);
      setManualDescription(project.description || '');
    }
  };

  const getActiveTitle = () => propTitle || manualTitle;
  const getActiveDescription = () => propDescription || manualDescription;

  const handleEstimate = async () => {
    const title = getActiveTitle();
    const description = getActiveDescription();
    if (!title.trim() && !description.trim()) return;

    setLoading(true);
    try {
      const dashData = (await getDashboardData()) as any;
      const capacityKpi = dashData?.kpis?.find(
        (k: any) => k.label === 'AVAILABLE CAPACITY'
      );
      const availableHours = parseInt(
        capacityKpi?.value?.replace('h', '') || '40'
      );

      const text = (title + ' ' + description).toLowerCase();
      const words = text.split(/\s+/).length;
      const complexityKeywords = [
        'integration', 'api', 'database', 'authentication', 'dashboard',
        'real-time', 'mobile', 'payment', 'security', 'ml', 'ai',
      ];
      const complexityScore = complexityKeywords.filter(k => text.includes(k)).length;

      const baseTasks = Math.max(5, Math.round(words / 15));
      const adjustedTasks = baseTasks + complexityScore * 2;
      const hoursPerTask = 6 + complexityScore * 0.5;
      const totalHours = Math.round(adjustedTasks * hoursPerTask);
      const weeklyCapacity = availableHours > 0 ? availableHours : 30;
      const weeks = Math.ceil(totalHours / weeklyCapacity);
      const confidence = Math.max(
        50,
        Math.min(92, 85 - complexityScore * 3 - (words < 20 ? 20 : 0))
      );

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

  // Standalone card wrapper
  if (isStandalone) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-gray-900">Scope Estimator</h3>
          <span className="text-xs text-gray-400 ml-1">
            — "How long will this take?"
          </span>
        </div>

        <div className="p-5 space-y-3">
          {/* Project picker */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={e => handleProjectSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-700"
            >
              <option value="">Pick an existing project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Or manual entry */}
          <div className="text-xs text-gray-400 text-center">
            {projects.length > 0 ? '— or describe a new project —' : 'Describe your project'}
          </div>
          <input
            value={manualTitle}
            onChange={e => {
              setManualTitle(e.target.value);
              setEstimate(null);
            }}
            placeholder="Project title (e.g. Customer portal redesign)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-300"
          />
          <textarea
            value={manualDescription}
            onChange={e => {
              setManualDescription(e.target.value);
              setEstimate(null);
            }}
            placeholder="Describe what needs to be built — the more detail, the better the estimate…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-300 resize-none"
          />

          <button
            onClick={estimate ? () => setExpanded(!expanded) : handleEstimate}
            disabled={loading || (!manualTitle.trim() && !manualDescription.trim())}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 w-full justify-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {loading
              ? 'Estimating…'
              : estimate
              ? expanded
                ? 'Hide estimate'
                : 'Show estimate'
              : 'Estimate Timeline'}
            {estimate &&
              (expanded ? (
                <ChevronUp className="w-3 h-3 ml-auto" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-auto" />
              ))}
          </button>

          {expanded && estimate && <EstimateResultCard estimate={estimate} />}
        </div>
      </div>
    );
  }

  // Inline mode (used inside project detail pages with props)
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
        {estimate &&
          (expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          ))}
      </button>

      {expanded && estimate && (
        <div className="mt-3">
          <EstimateResultCard estimate={estimate} />
        </div>
      )}
    </div>
  );
};

const EstimateResultCard: React.FC<{ estimate: EstimateResult }> = ({ estimate }) => (
  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
      Based on your team capacity
    </p>
    <div className="grid grid-cols-2 gap-3 mb-4">
      {[
        { label: 'Estimated tasks', value: estimate.estimatedTasks.toString() },
        { label: 'Total hours', value: `${estimate.totalHours}h` },
        { label: 'Available capacity', value: `${estimate.availableCapacityPerWeek}h/week` },
        {
          label: 'Realistic delivery',
          value: `${estimate.realisticWeeks} week${estimate.realisticWeeks !== 1 ? 's' : ''}`,
        },
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
);
