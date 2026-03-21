import React, { useState } from 'react';
import { Mail, FileText, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ingestionApi } from '@/api/ingestionApi';

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
      const response = await ingestionApi.syncMeet(userId, projectId);
      toast({
        title: "Syncing started safely",
        description: response.status || "Loading suggestions...",
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
      const response = await ingestionApi.syncEmail(userId, projectId);
      if (response.emails_found === 0) {
        toast({
          title: "No Emails Found",
          description: "No relevant emails found for the specified workflow targets.",
          variant: "default",
        });
      } else {
        toast({
          title: "Sync Successful",
          description: response.status || `Processed ${response.processed || 0} emails.`,
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
    const loginUrl = ingestionApi.getLoginUrl(userId);
    window.location.href = loginUrl;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-neutral-800">Fetch Latest Activity</h2>
          <p className="text-sm text-neutral-500 font-light">Sync latest meeting transcripts and emails for AI ingestion.</p>
        </div>
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
        <div className="border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-neutral-50/50 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-800">Google Drive</h3>
              <p className="text-xs text-neutral-500 font-light mt-1">Sync Google Doc meeting transcripts</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncMeet}
            disabled={loadingMeet}
            className="w-full flex items-center justify-center gap-2 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            {loadingMeet ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sync Google Drive
          </Button>
        </div>

        {/* Gmail Card */}
        <div className="border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-neutral-50/50 flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-800">Gmail Inbox</h3>
              <p className="text-xs text-neutral-500 font-light mt-1">Search managers inbox for sync recommendations</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncEmail}
            disabled={loadingEmail}
            className="w-full flex items-center justify-center gap-2 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            {loadingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sync Gmail Inbox
          </Button>
        </div>
      </div>
    </div>
  );
};
