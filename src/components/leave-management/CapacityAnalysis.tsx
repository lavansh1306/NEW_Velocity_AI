import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, RefreshCw, BarChart3, CalendarCheck } from 'lucide-react';
import { EmployeeProfile, LeaveRequest } from './types';

interface CapacityCandidate {
  id: string;
  name: string;
  role: string;
  base_hours: number;
  pto_hours: number;
  net_available: number;
  utilization: number;
  status: 'available' | 'limited' | 'unavailable' | 'overloaded';
}

interface CapacityAnalysisProps {
  employees: EmployeeProfile[];
  approvedLeaves: LeaveRequest[];
  onRefresh?: () => void;
}

export const CapacityAnalysis: React.FC<CapacityAnalysisProps> = ({ 
  employees, 
  approvedLeaves, 
  onRefresh 
}) => {
  const [candidates, setCandidates] = useState<CapacityCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper: Get current week range (Mon-Sun)
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const calculateCapacity = () => {
    setLoading(true);
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const results = employees.map(emp => {
      // 1. Get Base Capacity from DB Profile (default to 40 if missing)
      const baseHours = emp.capacity_hours_per_week || 40;

      // 2. Calculate PTO Hours for this week
      // Filter leaves that belong to this user AND are approved
      const userLeaves = approvedLeaves.filter(l => 
        l.user_id === emp.id && l.status === 'approved'
      );

      let ptoHours = 0;

      userLeaves.forEach(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        
        // Check for overlap
        if (leaveStart <= weekEnd && leaveEnd >= weekStart) {
          // Calculate intersection
          const start = new Date(Math.max(leaveStart.getTime(), weekStart.getTime()));
          const end = new Date(Math.min(leaveEnd.getTime(), weekEnd.getTime()));
          
          // Count distinct days (inclusive)
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // Assuming 8 hours per day standard deduction
          ptoHours += days * 8;
        }
      });

      // Cap PTO at base hours (can't have negative availability)
      ptoHours = Math.min(ptoHours, baseHours);

      const netAvailable = baseHours - ptoHours;
      const utilization = Math.round((ptoHours / baseHours) * 100);

      let status: CapacityCandidate['status'] = 'available';
      if (netAvailable === 0) status = 'unavailable';
      else if (netAvailable < baseHours * 0.5) status = 'limited';
      
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role || 'Member',
        base_hours: baseHours,
        pto_hours: ptoHours,
        net_available: netAvailable,
        utilization,
        status
      };
    });

    setCandidates(results);
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    calculateCapacity();
  }, [employees, approvedLeaves]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    // Re-calc triggers automatically via useEffect when props change
    // but we can force a local recalc timeout for UX
    setTimeout(calculateCapacity, 500); 
  };

  // Aggregates
  const totalBase = candidates.reduce((sum, c) => sum + c.base_hours, 0);
  const totalPTO = candidates.reduce((sum, c) => sum + c.pto_hours, 0);
  const totalAvailable = totalBase - totalPTO;
  const teamUtilization = totalBase > 0 ? Math.round((totalPTO / totalBase) * 100) : 0;

  if (loading && candidates.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-light animate-pulse">Calculating team workload...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-light text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Weekly Capacity Analysis
            </h3>
            <p className="text-sm text-slate-500 font-light mt-1">
              Real-time availability based on approved leave requests.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${
              isRefreshing 
                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh Data'}
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Total Capacity</div>
            <div className="text-2xl font-light text-slate-900">{totalBase}h</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Approved PTO</div>
            <div className="text-2xl font-light text-slate-900">{totalPTO}h</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Net Available</div>
            <div className="text-2xl font-light text-slate-900">{totalAvailable}h</div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Team Load</div>
            <div className="text-2xl font-light text-slate-900">{teamUtilization}%</div>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-4 px-6 font-medium text-slate-600">Employee</th>
                <th className="text-center py-4 px-6 font-medium text-slate-600">Role</th>
                <th className="text-center py-4 px-6 font-medium text-slate-600">Base</th>
                <th className="text-center py-4 px-6 font-medium text-amber-600">PTO Hit</th>
                <th className="text-center py-4 px-6 font-medium text-emerald-600">Available</th>
                <th className="text-center py-4 px-6 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-light">
                    No active employees found in this organization.
                  </td>
                </tr>
              ) : (
                candidates.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {emp.name.substring(0,2).toUpperCase()}
                      </div>
                      {emp.name}
                    </td>
                    <td className="text-center py-4 px-6 text-slate-500 font-light">{emp.role}</td>
                    <td className="text-center py-4 px-6 text-slate-600">{emp.base_hours}h</td>
                    <td className="text-center py-4 px-6 font-medium text-amber-600">
                      {emp.pto_hours > 0 ? `-${emp.pto_hours}h` : '—'}
                    </td>
                    <td className="text-center py-4 px-6 font-bold text-slate-800">
                      {emp.net_available}h
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${emp.status === 'available' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${emp.status === 'limited' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${emp.status === 'unavailable' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-500 flex items-center gap-2">
           <AlertCircle className="w-4 h-4 text-slate-400" />
           Calculations reflect the current work week. Managers can approve leaves to see instant updates.
        </div>
      </div>
    </div>
  );
};