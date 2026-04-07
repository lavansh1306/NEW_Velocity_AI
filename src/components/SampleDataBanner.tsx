import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { hasSampleData, createSampleData } from '@/services/sampleDataService';
import { toast } from 'sonner';

export const SampleDataBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const has = await hasSampleData();
        const wasDismissed = localStorage.getItem('sampleDataBannerDismissed');
        if (!has && !wasDismissed) setShow(true);
      } catch {}
    };
    check();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createSampleData();
      toast.success('Sample data created! Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create sample data');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('sampleDataBannerDismissed', 'true');
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div className="mx-8 mb-6 flex items-center justify-between gap-4 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-violet-900">See Velocity AI with real data</p>
          <p className="text-xs text-violet-600 font-light">Load a sample project, team, and tasks to explore all features before adding your own.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {loading ? 'Loading...' : 'Load sample data'}
        </button>
        <button onClick={handleDismiss} className="p-1 text-violet-400 hover:text-violet-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
