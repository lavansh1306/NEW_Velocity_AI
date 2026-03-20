import React, { useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { SystemStatus } from './SystemStatus';
import { NotificationDropdown } from './NotificationDropdown';

interface TopHeaderProps {
    activeLabel: string;
    actions?: React.ReactNode;
}

export const TopHeader = ({ activeLabel, actions }: TopHeaderProps) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Notifications — populated dynamically when notification system is implemented
    const notifications: { id: string; title: string; description: string; time: string; type: 'success' | 'info' | 'warning' }[] = [];

    return (
        <div className="h-16 border-b border-[#E7E5E4] flex items-center justify-between px-8 bg-[#F5F5F4]/80 backdrop-blur-md sticky top-0 z-30 shadow-sm shadow-stone-200/50">
            {/* Dynamic Breadcrumb */}
            <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-[#78716C]">
                    <span className="font-normal">Velocity AI</span>
                    <ChevronRight className="h-4 w-4 mx-2 text-[#D6D3D1]" strokeWidth={1.5} />
                    <span className="text-[#1C1917] font-medium">{activeLabel}</span>
                </div>
            </div>

            {/* Global Search */}
            <GlobalSearch />

            {/* Right Actions */}
            <div className="flex items-center gap-5 relative">
                {actions}
                <SystemStatus />

                <button
                    className={`relative p-2 rounded-lg transition-all duration-200 border border-transparent ${isNotificationsOpen
                        ? 'bg-white shadow-sm border-[#E7E5E4] text-[#1C1917]'
                        : 'hover:bg-white hover:shadow-sm hover:border-[#E7E5E4] text-[#78716C]'
                        }`}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                    <Bell className="h-5 w-5" strokeWidth={1.75} />
                    {notifications.length > 0 && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#F43F5E] rounded-full border border-[#F5F5F4]" />
                    )}
                </button>

                {isNotificationsOpen && (
                    <NotificationDropdown
                        onClose={() => setIsNotificationsOpen(false)}
                        items={notifications}
                    />
                )}
            </div>
        </div>
    );
};
