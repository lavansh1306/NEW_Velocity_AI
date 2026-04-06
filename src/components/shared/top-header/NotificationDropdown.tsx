import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, AlertCircle, Sparkles, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'info' | 'warning' | 'suggestion';
    // For suggestion type
    taskName?: string;
    suggestedUserId?: string;
    estimatedHours?: number;
    projectId?: string;
}

interface NotificationDropdownProps {
    onClose: () => void;
    items: NotificationItem[];
}

export const NotificationDropdown = ({ onClose, items }: NotificationDropdownProps) => {
    const [approved, setApproved] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<Set<string>>(new Set());

    const handleApprove = async (item: NotificationItem) => {
        if (approved.has(item.id) || loading.has(item.id)) return;

        setLoading(prev => new Set(prev).add(item.id));

        try {
            // 1. Update ai_task_suggestions status to approved
            await supabase
                .from('ai_task_suggestions')
                .update({ status: 'approved' })
                .eq('id', item.id);

            // 2. Insert into real tasks table
            await supabase.from('tasks').insert({
                name: item.taskName || item.title,
                project_id: item.projectId || null,
                assignee_id: item.suggestedUserId || null,
                estimated_hours: item.estimatedHours || null,
                status: 'not_started',
            });

            setApproved(prev => new Set(prev).add(item.id));
            toast.success(`Task "${item.taskName || item.title}" approved`);
        } catch (err) {
            console.error('Approval failed:', err);
            toast.error('Failed to approve task');
        } finally {
            setLoading(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-[#E7E5E4] rounded-xl shadow-xl shadow-stone-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-[#F5F5F4] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1C1917]">Notifications</h3>
                <button onClick={onClose} className="text-xs text-[#78716C] hover:text-[#1C1917] transition-colors">
                    Mark all as read
                </button>
            </div>
            <div className="max-h-[400px] overflow-auto">
                {items.length > 0 ? (
                    <div className="divide-y divide-[#F5F5F4]">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-[#FAFAF9] transition-colors">
                                <div className="flex gap-3">
                                    <div className="mt-0.5 flex-shrink-0">
                                        {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />}
                                        {item.type === 'info' && <Clock className="w-4 h-4 text-[#0284C7]" />}
                                        {item.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#F43F5E]" />}
                                        {item.type === 'suggestion' && <Sparkles className="w-4 h-4 text-[#8b5cf6]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1C1917] leading-none mb-1">{item.title}</p>
                                        <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed">{item.description}</p>
                                        <p className="text-[10px] text-[#A8A29E] mt-1">{item.time}</p>

                                        {/* One-click approve button for AI suggestions */}
                                        {item.type === 'suggestion' && (
                                            <button
                                                onClick={() => handleApprove(item)}
                                                disabled={approved.has(item.id) || loading.has(item.id)}
                                                className={`mt-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                                    approved.has(item.id)
                                                        ? 'bg-green-50 text-green-700 cursor-default'
                                                        : 'bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#ede9fe] cursor-pointer'
                                                }`}
                                            >
                                                {approved.has(item.id) ? (
                                                    <><Check className="w-3 h-3" /> Approved</>
                                                ) : loading.has(item.id) ? (
                                                    'Approving...'
                                                ) : (
                                                    <><Sparkles className="w-3 h-3" /> Approve task</>
                                                )}
                                            </button>
                                        )}
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
