import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';

interface VeloHeaderProps {
  currentView: 'manager' | 'vp';
  onViewChange: (view: 'manager' | 'vp') => void;
  onSecurityAuditClick?: () => void;
}

export default function VeloHeader({ currentView, onViewChange, onSecurityAuditClick }: VeloHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50" style={{ maxHeight: '60px' }} >
      <style>{`
        @media (max-width: 768px) {
          header {
            max-height: 60px;
            height: 60px;
          }
          .velo-header-container {
            padding: 0.5rem 1rem;
            height: 60px;
          }
          .velo-logo {
            gap: 0.5rem;
          }
          .velo-logo-box {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
          .velo-logo-text {
            display: none;
          }
          .velo-right-controls {
            gap: 0.5rem;
          }
          .velo-status-text {
            display: none;
          }
          .velo-status-badge {
            display: none;
          }
          .velo-settings-text {
            display: none;
          }
          .velo-settings-icon {
            width: 16px;
            height: 16px;
          }
          .velo-audit-text {
            display: none;
          }
          .velo-button {
            height: 32px;
            padding: 0 0.5rem;
            font-size: 12px;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 h-full velo-header-container flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 velo-logo">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg velo-logo-box">
              V
            </div>
            <div className="hidden sm:block velo-logo-text">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">VelocityAI</h1>
              <p className="text-xs text-gray-500">Production MVEP • Pilot Ready</p>
            </div>
          </div>

          {/* Center - view toggle (hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => onViewChange('manager')}
                className={`h-8 sm:h-10 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'manager'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">Manager View</span>
                </span>
              </button>
              <button
                onClick={() => onViewChange('vp')}
                className={`h-8 sm:h-10 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'vp'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">VP Executive View</span>
                </span>
              </button>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto velo-right-controls">
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-600 velo-status-text">
              Pilot: Day <strong>23</strong> of 90
            </span>
            <div className="hidden sm:flex items-center gap-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg velo-status-badge">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold text-green-700">All Systems Operational</span>
            </div>

            {/* Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 sm:h-10 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm hover:shadow-sm velo-button">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700 velo-settings-icon" />
                  <span className="hidden sm:inline font-medium velo-settings-text">Settings</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to="/integrations" className="w-full block">Data Integrations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/integration-health" className="w-full block">Integration Health</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/data-quality" className="w-full block">Data Quality</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={onSecurityAuditClick} className="h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition velo-button">
              <span className="hidden sm:inline">Security Audit</span>
              <span className="sm:hidden velo-audit-text">Audit</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
