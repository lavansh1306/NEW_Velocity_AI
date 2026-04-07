import React from 'react';
import { usePresence } from '@/hooks/usePresence';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/people': 'People',
  '/plan': 'Plan',
  '/leave': 'Leave',
  '/settings': 'Settings',
};

const getPageLabel = (path: string) => {
  for (const [key, label] of Object.entries(PAGE_LABELS)) {
    if (path.startsWith(key)) return label;
  }
  return 'the app';
};

export const PresenceIndicator: React.FC = () => {
  const { onlineUsers } = usePresence();

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {onlineUsers.slice(0, 3).map((u) => (
        <div
          key={u.userId}
          className="relative group"
          title={`${u.name} is on ${getPageLabel(u.currentPage)}`}
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white">
            {u.name.charAt(0).toUpperCase()}
          </div>
          {/* Online dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5">
              <p className="font-medium">{u.name}</p>
              <p className="text-gray-300">on {getPageLabel(u.currentPage)}</p>
            </div>
          </div>
        </div>
      ))}
      {onlineUsers.length > 3 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium ring-2 ring-white">
          +{onlineUsers.length - 3}
        </div>
      )}
    </div>
  );
};
