import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Zap, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainDashboard from '@/components/dashboard/MainDashboard';
import { ProjectDashboardWithInsights } from '@/components/dashboard/ProjectDashboardWithInsights';
import { useState } from 'react';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      isActive: location.pathname === '/dashboard',
    },
    {
      label: 'Projects',
      icon: Briefcase,
      action: () => navigate('/projects'),
      isActive: location.pathname === '/projects',
    },
    {
      label: 'Plan',
      icon: Zap,
      action: () => navigate('/progress'),
      isActive: location.pathname === '/progress',
    },
    {
      label: 'People',
      icon: Users,
      action: () => navigate('/people'),
      isActive: location.pathname === '/people',
    },
    {
      label: 'Leave',
      icon: Calendar,
      action: () => navigate('/leave'),
      isActive: location.pathname === '/leave',
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#FAFAF9]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#1A1A1A] text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 rounded-2xl bg-[#14B8A6] flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && <span className="text-lg font-semibold">Velocity AI</span>}
          </div>
        </div>

        <div className="h-px bg-[#333333]" />

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === 'Dashboard';
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#14B8A6] text-white'
                    : 'text-[#999999] hover:text-white hover:bg-[#2A2A2A]'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-light">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="h-px bg-[#333333]" />

        {/* Settings & Logout */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#999999] hover:text-white hover:bg-[#2A2A2A] transition-all duration-200"
            title={!sidebarOpen ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-light">Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#EF4444] hover:text-[#FF6B6B] hover:bg-[#2A2A2A] transition-all duration-200"
            title={!sidebarOpen ? 'Log Out' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-light">Log Out</span>}
          </button>
        </div>

        <div className="h-px bg-[#333333]" />

        {/* User Profile */}
        <div className="p-4">
          <button
            className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity"
            title={!sidebarOpen ? 'John Doe' : ''}
          >
            <div className="w-10 h-10 rounded-lg bg-[#333333] flex items-center justify-center flex-shrink-0 text-sm font-semibold">
              JD
            </div>
            {sidebarOpen && (
              <div className="text-left min-w-0">
                <div className="text-sm font-light text-white truncate">John Doe</div>
                <div className="text-xs text-[#999999] truncate">Product Lead</div>
              </div>
            )}
          </button>
        </div>

        {/* Toggle Button */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full h-10 text-[#999999] hover:text-white hover:bg-[#2A2A2A]"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation with Tabs */}
        <nav className="bg-white/70 backdrop-blur-[32px] border-b border-[#E7E5E4] sticky top-0 z-40">
          <div className="px-12 py-4">
            <div className="flex gap-8 border-b border-[#E7E5E4]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-2 text-sm font-light transition-colors ${
                  activeTab === 'overview'
                    ? 'text-[#1C1917] border-b-2 border-[#1C1917]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('project')}
                className={`pb-4 px-2 text-sm font-light transition-colors ${
                  activeTab === 'project'
                    ? 'text-[#1C1917] border-b-2 border-[#1C1917]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Project Details
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' ? (
            <MainDashboard />
          ) : (
            <ProjectDashboardWithInsights projectId="1" projectName="Velocity AI Platform Redesign" />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
