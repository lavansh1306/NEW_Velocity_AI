import React from 'react';
import { RecommendationCard } from './RecommendationCard';
import { PredictionResult } from './types';
import { PieChart, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

interface ProjectCheckDashboardProps {
  results: PredictionResult[];
}

export const ProjectCheckDashboard: React.FC<ProjectCheckDashboardProps> = ({ results }) => {
  
  const highMatch = results.filter(r => r.score > 85).length;
  const mediumMatch = results.filter(r => r.score > 70 && r.score <= 85).length;
  
  return (
    <div className="space-y-8">
      
      {/* 1. Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{results.length}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Candidates Found</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{highMatch}</div>
            {/* FIX: Changed > to &gt; */}
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Strong Matches (&gt;85%)</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{mediumMatch}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Potential Fits</div>
          </div>
        </div>
      </div>

      {/* 2. Results Grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-gray-400" />
          AI Recommendations
        </h3>
        
        {results.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500">No matching talent found for these requirements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {results.map((res, idx) => (
              <RecommendationCard key={idx} result={res} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};