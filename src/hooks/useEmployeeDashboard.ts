import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  EmpDashboardTask,
  EmpDashboardAlert,
  EmpDashboardActivity,
} from '@/types';

interface EmployeeDashboardData {
  tasks: EmpDashboardTask[];
  alerts: EmpDashboardAlert[];
  activities: EmpDashboardActivity[];
  holidays: { id: string; name: string; date: string } | null;
  userName: string;
  projects: any[];
}

interface UseEmployeeDashboardReturn {
  data: EmployeeDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch employee dashboard data from the API
 * Layer 2: Service Layer - calls the API endpoint
 */
export function useEmployeeDashboard(): UseEmployeeDashboardReturn {
  const { user, orgId } = useAuth();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/employee/dashboard?userId=${user.id}&orgId=${orgId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add Authorization header if needed
            'Authorization': `Bearer ${user.id}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result: EmployeeDashboardData = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error fetching employee dashboard:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount or when user/orgId changes
  useEffect(() => {
    if (user?.id && orgId) {
      fetchData();
    }
  }, [user?.id, orgId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
