import { useEffect, useState } from 'react';
import { JiraDataState, subscribeToJiraDataState, getJiraDataState, syncJiraDataWithDB } from '@/lib/jiraDataService';
import { getCurrentOrgId } from '@/lib/orgContext';

export function useJiraDataSync() {
  const [state, setState] = useState<JiraDataState>(getJiraDataState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = subscribeToJiraDataState((newState) => {
      setState(newState);
    });

    // Trigger initial sync if not already initialized
    const orgId = getCurrentOrgId();
    if (orgId && !state.isInitialized && !state.isLoading) {
      syncJiraDataWithDB(orgId).catch(err => {
        console.error('[useJiraDataSync] Sync failed:', err);
      });
    }

    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook to trigger a manual sync
 */
export function useJiraDataSyncManual() {
  const [state, setState] = useState<JiraDataState>(getJiraDataState());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToJiraDataState((newState) => {
      setState(newState);
      if (newState.isLoading) {
        setProgress(20);
      } else {
        setProgress(100);
      }
    });

    return unsubscribe;
  }, []);

  const sync = async () => {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      console.warn('[useJiraDataSyncManual] No org ID available');
      return;
    }

    setProgress(10);
    return syncJiraDataWithDB(orgId);
  };

  return { state, progress, sync };
}
