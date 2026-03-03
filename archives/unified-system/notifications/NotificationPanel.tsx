import React from 'react';
import { Notification } from '../types';
import { Bell, Check, Briefcase, FileCheck, Calendar, Info, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  userRole: 'MANAGER' | 'EMPLOYEE';
  currentUserId: number;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen, onClose, notifications, userRole, currentUserId, onMarkAsRead, onClearAll
}) => {
  if (!isOpen) return null;

  // Filter notifications relevant to the current user
  const myNotifications = notifications.filter(n => {
    // 1. Role Check
    if (n.recipientRole !== 'ALL' && n.recipientRole !== userRole) return false;
    // 2. ID Check (If specific recipient is set)
    if (n.recipientId && n.recipientId !== currentUserId) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT': return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'COMPLETION': return <FileCheck className="w-4 h-4 text-emerald-600" />;
      case 'LEAVE_UPDATE': return <Calendar className="w-4 h-4 text-amber-600" />;
      default: return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT': return 'bg-indigo-50 border-indigo-100';
      case 'COMPLETION': return 'bg-emerald-50 border-emerald-100';
      case 'LEAVE_UPDATE': return 'bg-amber-50 border-amber-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="absolute top-16 right-4 w-96 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
      <Card className="border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs h-7 text-slate-400 hover:text-red-500">
                Clear
             </Button>
             <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2 space-y-2 bg-slate-50/50 flex-1">
          {myNotifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            myNotifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all relative group
                  ${getBgColor(notif.type)} ${notif.isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-white shadow-sm'}
                `}
              >
                {!notif.isRead && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
                
                <div className="flex gap-3">
                  <div className="mt-1 bg-white p-1.5 rounded-full shadow-sm h-fit">
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{notif.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(notif.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};