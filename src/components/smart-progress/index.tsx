import React, { useState } from 'react';
import { ManagerView } from './ManagerView';
import { EmployeeView } from './EmployeeView';
import { SmartTask } from './types';
import { UserCircle2, ShieldCheck } from 'lucide-react';

export default function SmartProgressTracker() {
  const [activeTab, setActiveTab] = useState<'manager' | 'employee'>('manager');
  
  // INITIAL STATE WITH WEIGHTS
  const [tasks, setTasks] = useState<SmartTask[]>([
    {
      id: 1,
      title: "Payment Gateway Integration",
      assignee: "John Doe",
      scope: [
        { id: '1', name: "Stripe API Setup", weight: 20, isCompleted: false },
        { id: '2', name: "Backend Integration", weight: 50, isCompleted: false },
        { id: '3', name: "Unit Testing", weight: 30, isCompleted: false },
      ],
      progress: 0,
      lastUpdate: "",
      lastUpdatedTime: ""
    },
    {
      id: 2,
      title: "Authentication Module",
      assignee: "John Doe",
      scope: [
        { id: 'a', name: "Login UI", weight: 40, isCompleted: true },
        { id: 'b', name: "OAuth Logic", weight: 60, isCompleted: false },
      ],
      progress: 40, // 40 because Login UI is done
      lastUpdate: "Initial Setup",
      lastUpdatedTime: "09:00 AM"
    }
  ]);

  const handleTaskUpdate = (taskId: number, updates: Partial<SmartTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Persona Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Progress Tracker</h1>
          <p className="text-slate-500 text-sm">Weighted Task Analysis</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manager' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Manager
          </button>
          <button 
            onClick={() => setActiveTab('employee')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'employee' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserCircle2 className="w-4 h-4" /> Employee
          </button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'manager' ? (
          <ManagerView tasks={tasks} onUpdateTask={handleTaskUpdate} />
        ) : (
          <EmployeeView tasks={tasks} currentUser="John Doe" onUpdateTask={handleTaskUpdate} />
        )}
      </div>
    </div>
  );
}