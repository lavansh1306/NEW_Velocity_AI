import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  UserCircle2,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';

// ==================== SHARED COMPONENTS ====================

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'Active': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'At Risk': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    'Delayed': 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]',
    'Completed': 'bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]',
    'Healthy': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'Overloaded': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    'Not Started': 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]',
    'In Progress': 'bg-white text-[#1C1917] border border-[#E7E5E4]',
    'Pending': 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]',
    'Approved': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'Denied': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-light ${variants[status] || 'bg-[#FAFAF9] text-[#78716C]'}`}>
      {status}
    </span>
  );
};

const UtilizationBar = ({ value }: { value: number }) => {
  const color = value > 110 ? 'bg-[#BE123C]' : value > 90 ? 'bg-[#BE123C]' : 'bg-[#0F766E]';
  const width = Math.min(value, 150);
  
  return (
    <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const HealthIndicator = ({ score, showModelConfidence }: { score: number; showModelConfidence?: boolean }) => {
  const color = score >= 80 ? 'text-[#0F766E]' : score >= 60 ? 'text-[#BE123C]' : 'text-[#BE123C]';
  const bgColor = score >= 80 ? 'bg-[#F0FDFA]' : score >= 60 ? 'bg-[#FFF1F2]' : 'bg-[#FFF1F2]';
  
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center`}>
          <span className={`text-xl font-light ${color}`}>{score}</span>
        </div>
      </div>
      {showModelConfidence && (
        <div className="text-xs text-[#A8A29E] font-light mt-2">
          Model confidence: 84%
        </div>
      )}
    </div>
  );
};

// ==================== NEW AI COMPONENTS ====================

interface AIRecommendationCardProps {
  title: string;
  metrics: string;
  pros: string[];
  cons: string[];
  isSelected: boolean;
  onSelect: () => void;
  onViewImpact: () => void;
}

export const AIRecommendationCard = ({
  title,
  metrics,
  pros,
  cons,
  isSelected,
  onSelect,
  onViewImpact
}: AIRecommendationCardProps) => {
  return (
    <div 
      className={`p-5 rounded-2xl border-[0.5px] border-l-[3px] transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] ${
        isSelected ? 'bg-[#F0FDFA] border-l-[#0F766E] border-[#CCFBF1]' : 'bg-[#FAFAF9] border-l-[#0F766E] border-[#E7E5E4]'
      } cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-[#1C1917] font-medium text-sm leading-tight mb-1.5">
            {title}
          </h3>
          
          <p className="text-sm text-[#57534E] font-light leading-relaxed mb-2">
            {pros.join('. ')}. {cons.length > 0 && <span className="opacity-70">{cons.join('. ')}.</span>}
          </p>
          
          <div className="text-[#A8A29E] text-xs font-normal tracking-wide">
            {metrics}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 text-xs border-[#E7E5E4] bg-white hover:bg-[#F5F5F4] text-[#78716C] hover:text-[#1C1917] font-normal transition-all rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              onViewImpact();
            }}
          >
            Ignore
          </Button>
          <Button 
            size="sm"
            className={`h-9 text-xs font-normal transition-all shadow-sm hover:shadow-md rounded-lg ${
              isSelected 
                ? 'bg-[#1C1917] text-white hover:bg-[#292524]' 
                : 'bg-[#1C1917] text-white hover:bg-[#292524]'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AILoadingOverlay = ({ 
  isVisible, 
  stageText = "Matching team members" 
}: { 
  isVisible: boolean;
  stageText?: string;
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-[#CCFBF1] rounded-full blur-xl opacity-50 animate-pulse" />
        <Zap className="w-16 h-16 text-[#1C1917] relative z-10 animate-pulse" strokeWidth={1} />
      </div>
      
      <h2 className="text-[20px] font-light text-[#292524] mb-8">Analyzing project requirements</h2>
      
      <div className="w-[400px] h-1 bg-[#F5F5F4] rounded-full overflow-hidden mb-4">
        <div className="h-full bg-[#1C1917] animate-[progress_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
      </div>
      
      <p className="text-[12px] text-[#A8A29E] font-light">
        Currently: <span className="text-[#78716C] font-light">{stageText}</span>
      </p>
    </div>
  );
};

export const CreateProjectScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [lead, setLead] = useState('');
  const [type, setType] = useState('scrum');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [tasks, setTasks] = useState<{id: number, title: string, assignee: string, hours: string, timeline: string}[]>([
    { id: 1, title: '', assignee: '', hours: '', timeline: '' }
  ]);

  const users = [
    { id: '1', name: 'Sarah Chen', role: 'Frontend Lead', avatar: 'SC', capacity: '20%' },
    { id: '2', name: 'Marcus Johnson', role: 'Backend Dev', avatar: 'MJ', capacity: '100%' },
    { id: '3', name: 'Emily Rodriguez', role: 'Product Designer', avatar: 'ER', capacity: '60%' },
    { id: '4', name: 'David Kim', role: 'Full Stack', avatar: 'DK', capacity: '0%' },
    { id: '5', name: 'Alex Wong', role: 'QA Engineer', avatar: 'AW', capacity: '80%' },
    { id: '6', name: 'Jessica Lee', role: 'Product Manager', avatar: 'JL', capacity: '40%' },
  ];

  useEffect(() => {
    if (name) {
      setKey(name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 4));
    }
  }, [name]);

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(m => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const updateTask = (id: number, field: string, value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), title: '', assignee: '', hours: '', timeline: '' }]);
  };

  const removeTask = (id: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
       <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.03) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/projects')} className="hover:bg-white/50">
             <ArrowLeft className="w-5 h-5 text-[#78716C]" />
          </Button>
          <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">Create New Project</h1>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="grid grid-cols-12 gap-10 mb-10">
                {/* Left Column - Details */}
                <div className="col-span-7 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="name" className="text-xs font-medium text-[#78716C] uppercase tracking-wide">Project Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 border-[#E7E5E4] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] transition-all"
                        placeholder="e.g. Mobile App Redesign"
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="key" className="text-xs font-medium text-[#78716C] uppercase tracking-wide">Key</Label>
                      <Input 
                        id="key" 
                        value={key} 
                        onChange={(e) => setKey(e.target.value)}
                        className="h-10 border-[#E7E5E4] bg-[#FAFAF9] font-mono text-sm uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs font-medium text-[#78716C] uppercase tracking-wide">Project Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="h-10 border-[#E7E5E4] bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scrum">Scrum Software Development</SelectItem>
                        <SelectItem value="kanban">Kanban Software Development</SelectItem>
                        <SelectItem value="business">Business Project</SelectItem>
                        <SelectItem value="marketing">Marketing Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead" className="text-xs font-medium text-[#78716C] uppercase tracking-wide">Project Lead</Label>
                    <Select value={lead} onValueChange={setLead}>
                      <SelectTrigger className="h-10 border-[#E7E5E4] bg-white">
                        <SelectValue placeholder="Select a lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-[10px] bg-[#FAFAF9]">{user.avatar}</AvatarFallback>
                              </Avatar>
                              <span>{user.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-medium text-[#78716C] uppercase tracking-wide">Description</Label>
                    <Textarea 
                      id="description" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] border-[#E7E5E4] bg-white resize-none focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917]"
                      placeholder="Describe the project goals and objectives..."
                    />
                  </div>
                </div>
                </div>

                {/* Right Column - Team Selection */}
                <div className="col-span-5 bg-[#FAFAF9] rounded-xl p-6 border border-[#E7E5E4]/50">
                  <h3 className="text-sm font-medium text-[#1C1917] mb-4 flex items-center justify-between">
                    Add Team Members
                    <span className="text-xs font-normal text-[#78716C] bg-white px-2 py-1 rounded-full border border-[#E7E5E4]">{selectedMembers.length} selected</span>
                  </h3>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {users.map(user => {
                      const isSelected = selectedMembers.includes(user.id);
                      return (
                        <div 
                          key={user.id}
                          onClick={() => toggleMember(user.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                            isSelected 
                              ? 'bg-white border-[#1C1917] shadow-sm' 
                              : 'bg-white border-transparent hover:border-[#E7E5E4] hover:shadow-sm'
                          }`}
                        >
                          <div className="relative">
                            <Avatar className="w-10 h-10 border border-[#E7E5E4]">
                              <AvatarFallback className="bg-[#FAFAF9] text-[#1C1917] text-xs font-medium">{user.avatar}</AvatarFallback>
                            </Avatar>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#1C1917] rounded-full border-2 border-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1C1917] truncate">{user.name}</div>
                            <div className="text-xs text-[#78716C] truncate">{user.role}</div>
                          </div>
                          
                          <div className={`text-xs px-2 py-1 rounded-md ${
                            parseInt(user.capacity) > 80 ? 'bg-[#FFF1F2] text-[#BE123C]' : 
                            parseInt(user.capacity) > 50 ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#F0FDFA] text-[#0F766E]'
                          }`}>
                            {user.capacity}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Initial Tasks Section */}
              <div className="pt-8 border-t border-[#E7E5E4]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-medium text-[#1C1917]">Initial Project Plan</h3>
                    <p className="text-sm text-[#78716C] font-light">Outline key tasks and assign responsibilities</p>
                  </div>
                  <Button onClick={addTask} size="sm" variant="outline" className="border-[#E7E5E4] text-[#57534E] hover:bg-[#FAFAF9]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>

                <div className="rounded-xl border border-[#E7E5E4] overflow-hidden bg-white">
                  <table className="w-full">
                    <thead className="bg-[#FAFAF9] border-b border-[#E7E5E4]">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[#78716C] uppercase tracking-wide w-[35%]">Task Name</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[#78716C] uppercase tracking-wide w-[25%]">Assignee</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[#78716C] uppercase tracking-wide w-[15%]">Est. Hours</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[#78716C] uppercase tracking-wide w-[20%]">Timeline</th>
                        <th className="w-[5%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F4]">
                      {tasks.map((task) => (
                        <tr key={task.id} className="group hover:bg-[#FAFAF9]/50 transition-colors">
                          <td className="p-3">
                            <Input 
                              value={task.title}
                              onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                              placeholder="e.g. Database Setup"
                              className="h-9 border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917] bg-transparent focus:bg-white transition-all font-light"
                            />
                          </td>
                          <td className="p-3">
                            <Select 
                              value={task.assignee} 
                              onValueChange={(val) => updateTask(task.id, 'assignee', val)}
                            >
                              <SelectTrigger className="h-9 border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917] bg-transparent focus:bg-white">
                                <SelectValue placeholder="Unassigned" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedMembers.length > 0 ? (
                                  users
                                    .filter(u => selectedMembers.includes(u.id))
                                    .map(u => (
                                      <SelectItem key={u.id} value={u.id}>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-5 h-5">
                                            <AvatarFallback className="text-[10px] bg-[#FAFAF9]">{u.avatar}</AvatarFallback>
                                          </Avatar>
                                          <span>{u.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                ) : (
                                  <div className="p-2 text-xs text-[#A8A29E] text-center">Select team members first</div>
                                )}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Input 
                              value={task.hours}
                              onChange={(e) => updateTask(task.id, 'hours', e.target.value)}
                              placeholder="0"
                              type="number"
                              className="h-9 border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917] bg-transparent focus:bg-white transition-all font-light"
                            />
                          </td>
                          <td className="p-3">
                             <Input 
                              value={task.timeline}
                              onChange={(e) => updateTask(task.id, 'timeline', e.target.value)}
                              placeholder="e.g. Week 1"
                              className="h-9 border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917] bg-transparent focus:bg-white transition-all font-light"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => removeTask(task.id)}
                              className="text-[#D6D3D1] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tasks.length === 0 && (
                    <div className="p-8 text-center bg-[#FAFAF9]">
                       <p className="text-sm text-[#A8A29E] mb-2">No tasks added yet</p>
                       <Button onClick={addTask} variant="outline" size="sm" className="text-xs">Add First Task</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-[#E7E5E4] bg-[#FAFAF9] flex justify-end gap-4">
               <Button variant="outline" onClick={() => navigate('/app/projects')} className="border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]">Cancel</Button>
               <Button onClick={() => navigate('/app/projects')} className="bg-[#1C1917] text-white hover:bg-[#292524] shadow-sm px-6">Create Project</Button>
            </div>
        </div>
      </div>
    </div>
  );
};

const PROJECT_DATA: Record<string, any> = {
  '1': {
    title: "Velocity AI Platform Redesign",
    status: "At Risk",
    startDate: "Jan 15, 2026",
    endDate: "Mar 30, 2026",
    daysRemaining: 44,
    healthScore: 72,
    feasibilityScore: 85,
    metrics: {
      totalEstimatedHours: 1240,
      actualLoggedHours: 856,
      remainingHours: 384,
      completion: 69,
      teamSize: 8
    },
    tasks: [
      { id: '1', key: 'VEL-1024', title: 'Design System Audit', assignee: 'Sarah Chen', assigneeInitials: 'SC', status: 'In Progress', priority: 'High' },
      { id: '2', key: 'VEL-1025', title: 'Authentication API', assignee: 'Marcus Johnson', assigneeInitials: 'MJ', status: 'Pending', priority: 'High' },
      { id: '3', key: 'VEL-1026', title: 'Dashboard Layout', assignee: 'Emily Rodriguez', assigneeInitials: 'ER', status: 'In Progress', priority: 'Medium' },
      { id: '4', key: 'VEL-1027', title: 'User Profile Settings', assignee: 'David Kim', assigneeInitials: 'DK', status: 'Not Started', priority: 'Low' },
      { id: '5', key: 'VEL-1028', title: 'Database Migration Script', assignee: 'Marcus Johnson', assigneeInitials: 'MJ', status: 'In Progress', priority: 'High' },
    ],
    team: [
      { name: "Sarah Chen", role: "Frontend Lead", assignedHours: 40, actualHours: 48, utilization: 120, completion: 75, status: "Overloaded", avatar: "SC" },
      { name: "Marcus Johnson", role: "Backend Developer", assignedHours: 40, actualHours: 38, utilization: 95, completion: 82, status: "Healthy", avatar: "MJ" },
      { name: "Emily Rodriguez", role: "UI Designer", assignedHours: 30, actualHours: 28, utilization: 93, completion: 88, status: "Healthy", avatar: "ER" },
      { name: "David Kim", role: "Full Stack", assignedHours: 40, actualHours: 45, utilization: 112, completion: 68, status: "Overloaded", avatar: "DK" },
    ],
    scenarios: [
      {
        title: "Balanced Redistribution",
        metrics: "96% completion confidence · No overtime",
        pros: ["Reduces Sarah's load to 95%", "Utilizes available backend capacity"],
        cons: ["Requires 2 knowledge transfer sessions"]
      },
      {
        title: "Timeline Extension",
        metrics: "100% completion confidence · +2 Weeks",
        pros: ["Maintains current team structure", "Lowest risk to quality"],
        cons: ["Delays launch to Apr 14"]
      },
      {
        title: "Add Contractor",
        metrics: "98% completion confidence · +$12k cost",
        pros: ["Accelerates frontend velocity", "Keeps original timeline"],
        cons: ["Onboarding time required", "Budget impact"]
      }
    ]
  },
  '2': {
    title: "Mobile App MVP",
    status: "Active",
    startDate: "Feb 1, 2026",
    endDate: "Mar 15, 2026",
    daysRemaining: 29,
    healthScore: 88,
    feasibilityScore: 92,
    metrics: {
      totalEstimatedHours: 800,
      actualLoggedHours: 320,
      remainingHours: 480,
      completion: 40,
      teamSize: 4
    },
    tasks: [
      { id: '1', key: 'MOB-101', title: 'App Shell Setup', assignee: 'Marcus Johnson', assigneeInitials: 'MJ', status: 'Completed', priority: 'High' },
      { id: '2', key: 'MOB-102', title: 'Login Screen UI', assignee: 'Jessica Lee', assigneeInitials: 'JL', status: 'In Progress', priority: 'High' },
      { id: '3', key: 'MOB-103', title: 'Push Notifications', assignee: 'Marcus Johnson', assigneeInitials: 'MJ', status: 'Not Started', priority: 'Medium' },
    ],
    team: [
      { name: "Jessica Lee", role: "Product Manager", assignedHours: 20, actualHours: 18, utilization: 90, completion: 45, status: "Healthy", avatar: "JL" },
      { name: "Marcus Johnson", role: "Backend Developer", assignedHours: 30, actualHours: 25, utilization: 83, completion: 40, status: "Healthy", avatar: "MJ" },
    ],
    scenarios: []
  },
  '3': {
    title: "API Documentation",
    status: "Active",
    startDate: "Jan 10, 2026",
    endDate: "Feb 28, 2026",
    daysRemaining: 14,
    healthScore: 92,
    feasibilityScore: 98,
    metrics: {
      totalEstimatedHours: 160,
      actualLoggedHours: 120,
      remainingHours: 40,
      completion: 75,
      teamSize: 2
    },
    tasks: [
      { id: '1', key: 'API-201', title: 'Swagger Spec Update', assignee: 'Sarah Chen', assigneeInitials: 'SC', status: 'In Progress', priority: 'High' },
      { id: '2', key: 'API-202', title: 'Authentication Endpoints', assignee: 'Emily Rodriguez', assigneeInitials: 'ER', status: 'Completed', priority: 'Medium' },
    ],
    team: [
      { name: "Emily Rodriguez", role: "UI Designer", assignedHours: 10, actualHours: 8, utilization: 80, completion: 80, status: "Healthy", avatar: "ER" },
      { name: "Sarah Chen", role: "Frontend Lead", assignedHours: 10, actualHours: 12, utilization: 120, completion: 90, status: "Overloaded", avatar: "SC" },
    ],
    scenarios: []
  },
  '4': {
    title: "Infrastructure Migration",
    status: "At Risk",
    startDate: "Feb 15, 2026",
    endDate: "Apr 15, 2026",
    daysRemaining: 60,
    healthScore: 65,
    feasibilityScore: 70,
    metrics: {
      totalEstimatedHours: 600,
      actualLoggedHours: 50,
      remainingHours: 550,
      completion: 8,
      teamSize: 3
    },
    tasks: [],
    team: [
      { name: "Marcus Johnson", role: "Backend Developer", assignedHours: 40, actualHours: 10, utilization: 25, completion: 10, status: "Pending", avatar: "MJ" },
      { name: "David Kim", role: "Full Stack", assignedHours: 40, actualHours: 5, utilization: 12, completion: 5, status: "Pending", avatar: "DK" },
      { name: "Jessica Lee", role: "Product Manager", assignedHours: 10, actualHours: 2, utilization: 20, completion: 15, status: "Healthy", avatar: "JL" },
    ],
    scenarios: []
  },
  '5': {
    title: "Customer Portal",
    status: "Active",
    startDate: "Jan 5, 2026",
    endDate: "Mar 8, 2026",
    daysRemaining: 22,
    healthScore: 95,
    feasibilityScore: 96,
    metrics: {
      totalEstimatedHours: 400,
      actualLoggedHours: 350,
      remainingHours: 50,
      completion: 88,
      teamSize: 2
    },
    tasks: [],
    team: [
      { name: "Sarah Chen", role: "Frontend Lead", assignedHours: 20, actualHours: 18, utilization: 90, completion: 92, status: "Healthy", avatar: "SC" },
      { name: "Emily Rodriguez", role: "UI Designer", assignedHours: 20, actualHours: 19, utilization: 95, completion: 95, status: "Healthy", avatar: "ER" },
    ],
    scenarios: []
  }
};

const TaskTracker = ({ tasks }: { tasks: any[] }) => {
  return (
    <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-light text-[#1C1917]">Project Tasks</h2>
        <Button variant="outline" size="sm" className="h-9 text-xs border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917]">
          View All Tasks
        </Button>
      </div>
      
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center pb-4 border-b border-[#E7E5E4] mb-2 px-2">
          <div className="flex-1 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Task</div>
          <div className="w-40 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Assignee</div>
          <div className="w-28 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Status</div>
          <div className="w-24 text-right text-xs text-[#A8A29E] uppercase tracking-wider font-light">Priority</div>
        </div>

        {/* List */}
        <div className="space-y-1">
          {tasks && tasks.length > 0 ? (
            tasks.map((task, idx) => (
              <div key={idx} className="flex items-center py-3 hover:bg-white/40 transition-colors px-2 -mx-2 rounded-lg group cursor-pointer">
                <div className="flex-1">
                  <div className="text-sm text-[#1C1917] font-medium mb-0.5">{task.title}</div>
                  <div className="text-xs text-[#A8A29E] font-light">{task.key}</div>
                </div>
                <div className="w-40 flex items-center gap-2">
                  <Avatar className="w-6 h-6 border border-[#E7E5E4]">
                    <AvatarFallback className="bg-[#F5F5F4] text-[10px] text-[#1C1917]">{task.assigneeInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-[#57534E] font-light truncate">{task.assignee}</span>
                </div>
                <div className="w-28">
                  <StatusBadge status={task.status} />
                </div>
                <div className="w-24 text-right">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    task.priority === 'High' ? 'bg-[#FFF1F2] text-[#BE123C]' : 
                    task.priority === 'Medium' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#F0FDFA] text-[#0F766E]'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-[#78716C] font-light py-8 text-center bg-[#FAFAF9] rounded-xl border border-dashed border-[#E7E5E4]">
              No tasks tracked for this project yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SCREENS ====================

export const ProjectsListScreen = () => {
  const navigate = useNavigate();
  
  const projects = [
    { 
      id: '1',
      name: 'Velocity AI Platform Redesign', 
      deadline: 'Mar 30, 2026',
      health: 72, 
      progress: 69, 
      team: ['SC', 'MJ', 'ER', 'DK'], 
      alert: true 
    },
    { 
      id: '2',
      name: 'Mobile App MVP', 
      deadline: 'Mar 15, 2026',
      health: 88, 
      progress: 45, 
      team: ['JL', 'MJ'], 
      alert: false 
    },
    { 
      id: '3',
      name: 'API Documentation', 
      deadline: 'Feb 28, 2026',
      health: 92, 
      progress: 78, 
      team: ['ER', 'SC'], 
      alert: false 
    },
    { 
      id: '4',
      name: 'Infrastructure Migration', 
      deadline: 'Apr 15, 2026',
      health: 65, 
      progress: 34, 
      team: ['MJ', 'DK', 'JL'], 
      alert: true 
    },
    { 
      id: '5',
      name: 'Customer Portal', 
      deadline: 'Mar 8, 2026',
      health: 95, 
      progress: 88, 
      team: ['SC', 'ER'], 
      alert: false 
    },
  ];
  
  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.03) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Projects</h1>
          <Button 
            className="bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md"
            onClick={() => navigate('/app/projects/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
        
        <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] shadow-sm overflow-hidden">
          <div className="divide-y divide-[#E7E5E4]">
            {projects.map((project, idx) => (
              <div 
                key={idx} 
                className="py-7 px-8 hover:bg-white/60 cursor-pointer transition-all duration-300"
                onClick={() => navigate(`/app/projects/${project.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-base text-[#1C1917] mb-2 font-light">{project.name}</div>
                    <div className="text-sm text-[#A8A29E] font-light">{project.deadline}</div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        project.health >= 80 ? 'bg-[#F0FDFA] text-[#0F766E]' :
                        project.health >= 60 ? 'bg-[#FFF1F2] text-[#BE123C]' :
                        'bg-[#FFF1F2] text-[#BE123C]'
                      }`}>
                        <span className="text-sm font-light">{project.health}</span>
                      </div>
                    </div>
                    
                    <div className="w-48">
                      <div className="flex items-center gap-3">
                        <Progress value={project.progress} className="h-1.5 flex-1" />
                        <span className="text-sm text-[#78716C] w-10 font-light">{project.progress}%</span>
                      </div>
                    </div>
                    
                    <div className="flex -space-x-2">
                      {project.team.map((initial, i) => (
                        <Avatar key={i} className="w-9 h-9 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-xs font-light">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    
                    <div className="w-8 flex justify-center">
                      {project.alert && (
                        <div className="w-1.5 h-1.5 bg-[#BE123C] rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  
  const projectData = PROJECT_DATA[id || '1'] || PROJECT_DATA['1'];

  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.03) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/app/projects')} 
            className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </button>
        </div>

        <div className="grid grid-cols-12 gap-10">
          {/* Main Content - 8 columns */}
          <div className="col-span-8 space-y-10">
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] p-10 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3">
                    <StatusBadge status={projectData.status} />
                  </div>
                  <h1 className="text-4xl font-light text-[#1C1917] tracking-tight mb-4">{projectData.title}</h1>
                  <div className="flex items-center gap-2 text-sm font-light">
                    <span className="text-[#1C1917]">{projectData.startDate} → {projectData.endDate}</span>
                    <span className="text-[#A8A29E]">· {projectData.daysRemaining} days remaining</span>
                  </div>
                </div>
                <div className="flex items-start gap-12 text-right">
                  <div>
                    <div className="text-xs text-[#A8A29E] mb-2 font-light">Health Score</div>
                    <div className="flex justify-end">
                      <HealthIndicator score={projectData.healthScore} showModelConfidence={false} />
                    </div>
                    <div className="text-xs text-[#A8A29E] mt-2 font-light">Feasibility {projectData.feasibilityScore}%</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">Edit Project</Button>
            </div>
            
            {/* Overview Metrics */}
            <div className="flex items-center gap-8 py-8 px-10 bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl shadow-sm">
              <div className="flex-1">
                <div className="text-3xl font-light text-[#1C1917] mb-2">{projectData.metrics.totalEstimatedHours}</div>
                <div className="text-xs text-[#78716C] font-light">Total Est. Hours</div>
              </div>
              <div className="w-px h-12 bg-[#E7E5E4]"></div>
              <div className="flex-1">
                <div className="text-3xl font-light text-[#1C1917] mb-2">{projectData.metrics.actualLoggedHours}</div>
                <div className="text-xs text-[#78716C] font-light">Actual Hours</div>
              </div>
              <div className="w-px h-12 bg-[#E7E5E4]"></div>
              <div className="flex-1">
                <div className="text-3xl font-light text-[#1C1917] mb-2">{projectData.metrics.remainingHours}</div>
                <div className="text-xs text-[#78716C] font-light">Remaining</div>
              </div>
              <div className="w-px h-12 bg-[#E7E5E4]"></div>
              <div className="flex-1">
                <div className="text-3xl font-light text-[#1C1917] mb-2">{projectData.metrics.completion}%</div>
                <div className="text-xs text-[#78716C] font-light">Completion</div>
              </div>
              <div className="w-px h-12 bg-[#E7E5E4]"></div>
              <div className="flex-1">
                <div className="text-3xl font-light text-[#1C1917] mb-2">{projectData.metrics.teamSize}</div>
                <div className="text-xs text-[#78716C] font-light">Team Size</div>
              </div>
            </div>
            
            {/* Task Tracker */}
            <TaskTracker tasks={projectData.tasks} />

            {/* Team Allocation */}
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Team Allocation</h2>
              <div className="space-y-2">
                {projectData.team.map((member: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="py-5 px-6 hover:bg-white/60 rounded-2xl cursor-pointer transition-all duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-10 h-10 border border-[#E7E5E4] shadow-sm">
                          <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-sm font-light">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm text-[#1C1917] font-light mb-1">{member.name}</div>
                          <div className="text-xs text-[#A8A29E] font-light">{member.role}</div>
                        </div>
                      </div>
                      
                      <div className="w-48 flex items-center gap-3">
                        <div className="flex-1">
                          <UtilizationBar value={member.utilization} />
                        </div>
                        <span className={`text-sm font-light ${member.utilization > 110 ? 'text-[#BE123C]' : 'text-[#1C1917]'}`}>
                          {member.utilization}%
                        </span>
                      </div>
                      
                      <div className="w-28 flex justify-end">
                        <StatusBadge status={member.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* AI Insights Panel - 4 columns */}
          <div className="col-span-4">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm sticky top-28">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">AI Recommendations</h2>
              
              <div className="space-y-4">
                {projectData.scenarios && projectData.scenarios.length > 0 ? (
                  projectData.scenarios.map((scenario: any, idx: number) => (
                    <AIRecommendationCard
                      key={idx}
                      title={scenario.title}
                      metrics={scenario.metrics}
                      pros={scenario.pros}
                      cons={scenario.cons}
                      isSelected={selectedScenario === idx}
                      onSelect={() => setSelectedScenario(idx)}
                      onViewImpact={() => {}}
                    />
                  ))
                ) : (
                  <div className="text-sm text-[#78716C] font-light p-4 bg-[#F5F5F4] rounded-xl text-center">
                    No active AI recommendations for this project.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlanMyProjectScreen = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [thoughtLines, setThoughtLines] = useState<string[]>([]);
  
  const thoughts = [
    'Analyzing similar projects…',
    'Mapping task structure…',
    'Simulating capacity constraints…',
    'Evaluating feasibility…'
  ];
  
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setThoughtLines([]);
    
    thoughts.forEach((thought, idx) => {
      setTimeout(() => {
        setThoughtLines(prev => [...prev, thought]);
        if (idx === thoughts.length - 1) {
          setTimeout(() => {
            setIsAnalyzing(false);
            setHasAnalyzed(true);
          }, 600);
        }
      }, idx * 800);
    });
  };
  
  const generatedTasks = [
    { task: 'Project Setup & Architecture', estimatedHours: 40, confidence: 98 },
    { task: 'User Authentication System', estimatedHours: 80, confidence: 95 },
    { task: 'Dashboard UI Components', estimatedHours: 120, confidence: 92 },
    { task: 'API Integration', estimatedHours: 100, confidence: 88 },
    { task: 'Design System Implementation', estimatedHours: 60, confidence: 94 },
    { task: 'Testing & QA Automation', estimatedHours: 80, confidence: 90 },
  ];

  const recommendedTeam = [
    { name: "Sarah Chen", role: "Frontend Lead", match: 96, avatar: "SC" },
    { name: "Marcus Johnson", role: "Backend Architect", match: 94, avatar: "MJ" },
    { name: "Emily Rodriguez", role: "UI/UX Designer", match: 91, avatar: "ER" },
    { name: "David Kim", role: "Full Stack Engineer", match: 88, avatar: "DK" },
  ];
  
  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.03) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        <h1 className="text-4xl font-light text-[#1C1917] mb-12 tracking-tight">Plan My Project</h1>
        
        <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-10 mb-10 shadow-sm">
          <Label className="text-sm font-light text-[#78716C] mb-3 block">Project Description</Label>
          <Textarea 
            placeholder="Describe your project in detail... What are the goals? What features do you need? Who is the target audience?"
            className="min-h-[180px] mb-6 font-light border-[#E7E5E4] bg-white/50 rounded-xl focus:bg-white"
            defaultValue={hasAnalyzed ? "Build a comprehensive project management platform with AI-powered resource allocation, real-time capacity forecasting, and intelligent task distribution. The platform should support multiple teams, integrate with existing tools like Jira and Asana, and provide predictive analytics for project health and timeline risks." : ""}
          />
          
          {isAnalyzing && (
            <div className="mb-6 p-6 bg-[#F5F5F4] rounded-2xl space-y-3">
              {thoughtLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className="text-sm text-[#1C1917] font-light flex items-center gap-3 animate-in fade-in duration-500"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {line}
                </div>
              ))}
            </div>
          )}
          
          <Button 
            className="bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>
        
        {hasAnalyzed && (
          <>
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
                <div className="text-xs text-[#A8A29E] font-light mb-4">Feasibility Score</div>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] flex items-center justify-center">
                    <span className="text-2xl font-light text-[#0F766E]">87</span>
                  </div>
                  <div className="text-sm text-[#78716C] font-light flex-1 leading-relaxed">
                    High feasibility with current team capacity
                  </div>
                </div>
                <div className="text-xs text-[#A8A29E] font-light mt-3">
                  Model confidence: 91%
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
                <div className="text-xs text-[#A8A29E] font-light mb-4">Est. Duration</div>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAFAF9] flex items-center justify-center">
                    <span className="text-2xl font-light text-[#1C1917]">8w</span>
                  </div>
                  <div className="text-sm text-[#78716C] font-light flex-1 leading-relaxed">
                    Estimated completion: Apr 24, 2026
                  </div>
                </div>
              </div>

               <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
                <div className="text-xs text-[#A8A29E] font-light mb-4">Resource Impact</div>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] flex items-center justify-center">
                    <span className="text-2xl font-light text-[#BE123C]">Hi</span>
                  </div>
                  <div className="text-sm text-[#78716C] font-light flex-1 leading-relaxed">
                    High impact on Frontend team capacity
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] p-10 mb-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-[#1C1917]">Generated Task Breakdown</h2>
                {isReEvaluating && (
                  <div className="flex items-center gap-2 text-sm text-[#1C1917] font-light">
                    <div className="w-1 h-1 bg-[#1C1917] rounded-full animate-pulse" />
                    Re-evaluating…
                  </div>
                )}
              </div>
              
              <div className="w-full">
                {/* Header */}
                <div className="flex items-center pb-4 border-b border-[#E7E5E4] mb-2">
                  <div className="flex-1 text-xs text-[#A8A29E] uppercase tracking-wider font-light">Task Name</div>
                  <div className="w-32 text-right text-xs text-[#A8A29E] uppercase tracking-wider font-light">Est. Hours</div>
                  <div className="w-32 text-right text-xs text-[#A8A29E] uppercase tracking-wider font-light">Confidence</div>
                </div>

                {/* List */}
                <div className="space-y-1">
                  {generatedTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center py-4 border-b border-[#F5F5F4] last:border-0 hover:bg-white/40 transition-colors px-2 -mx-2 rounded-lg">
                      <div className="flex-1 text-sm text-[#1C1917] font-light">{task.task}</div>
                      <div className="w-32 text-right text-sm text-[#78716C] font-light">{task.estimatedHours}h</div>
                      <div className="w-32 text-right">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-light ${
                           task.confidence >= 90 ? 'bg-[#F0FDFA] text-[#0F766E]' : 'bg-[#FFF1F2] text-[#BE123C]'
                         }`}>
                           {task.confidence}%
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-light text-[#1C1917] mb-6">Recommended Team</h2>
              <div className="grid grid-cols-4 gap-6">
                {recommendedTeam.map((member, idx) => (
                   <div key={idx} className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
                     <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-12 h-12 border border-[#E7E5E4] shadow-sm">
                          <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-sm font-light">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-[#1C1917] font-medium text-sm">{member.name}</div>
                          <div className="text-[#78716C] text-xs font-light">{member.role}</div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F4]">
                       <span className="text-xs text-[#A8A29E] font-light">Skill Match</span>
                       <span className="text-sm text-[#0F766E] font-light">{member.match}%</span>
                     </div>
                   </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-light border-[#E7E5E4] bg-white/50 hover:bg-white transition-all duration-300 text-[#292524]">
                Save Draft
              </Button>
              <Button className="flex-1 h-11 bg-[#1C1917] hover:bg-[#292524] rounded-xl font-light transition-all duration-300 text-white shadow-md">
                Commit Project
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};