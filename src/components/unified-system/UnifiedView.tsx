import React, { useState, useEffect } from 'react';
import { DraftProjectDialog } from './ideation/DraftProjectDialog';
import { ProjectQueue } from './ideation/ProjectQueue';
import { AllocatorEngine } from './allocator/AllocatorEngine';
import { ActiveProjectDetail } from './execution/ActiveProjectDetail';
import { ProjectCompletionDialog } from './execution/ProjectCompletionDialog';
import { LeaveManagementDialog } from './leaves/LeaveManagementDialog';
import { TimetableView } from './timetable/TimetableView';
import { NotificationPanel } from './notifications/NotificationPanel';
import { UnifiedProject, UnifiedEmployee, LeaveRequest, ProjectCategory, Notification } from './types';
import { Button } from '../ui/button';
import { 
  Plus, LayoutGrid, CheckCircle2, Briefcase, Wrench, FlaskConical, 
  Layers, User, UserCog, Calendar, CalendarOff, LayoutDashboard, CalendarRange, Filter, X, Bell 
} from 'lucide-react';

import { fetchRawCSV } from '../ml-model/RecommendationEngine'; 
import csvPath from '../ml-model/datasets/master_employee_task_report.csv?url';

// --- HELPER ICONS ---
const getCategoryIcon = (cat: string) => {
  switch(cat) {
    case 'Client Deliverable': return <Briefcase className="w-3 h-3" />;
    case 'Internal Tool': return <Wrench className="w-3 h-3" />;
    case 'R&D / POC': return <FlaskConical className="w-3 h-3" />;
    default: return <Layers className="w-3 h-3" />;
  }
};

const getCategoryStyle = (cat: string) => {
  switch(cat) {
    case 'Client Deliverable': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Internal Tool': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'R&D / POC': return 'bg-purple-50 text-purple-700 border-purple-100';
    default: return 'bg-slate-50 text-slate-600';
  }
};

export default function UnifiedView() {
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [projects, setProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATE ---
  const [userRole, setUserRole] = useState<'MANAGER' | 'EMPLOYEE'>('MANAGER');
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'TIMETABLE'>('DASHBOARD');
  const [currentUserId] = useState<number>(101); // Mock Logged-in User
  const [employeeFilter, setEmployeeFilter] = useState<number | 'ALL'>('ALL');
  
  // Dialog States
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isAllocatorOpen, setIsAllocatorOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false); 
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Selection States
  const [projectToAllocate, setProjectToAllocate] = useState<UnifiedProject | null>(null);
  const [selectedActiveProject, setSelectedActiveProject] = useState<UnifiedProject | null>(null);
  const [projectToComplete, setProjectToComplete] = useState<UnifiedProject | null>(null);

  // Data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- NOTIFICATION HELPER ---
  const sendNotification = (
    role: 'MANAGER' | 'EMPLOYEE' | 'ALL', 
    title: string, 
    message: string, 
    type: 'ASSIGNMENT' | 'COMPLETION' | 'LEAVE_UPDATE' | 'SYSTEM',
    recipientId?: number
  ) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      recipientRole: role,
      recipientId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifs = () => setNotifications([]);

  useEffect(() => {
    const initSystem = async () => {
      let loadedEmployees: UnifiedEmployee[] = [];
      let loadedProjects: UnifiedProject[] = [];

      try {
        const rawData = await fetchRawCSV(csvPath);
        const uniqueEmps = new Map<string, UnifiedEmployee>();
        const taskProjects: UnifiedProject[] = [];

        rawData.forEach((row: any, idx: number) => {
          const name = row.Assignee || row.assignee;
          if (!name) return;

          let empId = 0;
          if (!uniqueEmps.has(name)) {
            empId = 1000 + uniqueEmps.size;
            uniqueEmps.set(name, {
              id: empId,
              name: name,
              role: row["Skill Used"] || "Developer",
              skills: [row["Skill Used"]].filter(Boolean),
              efficiencyRating: 1.0 + (Math.random() * 0.5),
              currentLoad: 0,
              availableFrom: new Date().toISOString(),
              totalProjectsCompleted: Math.floor(Math.random() * 20),
              avgHoursPerTask: 0,
              isOnLeave: false
            });
          } else {
            const existing = uniqueEmps.get(name)!;
            empId = existing.id;
            if (row["Skill Used"] && !existing.skills.includes(row["Skill Used"])) {
                existing.skills.push(row["Skill Used"]);
            }
          }

          const projectGroup = row.Project || "General Project";
          const taskName = row["Task Name"] || `Task ${idx + 1}`;
          const plannedHours = parseInt(row["Planned Hours"] || "40");
          
          let category: ProjectCategory = 'Client Deliverable';
          const lowerProj = projectGroup.toLowerCase();
          if (lowerProj.includes('hr') || lowerProj.includes('internal')) category = 'Internal Tool';
          else if (lowerProj.includes('bot') || lowerProj.includes('analytics')) category = 'R&D / POC';

          taskProjects.push({
             id: `task_${idx}`,
             title: taskName,
             description: `${projectGroup} - ${row["Skill Used"] || 'Development'}`,
             status: 'ACTIVE',
             category: category,
             requiredSkills: [row["Skill Used"] || "General"],
             estimatedHours: plannedHours,
             priority: 'Medium',
             assignedTeamIds: [empId]
          });
          
          const emp = uniqueEmps.get(name)!;
          emp.currentLoad = Math.min(100, emp.currentLoad + 20);
        });

        loadedEmployees = Array.from(uniqueEmps.values());
        loadedProjects = taskProjects;

      } catch (error) { console.error("CSV Load Failed:", error); }

      if (loadedEmployees.length === 0) {
        const mockData: UnifiedEmployee[] = [
           { id: 101, name: "Aarav Sharma", role: "Backend Development", skills: ["Backend Development"], efficiencyRating: 1.4, currentLoad: 40, availableFrom: "", totalProjectsCompleted: 15, avgHoursPerTask: 0, isOnLeave: false },
           { id: 102, name: "Rohan Patel", role: "Frontend Development", skills: ["Frontend Development"], efficiencyRating: 1.2, currentLoad: 60, availableFrom: "", totalProjectsCompleted: 8, avgHoursPerTask: 0, isOnLeave: false },
        ];
        loadedEmployees = mockData;
        loadedProjects = [
           { id: 'seed_1', title: 'Fintech Platform Revamp - Task 1', description: 'Fintech Platform Revamp - Backend', status: 'ACTIVE', category: 'Client Deliverable', requiredSkills: ['Backend'], estimatedHours: 8, priority: 'High', assignedTeamIds: [101] },
           { id: 'seed_2', title: 'Fintech Platform Revamp - Task 2', description: 'Fintech Platform Revamp - Frontend', status: 'ACTIVE', category: 'Client Deliverable', requiredSkills: ['Frontend'], estimatedHours: 16, priority: 'High', assignedTeamIds: [102] }
        ];
      }

      setEmployees(loadedEmployees);
      setProjects(loadedProjects);
      
      setLeaveRequests([
        { id: 'lr_1', employeeId: 1002, employeeName: 'Vikram Singh', startDate: '2023-11-20', endDate: '2023-11-22', reason: 'Medical checkup', status: 'PENDING', type: 'Sick' }
      ]);
      
      setNotifications([
         { id: 'n1', recipientRole: 'MANAGER', title: 'System Ready', message: 'Unified Resource OS initialized successfully.', type: 'SYSTEM', timestamp: new Date().toISOString(), isRead: false }
      ]);

      setIsLoading(false);
    };
    initSystem();
  }, []);

  // --- HANDLERS ---
  const handleAddProject = (newProject: UnifiedProject) => setProjects(prev => [...prev, newProject]);
  const handleDeleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));
  
  const handleAllocateStart = (project: UnifiedProject) => { setProjectToAllocate(project); setIsAllocatorOpen(true); };
  
  const handleConfirmAllocation = (projectId: string, selectedIds: number[]) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'ACTIVE', assignedTeamIds: selectedIds, startDate: new Date().toISOString() } : p));
    setEmployees(prev => prev.map(emp => selectedIds.includes(emp.id) ? { ...emp, currentLoad: Math.min(100, emp.currentLoad + 25) } : emp));
    
    // Notify
    const project = projects.find(p => p.id === projectId);
    selectedIds.forEach(empId => {
      sendNotification('EMPLOYEE', 'New Project Assigned', `You have been assigned to "${project?.title}".`, 'ASSIGNMENT', empId);
    });

    setIsAllocatorOpen(false); setProjectToAllocate(null);
  };

  const openCompletionDialog = () => { if (selectedActiveProject) { setProjectToComplete(selectedActiveProject); setIsCompletionOpen(true); } };
  
  const finalizeCompletion = () => {
    if (!projectToComplete) return;
    setProjects(prev => prev.map(p => p.id === projectToComplete.id ? { ...p, status: 'COMPLETED' } : p));
    setEmployees(prev => prev.map(emp => {
      if (projectToComplete.assignedTeamIds.includes(emp.id)) {
         return { ...emp, currentLoad: Math.max(0, emp.currentLoad - 25), totalProjectsCompleted: emp.totalProjectsCompleted + 1, efficiencyRating: parseFloat((emp.efficiencyRating + 0.1).toFixed(1)) };
      }
      return emp;
    }));
    
    // Notify Manager
    const completer = employees.find(e => e.id === currentUserId);
    sendNotification('MANAGER', 'Project Completed', `A project "${projectToComplete.title}" has been marked as complete.`, 'COMPLETION');

    setIsCompletionOpen(false); setSelectedActiveProject(null); setProjectToComplete(null);
  };

  const handleRequestLeave = (req: LeaveRequest) => { 
    setLeaveRequests(prev => [...prev, req]);
    sendNotification('MANAGER', 'New Leave Request', `${req.employeeName} requested leave for ${req.type}.`, 'LEAVE_UPDATE');
  };
  
  const handleLeaveDecision = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLeaveRequests(prev => prev.map(req => {
        if (req.id === id) return { ...req, status };
        return req;
    }));
    const req = leaveRequests.find(r => r.id === id);
    if (req) {
       if (status === 'APPROVED') {
         setEmployees(prev => prev.map(e => e.id === req.employeeId ? { ...e, isOnLeave: true, currentLoad: 0 } : e));
       }
       sendNotification('EMPLOYEE', `Leave ${status}`, `Your leave request for ${req.startDate} has been ${status.toLowerCase()}.`, 'LEAVE_UPDATE', req.employeeId);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead && (n.recipientRole === 'ALL' || n.recipientRole === userRole)).length;

  if (isLoading) return <div className="p-20 text-center text-slate-500 animate-pulse">Initializing Unified Resource OS...</div>;

  if (selectedActiveProject) {
    const projectTeam = employees.filter(e => selectedActiveProject.assignedTeamIds.includes(e.id));
    return (
      <ActiveProjectDetail 
        project={selectedActiveProject} 
        team={projectTeam} 
        onBack={() => setSelectedActiveProject(null)} 
        onComplete={openCompletionDialog} 
      />
    );
  }

  const queuedProjects = projects.filter(p => p.status === 'QUEUED');
  
  // FILTER LOGIC
  const allActiveProjects = projects.filter(p => p.status === 'ACTIVE');
  const filteredActiveProjects = employeeFilter === 'ALL' 
    ? allActiveProjects 
    : allActiveProjects.filter(p => p.assignedTeamIds.includes(employeeFilter));

  const actualUserId = employees.find(e => e.id === currentUserId) ? currentUserId : (employees[0]?.id || 101);
  const myProjects = allActiveProjects.filter(p => p.assignedTeamIds.includes(actualUserId));
  const currentUser = employees.find(e => e.id === actualUserId);
  const pendingLeaves = leaveRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm z-20 relative">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-indigo-600" />
            Unified Resource OS
          </h1>
          <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
            Viewing as: 
            <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${userRole === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {userRole}
            </span>
             <span className="text-xs text-slate-400">({currentUser?.name || 'Unknown'})</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
           {/* VIEW TOGGLE */}
           <div className="bg-slate-100 p-1 rounded-lg flex items-center mr-2">
              <button onClick={() => setViewMode('DASHBOARD')} className={`p-2 rounded-md transition-all ${viewMode === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Dashboard"><LayoutDashboard className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('TIMETABLE')} className={`p-2 rounded-md transition-all ${viewMode === 'TIMETABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Timetable"><CalendarRange className="w-4 h-4" /></button>
           </div>

           {/* ADD PROJECT */}
           {userRole === 'MANAGER' && (
             <Button onClick={() => setIsDraftOpen(true)} className="bg-indigo-600 text-white shadow-lg hover:bg-indigo-700">
               <Plus className="w-4 h-4 mr-2" /> New Project
             </Button>
           )}

           {/* NOTIFICATION BELL */}
           <div className="relative">
             <Button variant="ghost" className="relative text-slate-500 hover:bg-slate-50" onClick={() => setIsNotifOpen(!isNotifOpen)}>
               <Bell className={`w-5 h-5 ${isNotifOpen ? 'text-indigo-600' : ''}`} />
               {unreadCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
             </Button>
             <NotificationPanel 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)}
                notifications={notifications}
                userRole={userRole}
                currentUserId={actualUserId}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearNotifs}
             />
           </div>

           {/* LEAVE BUTTON */}
           <Button variant="outline" onClick={() => setIsLeaveOpen(true)} className="relative border-slate-200 text-slate-600 hover:bg-slate-50">
             <CalendarOff className="w-4 h-4 mr-2" /> {userRole === 'MANAGER' ? 'Approvals' : 'Time Off'}
             {userRole === 'MANAGER' && pendingLeaves > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm animate-bounce">{pendingLeaves}</span>}
           </Button>

           {/* ROLE SWITCHER */}
           <div className="bg-slate-100 p-1 rounded-lg flex items-center">
              <button onClick={() => setUserRole('MANAGER')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${userRole === 'MANAGER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><UserCog className="w-4 h-4" /> Manager</button>
              <button onClick={() => setUserRole('EMPLOYEE')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${userRole === 'EMPLOYEE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><User className="w-4 h-4" /> Employee</button>
           </div>
        </div>
      </div>

      {/* --- CONTENT AREA SWITCHER --- */}
      {viewMode === 'TIMETABLE' ? (
         <TimetableView 
           userRole={userRole} 
           currentUserId={actualUserId}
           projects={projects}
           employees={employees}
           leaveRequests={leaveRequests}
         />
      ) : (
        <>
          {/* MANAGER VIEW */}
          {userRole === 'MANAGER' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">1</div><h2 className="text-lg font-bold text-gray-800">Ideation Queue ({queuedProjects.length})</h2></div>
                <ProjectQueue projects={projects} onAllocateStart={handleAllocateStart} onDelete={handleDeleteProject} />
              </div>

              <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-4">
                
                {/* FILTER HEADER */}
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
                       <h2 className="text-lg font-bold text-gray-800">Active Allocations ({filteredActiveProjects.length})</h2>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter By:</span>
                        <select 
                            value={employeeFilter} 
                            onChange={(e) => setEmployeeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                            className="text-sm bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
                        >
                            <option value="ALL">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                        {employeeFilter !== 'ALL' && (
                            <button onClick={() => setEmployeeFilter('ALL')} className="ml-1 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        )}
                    </div>
                </div>

                {filteredActiveProjects.length === 0 ? (
                    <div className="text-center p-10 bg-slate-50 border border-dashed rounded-xl text-slate-400">
                        {employeeFilter === 'ALL' ? "No active projects." : "No active projects found for this employee."}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredActiveProjects.slice(0, 12).map(p => (
                        <div key={p.id} onClick={() => setSelectedActiveProject(p)} className="bg-white border border-emerald-100 p-5 rounded-xl shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                          <div className="mb-3">
                              <div className="flex justify-between items-start"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border w-fit mb-1 ${getCategoryStyle(p.category)}`}>{getCategoryIcon(p.category)} {p.category}</span><span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">RUNNING</span></div>
                              <h3 className="font-bold text-gray-900 truncate pr-4 text-lg">{p.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 mb-4"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{p.assignedTeamIds.length} Resources Assigned</div>
                          <div className="flex -space-x-2 overflow-hidden">
                              {p.assignedTeamIds.slice(0, 5).map(id => {
                                  const emp = employees.find(e => e.id === id);
                                  return <div key={id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{emp?.name?.substring(0,2).toUpperCase()}</div>
                              })}
                          </div>
                        </div>
                      ))}
                      {filteredActiveProjects.length > 12 && (
                          <div className="flex items-center justify-center text-slate-400 text-sm italic col-span-full">
                            + {filteredActiveProjects.length - 12} more active tasks
                          </div>
                      )}
                    </div>
                )}
              </div>
            </>
          )}

          {/* EMPLOYEE VIEW */}
          {userRole === 'EMPLOYEE' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase">My Workload</h3>
                        <div className="text-3xl font-black text-indigo-600 mt-2">{currentUser?.currentLoad}%</div>
                        <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${currentUser?.currentLoad}%` }}></div></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase">Active Projects</h3><div className="text-3xl font-black text-emerald-600 mt-2">{myProjects.length}</div></div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase">Efficiency Score</h3><div className="text-3xl font-black text-purple-600 mt-2">{currentUser?.efficiencyRating.toFixed(1)}</div></div>
                </div>

                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-600" /> My Assigned Projects</h2>
                    {myProjects.length === 0 ? (
                        <div className="bg-slate-50 p-8 rounded-xl border border-dashed text-center text-slate-500">You have no active project assignments.</div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {myProjects.map(p => (
                                <div key={p.id} onClick={() => setSelectedActiveProject(p)} className="bg-white border-l-4 border-l-indigo-500 p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getCategoryStyle(p.category)}`}>{p.category}</span><span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> Due Soon</span></div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-2">{p.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
                                    <Button className="w-full mt-4 bg-slate-50 text-indigo-600 hover:bg-indigo-50 border border-indigo-100">Open Workspace</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          )}
        </>
      )}

      {/* DIALOGS */}
      <DraftProjectDialog open={isDraftOpen} onOpenChange={setIsDraftOpen} onSave={handleAddProject} />
      <AllocatorEngine open={isAllocatorOpen} onOpenChange={setIsAllocatorOpen} project={projectToAllocate} employees={employees} onConfirmAllocation={handleConfirmAllocation} />
      <ProjectCompletionDialog open={isCompletionOpen} onOpenChange={setIsCompletionOpen} project={projectToComplete} team={employees.filter(e => projectToComplete?.assignedTeamIds.includes(e.id))} onConfirm={finalizeCompletion} />
      <LeaveManagementDialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen} userRole={userRole} currentUserId={actualUserId} currentUser={currentUser} requests={leaveRequests} onRequestLeave={handleRequestLeave} onApproveReject={handleLeaveDecision} />
    </div>
  );
}