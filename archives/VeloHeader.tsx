import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../src/components/UserProfile';

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

          {/* Right: User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* User Profile / Logout */}
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
