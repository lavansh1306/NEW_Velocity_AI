import { useState } from 'react';

interface VeloHeaderProps {
  currentView: 'manager' | 'vp';
  onViewChange: (view: 'manager' | 'vp') => void;
}

export default function VeloHeader({ currentView, onViewChange }: VeloHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                V
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VelocityAI</h1>
                <p className="text-xs text-gray-500">Production MVEP • Pilot Ready</p>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => onViewChange('manager')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'manager'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Manager View
              </span>
            </button>
            <button
              onClick={() => onViewChange('vp')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'vp'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                VP Executive View
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Pilot: Day <strong>23</strong> of 90
            </span>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">All Systems Operational</span>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              Security Audit
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
