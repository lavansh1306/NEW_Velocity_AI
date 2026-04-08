import React, { useEffect, useState } from 'react';
import { getLinearConnectionStatus } from '@/lib/linearClient';
import { apiUrl } from '@/lib/api';
import { getCurrentOrgId } from '@/lib/orgContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

interface LinearConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const LinearConnect: React.FC<LinearConnectProps> = ({ onConnectionChange }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const status = await getLinearConnectionStatus();
      setConnected(status.connected);
      setWorkspaceName(status.workspaceName);
      onConnectionChange?.(status.connected);
    } catch (e) {
      console.error('LinearConnect status error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setConnecting(true);
    // Store that we initiated Linear login so we can sync on return
    sessionStorage.setItem('linearLoginInitiated', 'true');
    const userId = user?.id;
    const qs = userId ? `?supabaseUserId=${encodeURIComponent(userId)}` : '';
    window.location.href = `${window.location.origin}/api/linear/auth/connect${qs}`;
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const orgId = getCurrentOrgId();
      await fetch(apiUrl('/api/linear/auth/disconnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orgId }),
      });
      setConnected(false);
      setWorkspaceName(null);
      onConnectionChange?.(false);
      toast.success('Linear disconnected');
    } catch (e) {
      toast.error('Failed to disconnect Linear');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking Linear connection...
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-gray-900">
            {workspaceName || 'Linear'} connected
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
        >
          {disconnecting
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Unlink className="w-3 h-3" />}
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="text-sm text-gray-500">Linear not connected</span>
      </div>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#5E6AD2] hover:bg-[#4F5BBD] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {connecting
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <Link2 className="w-3 h-3" />}
        {connecting ? 'Connecting...' : 'Connect Linear'}
      </button>
    </div>
  );
};
