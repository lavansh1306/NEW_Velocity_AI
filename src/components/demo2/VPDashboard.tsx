import React, { useEffect, useState } from 'react';
import { loadAllMetrics } from '@/lib/dataService';

export default function VPDashboard() {
  const [costSavingsUSD, setCostSavingsUSD] = useState<number | null>(null);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [perAppHours, setPerAppHours] = useState<Record<string, number> | null>(null);
  const [perAppReturns, setPerAppReturns] = useState<Record<string, number> | null>(null);
  const [totalReturns, setTotalReturns] = useState<number | null>(null);
  const [savingsTrend, setSavingsTrend] = useState<{ label: string; investmentUSD: number; savingsUSD: number }[] | null>(null);
  const [hourlyRateUsedUSD, setHourlyRateUsedUSD] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    loadAllMetrics()
      .then((m) => {
        if (!mounted) return;
        setCostSavingsUSD(m.estimatedCostSavedUSD ?? null);
        setTotalHours(m.estimatedTimeSavedHours ?? null);
        setPerAppHours((m as any).perAppHours ?? null);
        setPerAppReturns((m as any).perAppReturns ?? null);
            setTotalReturns((m as any).totalReturns ?? null);
            setSavingsTrend((m as any).savingsInvestmentTrend ?? null);
            setHourlyRateUsedUSD((m as any).hourlyRateUsedUSD ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setCostSavingsUSD(null);
      });
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
  function formatNumberWithCommas(n: number | null | undefined) {
    if (n == null) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function formatFTEs(hours: number | null | undefined) {
    if (hours == null) return '—';
    const ftes = hours / 8;
    return `${ftes.toFixed(1)} FTEs`;
  }
  // Tools and blended-scale calculations (used by chart and footer)
  const tools = [
    { name: 'JIRA', investment: 10 },
    { name: 'HubSpot AI', investment: 10 },
    { name: 'Zapier Auto', investment: 10 },
    { name: 'Asana', investment: 10 },
    { name: 'Microsoft 365', investment: 10 },
  ];

  const rows = tools.map((tool) => {
    const appKey = tool.name === 'JIRA' ? 'Jira' : tool.name === 'Zapier Auto' ? 'Zapier' : tool.name === 'HubSpot AI' ? 'HubSpot' : tool.name === 'Microsoft 365' ? 'Microsoft365' : tool.name;
    const hours = perAppHours?.[appKey] ?? 0;
    const returnsUSD = perAppReturns?.[appKey] ?? 0;
    const investmentUSD = tool.investment * 1000; // K -> USD
    const hoursUSD = (hourlyRateUsedUSD ?? 100) * hours;
    return { tool, appKey, hours, returnsUSD, investmentUSD, hoursUSD };
  });

  const maxVal = Math.max(...rows.map((r) => Math.max(r.investmentUSD, r.returnsUSD, r.hoursUSD)), 1);
  const totalInvestmentUSD = rows.reduce((acc, r) => acc + r.investmentUSD, 0);
  const totalReturnsUSD = totalReturns != null ? totalReturns : Object.values(perAppReturns ?? {}).reduce((s, v) => s + (v ?? 0), 0);
  const blendedROI = totalInvestmentUSD > 0 ? totalReturnsUSD / totalInvestmentUSD : null;
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Executive Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">AI & Automation Impact Dashboard</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">Enterprise-wide view of how AI tools are driving revenue growth & cost savings</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
            <select className="px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Q4 2024</option>
              <option>Q3 2024</option>
              <option>YTD 2024</option>
            </select>
            <button className="px-4 sm:px-4 py-2.5 sm:py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 active:bg-gray-700 flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors">
              <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top-Line Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2.5 lg:grid-cols-5 gap-2 sm:gap-3 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold bg-white bg-opacity-20 px-2 py-0.5 rounded">+47% vs LQ</span>
          </div>
          <div className="text-xs opacity-90 mb-1">Total AI-Driven Value</div>
          <div className="text-xl sm:text-2xl font-bold">$847K</div>
          <div className="text-xs mt-1 opacity-75">Verified ROI this quarter</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xs font-bold bg-white bg-opacity-20 px-2 py-0.5 rounded">+$312K</span>
          </div>
          <div className="text-xs opacity-90 mb-1">Revenue Acceleration</div>
          <div className="text-xl sm:text-2xl font-bold">$1.2M</div>
          <div className="text-xs mt-1 opacity-75">Deals closed faster via AI</div>
        </div>

        <div className="rounded-lg p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow" style={{ background: 'linear-gradient(135deg, #ef4444, #ef4444)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-xs opacity-90 mb-1">Total Hours Saved</div>
          <div className="text-xl sm:text-2xl font-bold">{totalHours != null ? formatNumberWithCommas(totalHours) : '—'}</div>
          <div className="text-xs mt-1 opacity-75">Across all platforms</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-xs font-bold bg-white bg-opacity-20 px-2 py-0.5 rounded">-23%</span>
          </div>
          <div className="text-xs opacity-90 mb-1">ROI</div>
          <div className="text-xl sm:text-2xl font-bold">
            {totalReturns != null ? formatLargeUSD(totalReturns) : '—'}
          </div>
          <div className="text-xs mt-1 opacity-75">Across all platforms</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold bg-white bg-opacity-20 px-2 py-0.5 rounded">{totalHours != null ? `${formatNumberWithCommas(totalHours)} hrs` : '—'}</span>
          </div>
          <div className="text-xs opacity-90 mb-1">Time Recaptured</div>
          <div className="text-xl sm:text-2xl font-bold">{formatFTEs(totalHours)}</div>
          <div className="text-xs mt-1 opacity-75">Equivalent capacity freed</div>
        </div>
      </div>

      {/* AI Investment ROI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">AI Tool Investment vs. Returns</h3>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded"></span> Investment
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded"></span> Returns
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span> Hours
              </span>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="space-y-4">
            {rows.map(({ tool, appKey, hours, returnsUSD, investmentUSD, hoursUSD }) => {
              const invPercent = Math.round((investmentUSD / maxVal) * 100);
              const retPercent = Math.round((returnsUSD / maxVal) * 100);
              const hrsPercent = Math.round((hoursUSD / maxVal) * 100);
              const returnsRounded = Math.round(returnsUSD);
              const hoursDisplay = Number.isFinite(hours) ? (Math.round(hours * 10) / 10).toFixed(1) : '0.0';

              return (
                <div key={tool.name} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-gray-700">{tool.name}</div>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                      <div
                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${invPercent}%` }}
                      >
                        ${tool.investment}K
                      </div>
                      <div
                        className="bg-green-500"
                        style={{ width: `${retPercent}%` }}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${hrsPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-36 text-right">
                    <div className="text-sm font-bold text-green-600">{formatLargeUSD(returnsRounded)}</div>
                    <div className="text-xs text-red-600">{hoursDisplay}h</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">Total AI Investment:</span>
              <span className="ml-2 text-lg font-bold text-gray-900">{formatLargeUSD(totalInvestmentUSD)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Returns:</span>
              <span className="ml-2 text-lg font-bold text-green-600">{formatLargeUSD(costSavingsUSD)}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-600">Blended ROI:</span>
              <span className="ml-2 text-2xl font-bold text-green-600">{blendedROI != null ? `${(Math.round((blendedROI) * 10) / 10).toFixed(1)}x` : '—'}</span>
            </div>
          </div>

          {/* Savings vs Investment Over Time Graph */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Savings vs Investment Over Time</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span> Investment
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded"></span> Savings
                </span>
              </div>
            </div>
            <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 700 300">
            <defs>
              <linearGradient id="investmentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`grid-${i}`}
                x1="60"
                y1={50 + i * 50}
                x2="680"
                y2={50 + i * 50}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis labels */}
            {['$80K', '$60K', '$40K', '$20K', '$0'].map((label, i) => (
              <text key={`y-${i}`} x="45" y={55 + i * 50} fontSize="11" fill="#6b7280" textAnchor="end">
                {label}
              </text>
            ))}
            
            {/* Dynamic Investment/Savings Area and Lines */}
            {savingsTrend && savingsTrend.length > 0 ? (
              (() => {
                const pts = savingsTrend;
                const startX = 100;
                const endX = 600;
                const count = pts.length;
                const step = count > 1 ? (endX - startX) / (count - 1) : 0;
                const allValues = pts.flatMap((p) => [p.investmentUSD, p.savingsUSD]);
                const maxValChart = Math.max(...allValues, 1);
                const yTop = 50;
                const yBottom = 250;
                const height = yBottom - yTop;

                const invPoints: string[] = [];
                const savPoints: string[] = [];
                for (let i = 0; i < count; i++) {
                  const x = Math.round(startX + step * i);
                  const invY = Math.round(yBottom - (pts[i].investmentUSD / maxValChart) * height);
                  const savY = Math.round(yBottom - (pts[i].savingsUSD / maxValChart) * height);
                  invPoints.push(`${x},${invY}`);
                  savPoints.push(`${x},${savY}`);
                }

                const invPolygon = `${invPoints.join(' ')} ${endX},250 ${startX},250`;
                const savPolygon = `${savPoints.join(' ')} ${endX},250 ${startX},250`;

                return (
                  <>
                    <polygon points={invPolygon} fill="url(#investmentGradient)" />
                    <polygon points={savPolygon} fill="url(#savingsGradient)" />

                    <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={invPoints.join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="3" points={savPoints.join(' ')} />

                    {pts.map((point, idx) => {
                      const x = Math.round(startX + step * idx);
                      const invY = Math.round(yBottom - (point.investmentUSD / maxValChart) * height);
                      const savY = Math.round(yBottom - (point.savingsUSD / maxValChart) * height);
                      return (
                        <g key={`${point.label}-${idx}`}>
                          <circle cx={x} cy={invY} r="5" fill="#3b82f6" />
                          <circle cx={x} cy={savY} r="5" fill="#10b981" />
                          <text x={x} y="270" textAnchor="middle" fontSize="12" fill="#6b7280" fontWeight="600">
                            {point.label}
                          </text>
                          <g className="opacity-0 hover:opacity-100 transition-opacity">
                            <rect x={x - 30} y={Math.min(invY, savY) - 40} width="60" height="32" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="4" />
                            <text x={x} y={Math.min(invY, savY) - 22} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="700">
                              {`Inv ${formatLargeUSD(point.investmentUSD)} / Sav ${formatLargeUSD(point.savingsUSD)}`}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </>
                );
              })()
            ) : (
              /* fallback to original static visualization */
              <>
                <polygon
                  points="100,215 200,195 300,185 400,180 500,175 600,170 600,250 100,250"
                  fill="url(#investmentGradient)"
                />
                <polygon
                  points="100,200 200,175 300,160 400,155 500,135 600,115 600,250 100,250"
                  fill="url(#savingsGradient)"
                />
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points="100,215 200,195 300,185 400,180 500,175 600,170"
                />
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points="100,200 200,175 300,160 400,155 500,135 600,115"
                />
              </>
            )}
          </svg>
            </div>
          </div>
        </div>

        {/* AI Maturity Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI Maturity Score</h3>
          <div className="relative flex items-center justify-center mb-6">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray="440"
                strokeDashoffset="132"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <div className="text-4xl font-bold text-gray-900">72</div>
              <div className="text-sm text-gray-500">out of 100</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Adoption Rate</span>
              <span className="font-semibold text-green-600">85%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Integration Depth</span>
              <span className="font-semibold text-blue-600">68%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Process Coverage</span>
              <span className="font-semibold text-purple-600">64%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Value Realization</span>
              <span className="font-semibold text-orange-600">71%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Industry Benchmark: 58</div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                +14 pts above avg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Process Improvements & Department Breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* AI Process Improvements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Process Improvements from AI/Automation</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">Lead Scoring & Qualification</span>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">-68% time</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                AI scoring replaced manual review. 2,847 leads/month now auto-qualified.
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Before: 90 min/day</span>
                <span className="text-green-600 font-semibold">After: 28 min/day</span>
                <span className="text-purple-600 font-semibold">Value: $142K/yr</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">Content Draft Creation</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">-54% time</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                GPT-assisted drafts reduced first-draft time. Quality maintained at 94%.
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Before: 3.2 hrs/piece</span>
                <span className="text-blue-600 font-semibold">After: 1.5 hrs/piece</span>
                <span className="text-purple-600 font-semibold">Value: $87K/yr</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">Sales Cycle Acceleration</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">-22% cycle</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Automated follow-ups & AI insights accelerated deal stages.
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Before: 41 days avg</span>
                <span className="text-purple-600 font-semibold">After: 32 days avg</span>
                <span className="text-purple-600 font-semibold">Value: $312K/yr</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">Reporting & Analytics</span>
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded">-91% time</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Automated dashboards replaced manual Excel reporting.
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Before: 8 hrs/week</span>
                <span className="text-orange-600 font-semibold">After: 45 min/week</span>
                <span className="text-purple-600 font-semibold">Value: $58K/yr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Impact Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Value by Department</h3>
          <div className="space-y-5">
            {[
              { name: 'Marketing', value: 342, percentage: 68, color: 'bg-blue-500' },
              { name: 'Sales', value: 287, percentage: 57, color: 'bg-green-500' },
              { name: 'Operations', value: 158, percentage: 32, color: 'bg-orange-500' },
              { name: 'Customer Success', value: 60, percentage: 12, color: 'bg-purple-500' },
            ].map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{dept.name}</span>
                  <span className="text-sm font-bold text-gray-900">${dept.value}K</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 ${dept.color} rounded-full transition-all duration-500`}
                    style={{ width: `${dept.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{dept.percentage}% of total</span>
                  <span className="text-green-600 font-semibold">+{Math.floor(dept.percentage / 3)}% vs LQ</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Enterprise Value</span>
              <span className="text-2xl font-bold text-gray-900">$847K</span>
            </div>
          </div>
        </div>
      </div>


      {/* Capacity Management Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Active Initiatives</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">12</div>
          <div className="text-sm text-green-600 font-semibold">3 fully allocated</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Available Capacity</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">427h</div>
          <div className="text-sm text-blue-600 font-semibold">Across 23 team members</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Match Success Rate</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">94%</div>
          <div className="text-sm text-green-600 font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            12% this quarter
          </div>
        </div>
      </div>

      {/* Causal Attribution Analysis */}
      <div className="mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Causal Attribution Analysis</h3>
          
          <div className="space-y-4">
            {[
              {
                title: 'Mobile App Launch',
                deployed: '240h deployed',
                metric: 'Pipeline Value',
                method: 'Diff-in-Diff',
                impact: '+$680K',
                confidence: 92,
              },
              {
                title: 'Customer Portal',
                deployed: '160h deployed',
                metric: 'CSAT Score',
                method: 'Causal Inference',
                impact: '+9 points',
                confidence: 88,
              },
              {
                title: 'API Optimization',
                deployed: '120h deployed',
                metric: 'Cycle Time',
                method: 'Regression Analysis',
                impact: '-2.3 days',
                confidence: 91,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                        {item.deployed}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Metric: {item.metric}</span>
                      <span>•</span>
                      <span>Method: {item.method}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        {item.impact}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.confidence}% confidence
                      </div>
                    </div>
                    
                    {/* Circular Progress Indicator */}
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#3b82f6"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - item.confidence / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{item.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend & Strategic Insights */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Value Trend */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI Value Realization Trend</h3>
          <div className="relative h-64">
            <svg className="w-full h-full" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                points="50,150 150,130 250,110 350,85 450,70 550,50"
              />
              {[
                { x: 50, y: 150, label: 'Jan' },
                { x: 150, y: 130, label: 'Feb' },
                { x: 250, y: 110, label: 'Mar' },
                { x: 350, y: 85, label: 'Apr' },
                { x: 450, y: 70, label: 'May' },
                { x: 550, y: 50, label: 'Jun' },
              ].map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="5" fill="#3b82f6" />
                  <text x={point.x} y="190" textAnchor="middle" fontSize="12" fill="#6b7280">
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-gray-500">Q1 2024</span>
                <div className="text-lg font-bold text-gray-900">$412K</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Q2 2024</span>
                <div className="text-lg font-bold text-gray-900">$847K</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Growth Rate</span>
              <div className="text-lg font-bold text-green-600">+106% QoQ</div>
            </div>
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            AI Insights
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-white bg-opacity-10 rounded-lg">
              <div className="text-sm font-semibold mb-1">Expand LLM Usage</div>
              <div className="text-xs opacity-90">13.6x ROI suggests broader deployment opportunity</div>
            </div>
            <div className="p-3 bg-white bg-opacity-10 rounded-lg">
              <div className="text-sm font-semibold mb-1">Customer Success Gap</div>
              <div className="text-xs opacity-90">Only $60K realized - high growth potential</div>
            </div>
            <div className="p-3 bg-white bg-opacity-10 rounded-lg">
              <div className="text-sm font-semibold mb-1">Marketing Momentum</div>
              <div className="text-xs opacity-90">68% adoption - replicate playbook to other teams</div>
            </div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 text-sm">
            View Full Analysis →
          </button>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Executive Summary</h3>
            <p className="text-blue-100 max-w-2xl">
              AI investments are delivering <strong>4.3x blended ROI</strong> with strongest performance in LLM
              assistants (13.6x) and workflow automation (8.7x). Marketing leads adoption; Customer Success presents
              highest growth opportunity. Recommend expanding successful patterns to underserved departments.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200 mb-1">Next Board Report</div>
            <div className="text-2xl font-bold">Dec 15, 2024</div>
            <button className="mt-3 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 text-sm">
              Schedule Prep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
