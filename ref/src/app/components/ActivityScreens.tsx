import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Bell, 
  Check, 
  Clock, 
  MessageSquare, 
  FileText, 
  User, 
  AlertTriangle,
  Zap,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';

const PageHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-4xl font-light text-[#121212] tracking-tight mb-2">{title}</h1>
      <p className="text-[#737373] font-light">{subtitle}</p>
    </div>
    <div className="flex gap-3">
      <Button variant="outline" className="h-10 border-white/20 bg-white/50 hover:bg-white text-[#737373] hover:text-[#121212] font-light">
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <Button className="bg-[#121212] hover:bg-[#262626] h-10 px-4 text-white font-light shadow-sm">
        Mark All Read
      </Button>
    </div>
  </div>
);

export const NotificationsScreen = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  const notifications = [
    { id: 1, type: 'alert', title: 'Sarah Chen is overloaded', description: 'Utilization reached 120% for 3 consecutive weeks.', time: '2 hours ago', read: false },
    { id: 2, type: 'success', title: 'Project "Mobile MVP" completed', description: 'All tasks marked as done. Ready for review.', time: '5 hours ago', read: false },
    { id: 3, type: 'info', title: 'New team member added', description: 'Alex Park joined the Engineering team.', time: '1 day ago', read: true },
    { id: 4, type: 'warning', title: 'Budget threshold exceeded', description: 'Infrastructure costs are 15% over budget.', time: '1 day ago', read: true },
    { id: 5, type: 'info', title: 'Meeting rescheduled', description: 'Weekly Sync moved to Friday at 10 AM.', time: '2 days ago', read: true },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-[#E27052]" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-[#88A67E]" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-[#2DD4BF]" />;
    }
  };

  return (
    <div className="p-10 min-h-screen bg-[#FDFDFB]">
      <div className="max-w-[1000px] mx-auto">
        <PageHeader title="Notifications" subtitle="Stay updated with important alerts and messages" />

        <div className="flex gap-2 mb-8 border-b border-gray-100 pb-1">
          {['All', 'Unread', 'Alerts', 'Mentions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.toLowerCase() 
                  ? 'text-[#1C1917]' 
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-[-5px] left-0 w-full h-[2px] bg-[#1C1917]" />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-sm ${
                notification.read 
                  ? 'bg-white/40 border-white/20' 
                  : 'bg-white border-[#2DD4BF]/20 shadow-sm border-l-4 border-l-[#2DD4BF]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.read ? 'bg-gray-100' : 'bg-[#F4F4F5]'
                }`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`text-base font-medium ${notification.read ? 'text-[#737373]' : 'text-[#121212]'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-[#A3A3A3] font-light flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-[#737373] font-light leading-relaxed mb-3">
                    {notification.description}
                  </p>
                  
                  {!notification.read && (
                    <div className="flex gap-3">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-white/20 hover:bg-white text-[#737373]">
                        Dismiss
                      </Button>
                      <Button size="sm" className="h-8 text-xs bg-[#121212] text-white hover:bg-[#262626]">
                        Review Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Button variant="ghost" className="text-sm text-[#737373] hover:text-[#121212] font-light">
            View Older Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ActivityFeedScreen = () => {
  const activities = [
    {
      date: 'Today',
      items: [
        { user: 'Sarah Chen', action: 'updated', target: 'Homepage Design', project: 'Velocity AI Platform', time: '10:30 AM', avatar: 'SC' },
        { user: 'Marcus Johnson', action: 'completed', target: 'API Authentication', project: 'Mobile App MVP', time: '11:15 AM', avatar: 'MJ' },
        { user: 'System', action: 'generated', target: 'Weekly Capacity Report', project: null, time: '9:00 AM', avatar: 'AI' },
      ]
    },
    {
      date: 'Yesterday',
      items: [
        { user: 'David Kim', action: 'commented on', target: 'Database Schema', project: 'Velocity AI Platform', time: '4:45 PM', avatar: 'DK' },
        { user: 'Emily Rodriguez', action: 'uploaded', target: 'New Assets', project: 'Marketing Site', time: '2:30 PM', avatar: 'ER' },
      ]
    }
  ];

  return (
    <div className="p-10 min-h-screen bg-[#FDFDFB]">
      <div className="max-w-[1000px] mx-auto">
        <PageHeader title="Activity Feed" subtitle="Real-time timeline of project updates and team actions" />

        <div className="space-y-10 relative">
          <div className="absolute left-[27px] top-4 bottom-4 w-[1px] bg-[#E7E5E4] z-0" />

          {activities.map((group, groupIdx) => (
            <div key={groupIdx} className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 text-right text-xs font-medium text-[#A8A29E] uppercase tracking-wider">
                  {group.date}
                </div>
                <div className="w-2 h-2 rounded-full bg-[#1C1917] ring-4 ring-[#FDFDFB]" />
              </div>

              <div className="space-y-6 ml-20">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm border border-[#E7E5E4] rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300">
                    <Avatar className="w-10 h-10 border border-white/20 shadow-sm mt-0.5">
                      <AvatarFallback className={`${item.avatar === 'AI' ? 'bg-[#1C1917] text-white' : 'bg-[#FAFAF9] text-[#1C1917]'} text-xs font-light`}>
                        {item.avatar === 'AI' ? <Zap className="w-4 h-4" /> : item.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#1C1917] font-medium">
                          {item.user} <span className="text-[#78716C] font-light">{item.action}</span> {item.target}
                        </span>
                        <span className="text-xs text-[#A8A29E] font-light">{item.time}</span>
                      </div>
                      {item.project && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
                          <span className="text-xs text-[#78716C]">{item.project}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};