import React from 'react';
import { PredictionResult } from './types';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, CalendarOff } from 'lucide-react';

export const RecommendationCard: React.FC<{ result: PredictionResult }> = ({ result }) => {
  return (
    <Card className="p-4 border-l-4 border-l-indigo-500 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        
        {/* Profile Info */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg">
            {result.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              {result.name}
              {result.matchScore > 85 && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Top Pick</Badge>}
            </h4>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <span className="font-medium text-indigo-600">{result.topSkill}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs">{result.reason}</span>
            </div>
          </div>
        </div>

        {/* Score Ring */}
        <div className="text-right">
          <div className="text-2xl font-black text-indigo-600">{result.matchScore}%</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fit Score</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        
        {/* Metric 1: Availability */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            Availability
          </div>
          <div className="flex items-center gap-2">
            {result.isAvailable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-bold ${result.isAvailable ? 'text-emerald-700' : 'text-red-700'}`}>
              {result.isAvailable ? 'Available' : 'Overloaded'}
            </span>
          </div>
          <div className="text-[10px] text-gray-400">
            {result.currentLoad} Active Projects
          </div>
        </div>

        {/* Metric 2: Efficiency */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Efficiency
          </div>
          <div className="text-sm font-bold text-slate-700">
            {(result.efficiency * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, result.efficiency * 100)}%` }}></div>
          </div>
        </div>

        {/* Metric 3: Absence Probability */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <CalendarOff className="w-3 h-3" /> Absence Risk
          </div>
          <div className="flex items-center gap-2">
            {result.absenceProbability > 15 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span className={`text-sm font-bold ${result.absenceProbability > 15 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {result.absenceProbability}%
            </span>
          </div>
          <div className="text-[10px] text-gray-400">
            Based on past logs
          </div>
        </div>

      </div>
    </Card>
  );
};