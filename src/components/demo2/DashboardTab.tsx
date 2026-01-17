import React, { useEffect, useState } from 'react';
import { loadAllMetrics, computeAllBlockedHours } from '@/lib/dataService';
import { apiUrl } from '@/lib/api';
import { hubspotFetch } from '@/lib/hubspot-fetch';

export default function DashboardTab() {
  const [totalReturns, setTotalReturns] = useState<number | null>(null);
  const [blockedHours, setBlockedHours] = useState<number | null>(null);
  const [aiSavedHours, setAiSavedHours] = useState<number | null>(null);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

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

  function formatLargeUSD(v: number | null | undefined) {
    if (v == null) return '—';
    const isNegative = v < 0;
    const absVal = Math.abs(v);
    const formatted = `$${Math.round(absVal).toLocaleString()}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Pilot Overview</h2>
      </div>

      {/* ROI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="text-xs sm:text-sm opacity-90 mb-1">Total Realized Value</div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">$127,450</div>
          <div className="text-xs sm:text-sm mt-2 opacity-75">3.2x Platform Fee ROI</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Operational ROI (Tier A)</div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">{formatLargeUSD(totalReturns)}</div>
          <div className="text-xs text-gray-500 mt-2">12 verified accelerations</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Cost Avoidance (Tier B)</div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600">$68,000</div>
          <div className="text-xs text-gray-500 mt-2">8 harvest tasks completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Revenue Impact (Tier C)</div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600">$16,750</div>
          <div className="text-xs text-gray-500 mt-2">3 deal accelerations</div>
        </div>
      </div>

      {/* Capacity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Weekly Capacity Minted</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Block Capacity</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">{loadingBlocked ? '...' : (blockedHours !== null ? `${blockedHours} hours` : '—')}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6">
                <div
                  className="h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: '72%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">AI-SAVED TIME</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {loadingAI ? '...' : aiSavedHours ? `${aiSavedHours} hours` : '—'}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6">
                <div
                  className="h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: aiSavedHours ? `${Math.min((aiSavedHours / 120) * 100, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Available</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">116.8 hours</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Integration Health</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">HubSpot</span>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">Synced 2m ago</span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Asana</span>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">Synced 4m ago</span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">MS 365</span>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">Synced 1m ago</span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Zapier</span>
              </div>
              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
                Not Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Recent Capacity Events</h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5 sm:mt-2"></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-gray-900">Block Capacity Minted: Lead Triage Automation</div>
              <div className="text-xs sm:text-sm text-gray-600">342 leads auto-processed, 8.5 hours saved</div>
            </div>
            <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">2 hours ago</div>
          </div>
          <div className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 sm:mt-2"></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-gray-900">AI-SAVED TIME: Meeting Efficiency Gain</div>
              <div className="text-xs sm:text-sm text-gray-600">4 meetings optimized, 1.7 hours recaptured</div>
            </div>
            <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">5 hours ago</div>
          </div>
          <div className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5 sm:mt-2"></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-gray-900">ROI Event: Campaign Launch Accelerated</div>
              <div className="text-xs sm:text-sm text-gray-600">3 days saved via capacity allocation, $7,500 CoD value</div>
            </div>
            <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">1 day ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
