import React, { useState } from 'react';
import { ManagerView } from './ManagerView';
import { EmployeeView } from './EmployeeView';
import { SmartTask } from './types';
import { UserCircle2, ShieldCheck } from 'lucide-react';

export default function SmartProgressTracker() {
  const [activeTab, setActiveTab] = useState<'manager' | 'employee'>('manager');
  
  // SHARED STATE - This ensures automation. 
  // Manager watches this state. Employee updates this state.
  const [tasks, setTasks] = useState<SmartTask[]>([
    {
      id: 1,
      title: "Payment Gateway Integration",
      assignee: "John Doe",
      scope: ["Stripe API", "Refund Logic", "Webhook Handler", "UI Modal"],
      completedScope: [],
      progress: 0,
      lastUpdate: "",
      lastUpdatedTime: ""
    },
    {
      id: 2,
      title: "Authentication Module",
      assignee: "John Doe",
      scope: ["Login Page", "OAuth Setup", "Forgot Password"],
      completedScope: ["Login Page"],
      progress: 33,
      lastUpdate: "Initial setup",
      lastUpdatedTime: "10:00 AM"
    }
  ]);

  const handleTaskUpdate = (taskId: number, updates: Partial<SmartTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Persona Switcher Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Progress Tracker</h1>
          <p className="text-slate-500 text-sm">AI-Verified Workflows</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manager' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Manager View (Automated)
          </button>
          <button 
            onClick={() => setActiveTab('employee')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'employee' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserCircle2 className="w-4 h-4" /> Employee View (Action)
          </button>
        </div>
      </div>

      {/* View Rendering */}
      <div className="min-h-[500px]">
        {activeTab === 'manager' ? (
          <ManagerView tasks={tasks} />
        ) : (
          <EmployeeView 
            tasks={tasks} 
            currentUser="John Doe" 
            onUpdateTask={handleTaskUpdate} 
          />
        )}
      </div>
    </div>
  );
}