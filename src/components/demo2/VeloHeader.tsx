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
import { UserProfile } from '../UserProfile';

interface VeloHeaderProps {
  onSecurityAuditClick?: () => void;
}

export default function VeloHeader({ onSecurityAuditClick }: VeloHeaderProps) {
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
            display: flex !important;
            align-items: center !important;
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
      <div className="w-full py-3 sm:py-4 h-full velo-header-container bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 velo-logo">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center text-white font-light text-sm sm:text-lg velo-logo-box">
              V
            </div>
            <div className="hidden sm:block velo-logo-text">
              <h1 className="text-lg sm:text-xl font-light text-gray-900">VelocityAI</h1>
              <p className="text-xs text-gray-500"></p>
            </div>
          </div>

          {/* Right: Status + Settings + User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-xl velo-status-badge">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-light text-green-700">All Systems Operational</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 sm:h-10 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 bg-primary border border-transparent rounded-xl text-xs sm:text-sm text-white hover:bg-primary/90 shadow-sm velo-button font-light">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-white velo-settings-icon" />
                  <span className="hidden sm:inline font-light velo-settings-text">Settings</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { if (onSecurityAuditClick) onSecurityAuditClick(); }}>
                  Security Audit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/data-quality" className="w-full block">Data Quality</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile / Logout */}
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
