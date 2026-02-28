import React from 'react';
import { Loader2 } from 'lucide-react';

interface JiraSyncLoadingProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
}

export const JiraSyncLoading: React.FC<JiraSyncLoadingProps> = ({ 
  isVisible, 
  message = 'Connecting to Jira...',
  progress = 0 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0052CC] to-[#003399] rounded-full opacity-10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h3 className="text-center text-xl font-light text-[#121212] mb-2">
          {message}
        </h3>
        <p className="text-center text-sm text-[#737373] font-light mb-6">
          Fetching your Jira projects and issues...
        </p>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="w-full bg-[#F5F5F4] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#0052CC] to-[#003399] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-[#A3A3A3] text-center font-light">
            {progress > 0 ? `${Math.round(progress)}%` : 'Initializing...'}
          </p>
        </div>

        {/* Steps */}
        <div className="mt-8 space-y-3">
          {[
            { step: 1, label: 'Checking database', active: progress > 10 },
            { step: 2, label: 'Loading projects', active: progress > 40 },
            { step: 3, label: 'Loading tasks', active: progress > 70 },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-light ${
                item.active
                  ? 'bg-[#0052CC] text-white'
                  : 'bg-[#F5F5F4] text-[#A3A3A3]'
              }`}>
                {item.active ? '✓' : item.step}
              </div>
              <span className={`text-sm ${item.active ? 'text-[#121212] font-light' : 'text-[#A3A3A3] font-light'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-[#737373] text-center mt-8 font-light">
          This usually takes less than 30 seconds
        </p>
      </div>
    </div>
  );
};
