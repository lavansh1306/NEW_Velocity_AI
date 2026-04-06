import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDropdown } from './NotificationDropdown';
import { getNotifications } from '@/services/dashboardService';

interface TopHeaderProps {
    activeLabel: string;
    actions?: React.ReactNode;
}

export const TopHeader = ({ activeLabel, actions }: TopHeaderProps) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getNotifications();
                const mapped = data.map((n: any) => ({
                    id: n.id,
                    title: n.type === 'suggestion' ? '🤖 AI Task Suggestion' : 'Leave Request',
                    description: n.message,
                    time: n.date ? new Date(n.date).toLocaleDateString() : '',
                    type: n.type === 'suggestion' ? 'suggestion' : 'warning',
                    taskName: n.message?.replace('AI extracted task: ', ''),
                    projectId: n.projectId,
                    suggestedUserId: n.suggestedUserId,
                    estimatedHours: n.estimatedHours,
                }));
                setNotifications(mapped);
            } catch (e) {
                console.warn('Failed to load notifications:', e);
            }
        };
        load();
        // Refresh every 2 minutes
        const interval = setInterval(load, 120000);
        return () => clearInterval(interval);
    }, []);

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
