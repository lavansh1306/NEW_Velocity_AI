// src/hooks/useJiraConnection.ts
// Custom hook for managing Jira connection state and operations

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface JiraConnectionState {
  connected: boolean;
  cloudId: string | null;
  siteName: string | null;
  siteUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function useJiraConnection() {
  const [state, setState] = useState<JiraConnectionState>({
    connected: false,
    cloudId: null,
    siteName: null,
    siteUrl: null,
    loading: true,
    error: null,
  });

  const [connectingJira, setConnectingJira] = useState(false);
  const [disconnectingJira, setDisconnectingJira] = useState(false);

  // Check current Jira connection status
  const checkStatus = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/jira/auth/status', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to check Jira status');
      }

      const data = await response.json();
      
      setState({
        connected: data.connected === true,
        cloudId: data.site?.id || null,
        siteName: data.site?.name || null,
        siteUrl: data.site?.url || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking Jira status:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Fetch initial status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Connect to Jira
  const connect = useCallback(async () => {
    try {
      setConnectingJira(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in first');
        return;
      }

      // Redirect to Jira OAuth
      window.location.href = `/api/jira/auth/connect?supabaseUserId=${user.id}`;
    } catch (error) {
      console.error('Error starting Jira connection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Jira');
      setConnectingJira(false);
    }
  }, []);

  // Disconnect from Jira
  const disconnect = useCallback(async () => {
    try {
      setDisconnectingJira(true);
      
      const response = await fetch('/api/jira/auth/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from Jira');
      }

      // Refresh status
      await checkStatus();
      toast.success('Jira account disconnected');
    } catch (error) {
      console.error('Error disconnecting from Jira:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect');
    } finally {
      setDisconnectingJira(false);
    }
  }, [checkStatus]);

  return {
    state,
    connectingJira,
    disconnectingJira,
    connect,
    disconnect,
    checkStatus,
  };
}
