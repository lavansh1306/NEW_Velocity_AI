import React, { useState, useEffect, useRef } from 'react';
import { Clock, Users, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { EmployeeProfile, LeaveRequest } from './types';

interface CapacityCandidate {
  id: string;
  name: string;
  current_load: number;
  skills: string[];
  role_level: string;
  avg_completion_time: number;
  efficiency_score: number;
  base_productive_hours: number;
  pto_hours_this_week: number;
  holiday_hours_this_week: number;
}

interface CapacityResponse {
  success: boolean;
  timestamp: string;
  summary: {
    total_candidates: number;
    total_base_hours: number;
    total_pto_hours: number;
    total_holiday_hours: number;
    total_available_hours: number;
    available_members: number;
    utilization_rate: number;
  };
  data: Array<{
    employee_id: string;
    name: string;
    base_productive_hours: number;
    pto_hours_this_week: number;
    holiday_hours_this_week: number;
    net_available_hours: number;
    status: 'available' | 'limited' | 'unavailable' | 'full';
  }>;
}

interface CapacityAnalysisProps {
  employees: EmployeeProfile[];
  approvedLeaves: LeaveRequest[];
  onRefresh?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
    case 'full':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'limited':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'unavailable':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'available':
    case 'full':
      return 'bg-green-100 text-green-800';
    case 'limited':
      return 'bg-yellow-100 text-yellow-800';
    case 'unavailable':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CapacityAnalysis: React.FC<CapacityAnalysisProps> = ({ 
  employees, 
  approvedLeaves, 
  onRefresh 
}) => {
  const [capacityData, setCapacityData] = useState<CapacityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('\n=== CAPACITY ANALYSIS UPDATE ===');
    console.log('✓ Employees:', employees.map(e => e.name));
    console.log('✓ Approved Leaves:', approvedLeaves.map(l => `${l.name} (${l.startDate} - ${l.endDate})`));
    setIsRefreshing(true);
    fetchCapacityData();
  }, [employees, approvedLeaves]);

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare candidates data from employees and approved leaves
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      console.log('[CapacityAnalysis] Week range:', weekStart.toLocaleDateString(), '-', weekEnd.toLocaleDateString());

      const candidates: CapacityCandidate[] = employees.map((emp) => {
        // Calculate PTO hours for this week from approved leaves
        let ptoHours = 0;
        approvedLeaves.forEach((leave) => {
          console.log('[CapacityAnalysis] Checking leave for', emp.name, '- Leave:', leave.name, 'Status:', leave.status, 'Dates:', leave.startDate, '-', leave.endDate);
          if (leave.name === emp.name && leave.status === 'Approved') {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);

            // Check if leave overlaps with current week
            if (leaveStart <= weekEnd && leaveEnd >= weekStart) {
              // Calculate overlapping days
              const overlapStart = new Date(Math.max(leaveStart.getTime(), weekStart.getTime()));
              const overlapEnd = new Date(Math.min(leaveEnd.getTime(), weekEnd.getTime()));
              const daysDiff = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              ptoHours += daysDiff * 8; // Assuming 8 hour workdays
              console.log('[CapacityAnalysis] Leave matches! PTO hours for', emp.name, ':', ptoHours);
            }
          }
        });

        return {
          id: emp.name.replace(/\s+/g, '_').toLowerCase(),
          name: emp.name,
          current_load: 0,
          skills: emp.skills || [],
          role_level: emp.role || 'unknown',
          avg_completion_time: 0,
          efficiency_score: 1.0,
          base_productive_hours: 40, // Default 40 hour work week
          pto_hours_this_week: ptoHours,
          holiday_hours_this_week: 0, // Can be updated based on company holidays
        };
      });

      console.log('[CapacityAnalysis] Sending candidates to API:', candidates);

      // Call the capacity analysis endpoint
      const response = await fetch('/api/leave-approval/team-capacity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ candidates }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch capacity data: ${response.statusText}`);
      }

      const data: CapacityResponse = await response.json();
      console.log('[CapacityAnalysis] Response received:', data);
      setCapacityData(data);
      setIsRefreshing(false);
    } catch (err) {
      console.error('[CapacityAnalysis] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch capacity data');
      setIsRefreshing(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !capacityData) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 text-red-800 mb-4">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Capacity Analysis Error</h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => {
            fetchCapacityData();
            onRefresh?.();
          }}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!capacityData) {
    return null;
  }

  const { summary, data } = capacityData;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-light text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Team Capacity Check
            </h3>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              Employees: {employees.length} | Approved Leaves: {approvedLeaves.length} | PTO Hours: {capacityData?.summary.total_pto_hours ?? '—'}h
              {isRefreshing && (
                <span className="flex items-center gap-1 text-blue-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchCapacityData();
              onRefresh?.();
            }}
            disabled={isRefreshing}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
              isRefreshing 
                ? 'bg-blue-100 text-blue-700 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-semibold mb-1">Team Members</p>
            <p className="text-2xl font-bold text-blue-900">{summary.total_candidates}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 font-semibold mb-1">Available</p>
            <p className="text-2xl font-bold text-green-900">{summary.available_members}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-semibold mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-purple-900">{summary.total_available_hours}</p>
            <p className="text-xs text-purple-600 mt-1">/ {summary.total_base_hours} hrs</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-600 font-semibold mb-1">PTO Hours</p>
            <p className="text-2xl font-bold text-yellow-900">{summary.total_pto_hours}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4">
            <p className="text-xs text-indigo-600 font-semibold mb-1">Utilization</p>
            <p className="text-2xl font-bold text-indigo-900">{summary.utilization_rate}%</p>
          </div>
        </div>

        {/* Employee Capacity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Employee</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Base Hours</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">PTO Hours</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Holidays</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Available</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((employee, idx) => (
                <tr
                  key={employee.employee_id}
                  className={`border-b border-slate-100 ${
                    idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                  } hover:bg-slate-100 transition-colors`}
                >
                  <td className="py-3 px-4 font-medium text-slate-900">{employee.name}</td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {employee.base_productive_hours} hrs
                  </td>
                  <td className="text-center py-3 px-4 text-yellow-600 font-semibold">
                    {employee.pto_hours_this_week} hrs
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {employee.holiday_hours_this_week} hrs
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="font-bold text-lg text-slate-900">
                      {employee.net_available_hours} hrs
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(employee.status)}`}>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Capacity Note</p>
          <p>
            Available hours are calculated as: Base Hours - PTO - Holidays. This data updates automatically 
            when managers approve or reject leave requests.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CapacityAnalysis;
