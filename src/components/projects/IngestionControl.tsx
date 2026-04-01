import React, { useState } from 'react';
import { Mail, FileText, RefreshCw, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ingestionApi } from '@/api/ingestionApi';
import { AITaskSuggestionsBoard } from './AITaskSuggestionsBoard';
import { VOICE_AGENT_URL } from '@/lib/api-config';

interface IngestionControlProps {
  projectId?: string | null;
  userId: string;
}

export const IngestionControl = ({ projectId, userId }: IngestionControlProps) => {
  const { toast } = useToast();
  const [loadingMeet, setLoadingMeet] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [showReauthBanner, setShowReauthBanner] = useState(false);

  const handleSyncMeet = async () => {
    if (!projectId) {
      toast({
        title: "Sync Action Denied",
        description: "Please select or create a project workspace to sync content indexing triggers.",
        variant: "destructive",
      });
      return;
    }
    setLoadingMeet(true);
    try {
      if (!VOICE_AGENT_URL) {
        throw new Error('Voice Agent URL is not configured.');
      }
      const response = await fetch(`${VOICE_AGENT_URL}/sync-latest-meet?user_id=${userId}&project_id=${projectId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 403) {
           throw new Error('AUTH_REQUIRED');
        }
        let errMsg = 'Failed to synchronize transcript.';
        try {
          const errData = await response.json();
          if (errData.detail) errMsg = errData.detail;
        } catch (e) {}
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      
      toast({
        title: "Syncing started safely",
        description: data.status || "Loading suggestions...",
        variant: "default",
      });
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        setShowReauthBanner(true);
      } else {
        toast({
          title: "Sync Failed",
          description: error.message || "Something went wrong syncing Google Drive",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingMeet(false);
    }
  };

  const handleSyncEmail = async () => {
    if (!projectId) {
      toast({
        title: "Sync Action Denied",
        description: "Please select or create a project workspace to sync content indexing triggers.",
        variant: "destructive",
      });
      return;
    }
    setLoadingEmail(true);
    try {
      if (!VOICE_AGENT_URL) {
        throw new Error('Voice Agent URL is not configured.');
      }
      const response = await fetch(`${VOICE_AGENT_URL}/sync-latest-email?user_id=${userId}&project_id=${projectId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 403) {
           throw new Error('AUTH_REQUIRED');
        }
        let errMsg = 'Failed to synchronize email.';
        try {
          const errData = await response.json();
          if (errData.detail) errMsg = errData.detail;
        } catch (e) {}
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      
      if (data.emails_found === 0) {
        toast({
          title: "No Emails Found",
          description: "No relevant emails found for the specified workflow targets.",
          variant: "default",
        });
      } else {
        toast({
          title: "Sync Successful",
          description: data.status || `Processed ${data.processed || 0} emails.`,
          variant: "default",
        });
      }
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        setShowReauthBanner(true);
      } else {
        toast({
          title: "Sync Failed",
          description: error.message || "Something went wrong syncing Gmail",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleReconnect = () => {
    if (!VOICE_AGENT_URL) {
      toast({
        title: "Configuration Error",
        description: "Voice Agent URL is not configured.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `${VOICE_AGENT_URL}/auth/google/login?user_id=${userId}`;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-neutral-800">Fetch Latest Activity</h2>
          <p className="text-sm text-neutral-500 font-light">Sync latest meeting transcripts and emails for AI ingestion.</p>
        </div>
        <Button 
          onClick={handleReconnect}
          className="bg-neutral-800 hover:bg-neutral-900 text-white border border-neutral-700 shadow-sm transition-all shadow-neutral-200/50 hover:shadow-neutral-300 font-medium text-sm flex items-center gap-2 px-4 rounded-md"
        >
          <span>Connect Google Workspace</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </Button>
      </div>

      {!projectId && (
        <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-neutral-700 font-medium">No Workspace Target</p>
            <p className="text-xs text-neutral-500 font-light mt-1">Please create or select an active project workspace first to trigger ingestion engine workflows sync triggers.</p>
          </div>
        </div>
      )}

      {showReauthBanner && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Permissions Updated</p>
            <p className="text-xs text-amber-700 font-light mt-1">Please reconnect your Google Workspace account to enable Email Sync.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReconnect}
            className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100/50 flex items-center gap-1 text-xs shadow-sm"
          >
            Reconnect Workspace <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Drive Card */}
        <div className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-300 transition-colors bg-white flex flex-col justify-between shadow-sm cursor-pointer group">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 bg-neutral-100 text-neutral-600 rounded-md group-hover:bg-neutral-200/60 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-neutral-800">Google Drive</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">Sync Google Doc meeting transcripts</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncMeet}
            disabled={loadingMeet}
            className="w-full flex items-center justify-center gap-2 bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 font-medium transition-colors"
          >
            {loadingMeet ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" /> : <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />}
            Sync Google Drive
          </Button>
        </div>

        {/* Gmail Card */}
        <div className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-300 transition-colors bg-white flex flex-col justify-between shadow-sm cursor-pointer group">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 bg-neutral-100 text-neutral-600 rounded-md group-hover:bg-neutral-200/60 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-neutral-800">Gmail Inbox</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">Search managers inbox for sync recommendations</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncEmail}
            disabled={loadingEmail}
            className="w-full flex items-center justify-center gap-2 bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 font-medium transition-colors"
          >
            {loadingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" /> : <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />}
            Sync Recent Meetings
          </Button>
        </div>
      </div>

      <AITaskSuggestionsBoard projectId={projectId} />
    </div>
  );
};
