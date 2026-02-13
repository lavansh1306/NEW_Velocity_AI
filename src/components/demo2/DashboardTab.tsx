import React, { useEffect, useState } from 'react';
import { loadAllMetrics, computeAllBlockedHours } from '@/lib/dataService';
import { apiUrl } from '@/lib/api';
import { ManagerGantt } from '@/components/jira';
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
        // First, fetch all available projects
        const projectsResponse = await fetch(apiUrl('/api/jira/projects'), { credentials: 'include' });
        
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects list');
        }
        
        const projectsData = await projectsResponse.json();
        const projects = Array.isArray(projectsData) ? projectsData : (projectsData.projects || projectsData || []);
        
        console.log('[DashboardTab] Found projects:', projects);
        
        // If no projects, try default fetch
        if (!projects || projects.length === 0) {
          console.warn('[DashboardTab] No projects found, attempting default fetch');
          const defaultResponse = await fetch(apiUrl(`/api/jira/issues?_t=${Date.now()}`), { credentials: 'include' });
          if (defaultResponse.ok) {
            const defaultData = await defaultResponse.json();
            const issues = defaultData.issues || [];
            if (mounted && issues.length > 0) {
              setJiraIssues(issues);
            }
          } else {
            const txt = await defaultResponse.text().catch(() => '')
            console.warn('[DashboardTab] Default fetch failed with status', defaultResponse.status, txt)
          }
          return;
        }

        // Extract project keys
        const projectKeys = projects.map((p: any) => {
          if (typeof p === 'string') return p;
          return p.key || p.id || p.name;
        }).filter((k: string) => !!k);

        console.log('[DashboardTab] Project keys to fetch:', projectKeys);

        // Fetch issues from each project
        const allIssues: any[] = [];
        for (const projectKey of projectKeys) {
          try {
            const encodedKey = encodeURIComponent(String(projectKey))
            const issuesResponse = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodedKey}&_t=${Date.now()}`), { credentials: 'include' });
            if (issuesResponse.ok) {
              const issuesData = await issuesResponse.json();
              const issues = issuesData.issues || [];
              console.log(`[DashboardTab] Fetched ${issues.length} issues from ${projectKey}`);
              allIssues.push(...issues);
            } else {
              const txt = await issuesResponse.text().catch(() => '')
              console.warn(`[DashboardTab] Failed to fetch issues from ${projectKey}:`, issuesResponse.status, txt);
            }
          } catch (err) {
            console.warn(`[DashboardTab] Error fetching issues from ${projectKey}:`, err);
          }
        }

        if (mounted) {
          console.log('[DashboardTab] Total issues collected:', allIssues.length);
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
