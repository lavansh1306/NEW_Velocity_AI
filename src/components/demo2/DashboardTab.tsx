import React, { useEffect, useState } from 'react';
import { loadAllMetrics, computeAllBlockedHours } from '@/lib/dataService';
import { apiUrl } from '@/lib/api';
import { ManagerGantt } from '@/components/jira';
import { fetchAllIssuesHybrid } from '@/lib/jiraDbClient';
import type { Issue } from '@/components/jira/types';

export default function DashboardTab() {
  const [totalReturns, setTotalReturns] = useState<number | null>(null);
  const [blockedHours, setBlockedHours] = useState<number | null>(null);
  const [aiSavedHours, setAiSavedHours] = useState<number | null>(null);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [jiraIssues, setJiraIssues] = useState<Issue[]>([]);
  const [loadingJira, setLoadingJira] = useState(false);

  // Check for storeKey changes (indicates auth happened)
  useEffect(() => {
    const checkStoreKey = () => {
      const storeKey = localStorage.getItem('hubspot_storeKey')
      if (storeKey) {
        // Auth detected, trigger refetch
        setRefetchTrigger(prev => prev + 1)
      }
    }
    window.addEventListener('storage', checkStoreKey)
    return () => window.removeEventListener('storage', checkStoreKey)
  }, [])

  useEffect(() => {
    let mounted = true;
    loadAllMetrics()
      .then((m) => {
        if (!mounted) return;
        setTotalReturns((m as any).totalReturns ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setTotalReturns(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingBlocked(true);
    computeAllBlockedHours()
      .then((val) => {
        if (!mounted) return;
        setBlockedHours(val);
      })
      .catch(() => {
        if (!mounted) return;
        setBlockedHours(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingBlocked(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingAI(true);
    hubspotFetch(apiUrl('/api/hubspot/ai-metrics'))
      .then((res) => {
        if (!mounted) return;
        if (!res.ok) throw new Error('Failed to fetch AI metrics');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setAiSavedHours(data.totalTimeSavedHours ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[DashboardTab] AI metrics error:', err)
        setAiSavedHours(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingAI(false);
      });

    return () => {
      mounted = false;
    };
  }, [refetchTrigger]);

  // Fetch all Jira issues from all projects
  useEffect(() => {
    let mounted = true;
    setLoadingJira(true);
    
    const fetchAllJiraIssues = async () => {
      try {
        const { issues: allIssues, source } = await fetchAllIssuesHybrid();
        console.log(`[DashboardTab] Loaded ${allIssues.length} issues from ${source}`);

        if (mounted) {
          setJiraIssues(allIssues);
        }
      } catch (err) {
        console.error('[DashboardTab] Error fetching Jira data:', err);
        if (mounted) {
          setJiraIssues([]);
        }
      } finally {
        if (mounted) {
          setLoadingJira(false);
        }
      }
    };

    fetchAllJiraIssues();
    
    return () => {
      mounted = false;
    };
  }, []);

  function formatLargeUSD(v: number | null | undefined) {
    if (v == null) return '—';
    const isNegative = v < 0;
    const absVal = Math.abs(v);
    const formatted = `$${Math.round(absVal).toLocaleString()}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  return (
    <div>
      {/* Pilot Overview removed */}

      {/* Capacity/Recent activity removed */}

      {/* Jira Manager Gantt Chart */}
      {jiraIssues.length > 0 && (
        <div className="mt-8 sm:mt-10">
          {loadingJira ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-600">Loading Jira Gantt...</p>
            </div>
          ) : (
            <ManagerGantt tasks={jiraIssues} />
          )}
        </div>
      )}
    </div>
  );
}
