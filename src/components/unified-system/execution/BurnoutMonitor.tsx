import React from 'react';
import { UnifiedEmployee } from '../types';
import { Activity, AlertTriangle, TrendingDown } from 'lucide-react';

interface BurnoutMonitorProps {
  team: UnifiedEmployee[];
}

export const BurnoutMonitor: React.FC<BurnoutMonitorProps> = ({ team }) => {
  // Logic: Calculate Team Health Score
  const overloadedMembers = team.filter(e => e.currentLoad > 80);
  const projectHealth = 100 - (overloadedMembers.length * 15); 
  const isAtRisk = projectHealth < 70;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" /> Team Pulse
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-bold ${isAtRisk ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isAtRisk ? 'Risk Detected' : 'Healthy Pace'}
        </span>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        {team.map(emp => {
          const isOverloaded = emp.currentLoad > 80;
          const hoursLogged = isOverloaded ? (8 + Math.random() * 2).toFixed(1) : (6 + Math.random() * 2).toFixed(1);

          return (
            <div key={emp.id} className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">{emp.name}</span>
                <span className={`text-xs ${isOverloaded ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {hoursLogged}h / 8h
                </span>
              </div>
              
              {/* Load Bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 ${isOverloaded ? 'bg-amber-500' : 'bg-emerald-400'}`} 
                  style={{ width: `${Math.min(emp.currentLoad, 100)}%` }}
                />
                {isOverloaded && (
                  <div className="h-full bg-red-500 w-[10%] animate-pulse" title="Overtime Risk" />
                )}
              </div>

              {isOverloaded && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-medium animate-in slide-in-from-left-2">
                  <AlertTriangle className="w-3 h-3" /> Risk of burnout
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
          <TrendingDown className="w-5 h-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase">AI Recommendation</p>
            <p className="text-xs text-slate-500 mt-1">
              {overloadedMembers.length > 0 
                ? `Consider redistributing tasks from ${overloadedMembers[0].name} to balance load.`
                : "Workload distribution is optimal. No actions needed."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};