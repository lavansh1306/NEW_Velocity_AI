import React from 'react';
import { Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'info' | 'warning';
}

interface NotificationDropdownProps {
    onClose: () => void;
    items: NotificationItem[];
}

export const NotificationDropdown = ({ onClose, items }: NotificationDropdownProps) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-[#E7E5E4] rounded-xl shadow-xl shadow-stone-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-[#F5F5F4] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1C1917]">Notifications</h3>
                <button
                    onClick={onClose}
                    className="text-xs text-[#78716C] hover:text-[#1C1917] transition-colors"
                >
                    Mark all as read
                </button>
            </div>
            <div className="max-h-[400px] overflow-auto">
                {items.length > 0 ? (
                    <div className="divide-y divide-[#F5F5F4]">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-[#FAFAF9] transition-colors cursor-pointer group">
                                <div className="flex gap-3">
                                    <div className="mt-0.5">
                                        {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />}
                                        {item.type === 'info' && <Clock className="w-4 h-4 text-[#0284C7]" />}
                                        {item.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#F43F5E]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1C1917] leading-none mb-1">{item.title}</p>
                                        <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed">{item.description}</p>
                                        <p className="text-[10px] text-[#A8A29E] mt-2">{item.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-[#D6D3D1] mx-auto mb-3 opacity-20" />
                        <p className="text-sm text-[#A8A29E]">All caught up!</p>
                    </div>
                )}
            </div>
            <div className="p-3 bg-[#FAFAF9] border-t border-[#F5F5F4] text-center">
                <button className="text-xs font-medium text-[#1C1917] hover:underline">
                    View all notifications
                </button>
            </div>
        </div>
    );
};
