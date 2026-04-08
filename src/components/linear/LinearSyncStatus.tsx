import React, { useEffect, useState } from 'react';
import { getLinearConnectionStatus, triggerLinearSync } from '@/lib/linearClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const LinearSyncStatus: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [issueCount, setIssueCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const orgId = getCurrentOrgId();
      const [status, issuesRes] = await Promise.all([
        getLinearConnectionStatus(),
        orgId
          ? supabase
              .from('linear_issues')
              .select('synced_at', { count: 'exact', head: false })
              .eq('org_id', orgId)
              .order('synced_at', { ascending: false })
              .limit(1)
          : Promise.resolve({ data: [], count: 0, error: null }),
      ]);

      setConnected(status.connected);
      setWorkspaceName(status.workspaceName);
      setIssueCount((issuesRes as any).count || 0);

      const latestSync = (issuesRes as any).data?.[0]?.synced_at;
      if (latestSync) {
        setLastSync(new Date(latestSync).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }));
      }
    } catch (e) {
      console.error('LinearSyncStatus load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerLinearSync();
      if (result.success) {
        toast.success(`Synced ${result.synced} issues from Linear`);
        await load();
      } else {
        toast.error('Sync failed — check Linear connection');
      }
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return null;
  if (!connected) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Health dot */}
        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />

        {/* Linear logo placeholder — purple square */}
        <div className="w-6 h-6 rounded bg-[#5E6AD2] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[9px] font-bold">L</span>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900">
            {workspaceName || 'Linear'}
          </p>
          <p className="text-xs text-gray-400">
            {issueCount > 0
              ? `${issueCount} issues synced${lastSync ? ` · ${lastSync}` : ''}`
              : lastSync
              ? `Last synced ${lastSync}`
              : 'Not yet synced'}
          </p>
        </div>
      </div>

      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all"
      >
        {syncing
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <RefreshCw className="w-3 h-3" />}
        {syncing ? 'Syncing...' : 'Sync now'}
      </button>
    </div>
  );
};
