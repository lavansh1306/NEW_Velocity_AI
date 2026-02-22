import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
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
import { 
  Plus,
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UtilizationBar = ({ value }: { value: number }) => {
  const color = value > 110 ? 'bg-[#E27052]' : value > 90 ? 'bg-[#E27052]' : 'bg-[#88A67E]';
  const width = Math.min(value, 150);
  
  return (
    <div className="w-full bg-[#FAFAF9] rounded-full h-1.5 overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'Active': 'bg-[#FAFAF9] text-[#121212]',
    'At Risk': 'bg-[#E27052]/10 text-[#E27052]',
    'Delayed': 'bg-[#E27052]/10 text-[#E27052]',
    'Completed': 'bg-[#88A67E]/10 text-[#88A67E]',
    'Healthy': 'bg-[#88A67E]/10 text-[#88A67E]',
    'Overloaded': 'bg-[#E27052]/10 text-[#E27052]',
    'Not Started': 'bg-[#FAFAF9] text-[#737373]',
    'In Progress': 'bg-[#FAFAF9] text-[#121212]',
    'Pending': 'bg-[#E27052]/10 text-[#E27052]',
    'Approved': 'bg-[#88A67E]/10 text-[#88A67E]',
    'Denied': 'bg-[#E27052]/10 text-[#E27052]',
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-light ${variants[status] || 'bg-gray-50 text-gray-700'}`}>
      {status}
    </span>
  );
};

const AddTeamMemberModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState('');
  const [utilization, setUtilization] = useState(85);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl bg-[#FDFDFB] p-0 gap-0">
        <DialogHeader className="px-8 py-6 border-b border-[#E5E5E5] bg-white">
          <DialogTitle className="text-xl font-medium text-[#121212]">Add Team Member</DialogTitle>
        </DialogHeader>
        
        <div className="p-8 grid grid-cols-2 gap-8">
          <div className="space-y-4">
             <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="e.g. Jane Doe" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="jane@example.com" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-10 border-[#E5E5E5] bg-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend Developer</SelectItem>
                  <SelectItem value="backend">Backend Developer</SelectItem>
                  <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                  <SelectItem value="designer">Product Designer</SelectItem>
                  <SelectItem value="pm">Product Manager</SelectItem>
                  <SelectItem value="qa">QA Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Skills (comma separated)</Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="React, Node.js, etc." />
            </div>
          </div>
          
          <div className="col-span-2 space-y-2">
             <div className="flex justify-between">
                <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Target Utilization</Label>
                <span className="text-xs font-medium text-[#121212]">{utilization}%</span>
             </div>
             <input 
               type="range" 
               min="0" 
               max="120" 
               value={utilization} 
               onChange={(e) => setUtilization(parseInt(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
             />
          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-[#E5E5E5] bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#E5E5E5] text-[#737373] hover:text-[#121212]">Cancel</Button>
          <Button onClick={() => onOpenChange(false)} className="bg-[#121212] text-white hover:bg-[#262626] shadow-sm px-6">Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PeopleCapacityScreen = () => {
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  
  const teamMembers = [
    { name: 'Sarah Chen', role: 'Frontend Lead', skills: ['React', 'TypeScript', 'CSS'], utilization: 120, projects: 3, status: 'overloaded', availability: 8, avatar: 'SC' },
    { name: 'Marcus Johnson', role: 'Backend Developer', skills: ['Node.js', 'Python', 'AWS'], utilization: 95, projects: 2, status: 'healthy', availability: 32, avatar: 'MJ' },
    { name: 'Emily Rodriguez', role: 'UI Designer', skills: ['Figma', 'Design Systems'], utilization: 93, projects: 4, status: 'healthy', availability: 16, avatar: 'ER' },
    { name: 'David Kim', role: 'Full Stack Developer', skills: ['React', 'Node.js', 'Docker'], utilization: 112, projects: 3, status: 'overloaded', availability: 12, avatar: 'DK' },
    { name: 'Jessica Liu', role: 'QA Engineer', skills: ['Testing', 'Automation', 'Cypress'], utilization: 78, projects: 2, status: 'healthy', availability: 48, avatar: 'JL' },
    { name: 'Alex Park', role: 'DevOps Engineer', skills: ['AWS', 'Kubernetes', 'CI/CD'], utilization: 65, projects: 1, status: 'healthy', availability: 56, avatar: 'AP' },
    { name: 'Rachel Kim', role: 'Product Designer', skills: ['UI/UX', 'Prototyping'], utilization: 88, projects: 3, status: 'healthy', availability: 24, avatar: 'RK' },
    { name: 'Tom Anderson', role: 'Backend Developer', skills: ['Python', 'PostgreSQL'], utilization: 92, projects: 2, status: 'healthy', availability: 28, avatar: 'TA' },
  ];
  
  const personDetails = {
    name: 'Sarah Chen',
    role: 'Frontend Lead',
    avatar: 'SC',
    utilization: 120,
    capacityTimeline: [
      { week: 'Week 1', allocated: 48, available: 40 },
      { week: 'Week 2', allocated: 45, available: 40 },
      { week: 'Week 3', allocated: 42, available: 40 },
      { week: 'Week 4', allocated: 40, available: 40 },
    ],
    projects: [
      { name: 'Velocity AI Platform', hours: 25 },
      { name: 'Mobile App MVP', hours: 15 },
      { name: 'Design System', hours: 8 },
    ],
    skills: [
      { name: 'React', proficiency: 95 },
      { name: 'TypeScript', proficiency: 90 },
      { name: 'CSS', proficiency: 88 },
      { name: 'UI/UX', proficiency: 82 },
    ],
    recommendations: [
      { text: 'Redistribute 8-10 hours to other team members', action: 'Apply' },
      { text: 'Consider pairing with Emily for CSS animations', action: 'Apply' },
    ]
  };
  
  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(120px)',
          opacity: 0.4,
        }}
      />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">People & Capacity</h1>
          <Button 
            className="bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md"
            onClick={() => setIsAddMemberOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>
        
        <AddTeamMemberModal open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen} />
        
        {/* Capacity Summary Strip */}
        <div className="flex items-center gap-0 mb-10">
          <div className="flex-1 py-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">24</div>
            <div className="text-sm text-[#78716C] font-light">Total Members</div>
          </div>
          <div className="w-px h-16 bg-[#E7E5E4]"></div>
          <div className="flex-1 py-8 px-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">91%</div>
            <div className="text-sm text-[#78716C] font-light">Avg Utilization</div>
          </div>
          <div className="w-px h-16 bg-[#E7E5E4]"></div>
          <div className="flex-1 py-8 px-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">5</div>
            <div className="text-sm text-[#78716C] font-light">Overloaded Count</div>
          </div>
          <div className="w-px h-16 bg-[#E7E5E4]"></div>
          <div className="flex-1 py-8 pl-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">224h</div>
            <div className="text-sm text-[#78716C] font-light">Available Capacity</div>
          </div>
        </div>
        
        {/* Team Table */}
        <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-8 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-white/20">
                <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Name</th>
                <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Role</th>
                <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Skills</th>
                <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Utilization</th>
                <th className="text-center py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Projects</th>
                <th className="text-center py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Next 2 Weeks</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, idx) => (
                <tr 
                  key={idx} 
                  className="border-b border-white/10 hover:bg-[#FAFAF9]/40 cursor-pointer transition-all duration-300"
                  onClick={() => setSelectedPerson(member)}
                >
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-white/20 shadow-sm">
                        <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-sm font-light">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm text-[#292524] font-light">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-sm text-[#78716C] font-light">{member.role}</td>
                  <td className="py-5 px-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {member.skills.slice(0, 2).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/60 border border-white/20 text-[#292524] text-xs rounded-full font-light shadow-sm">
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 2 && (
                        <span className="px-2.5 py-1 bg-white/60 border border-white/20 text-[#78716C] text-xs rounded-full font-light shadow-sm">
                          +{member.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <UtilizationBar value={member.utilization} />
                      </div>
                      <span className={`text-sm font-light ${member.utilization > 110 ? 'text-rose-600' : 'text-[#292524]'}`}>
                        {member.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center text-sm text-[#292524] font-light">{member.projects}</td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'overloaded' ? 'bg-rose-400' :
                        member.status === 'healthy' ? 'bg-emerald-400' :
                        'bg-[#D6D3D1]'
                      }`} />
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right text-sm text-[#292524] font-light">{member.availability}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Right Drawer */}
      {selectedPerson && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedPerson(null)}
          />
          <div className="fixed right-0 top-0 h-full w-[420px] bg-white/80 backdrop-blur-2xl shadow-2xl z-50 overflow-y-auto border-l border-white/20">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border border-white/20 shadow-md">
                    <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-xl font-light">
                      {personDetails.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-light text-[#292524] mb-1">{personDetails.name}</div>
                    <div className="text-sm text-[#78716C] font-light">{personDetails.role}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="text-[#A8A29E] hover:text-[#78716C] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-8">
                <div className="text-xs text-[#78716C] font-light mb-2">Current Utilization</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <UtilizationBar value={personDetails.utilization} />
                  </div>
                  <span className="text-sm font-light text-rose-600">{personDetails.utilization}%</span>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="text-sm font-light text-[#292524] mb-4">Capacity Timeline (4 Weeks)</div>
                <div className="space-y-3">
                  {personDetails.capacityTimeline.map((week, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs text-[#78716C] font-light mb-1.5">
                        <span>{week.week}</span>
                        <span>{week.allocated}h / {week.available}h</span>
                      </div>
                      <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            week.allocated > week.available ? 'bg-rose-400' : 'bg-[#2DD4BF]'
                          }`}
                          style={{ width: `${Math.min((week.allocated / week.available) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-8">
                <div className="text-sm font-light text-[#292524] mb-4">Assigned Projects</div>
                <div className="space-y-3">
                  {personDetails.projects.map((project, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 bg-white/50 border border-white/20 rounded-xl">
                      <div className="text-sm text-[#292524] font-light">{project.name}</div>
                      <div className="text-sm text-[#78716C] font-light">{project.hours}h/wk</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-8">
                <div className="text-sm font-light text-[#292524] mb-4">Skills</div>
                <div className="space-y-3">
                  {personDetails.skills.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs text-[#78716C] font-light mb-1.5">
                        <span>{skill.name}</span>
                        <span>{skill.proficiency}%</span>
                      </div>
                      <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-[#2DD4BF] transition-all duration-500"
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-light text-[#1C1917] font-['Source_Serif_4'] font-semibold italic mb-4">AI Recommendations</div>
                <div className="space-y-3">
                  {personDetails.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-white/50 rounded-xl border border-white/20 border-l-2 border-l-[#1C1917]">
                      <div className="text-sm text-[#1C1917] font-light mb-3">{rec.text}</div>
                      <Button size="sm" variant="ghost" className="h-8 text-xs font-light text-[#78716C] hover:text-[#292524]">
                        {rec.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const PersonDetailScreen = () => {
  const personData = {
    name: 'Sarah Chen',
    role: 'Frontend Lead',
    avatar: 'SC',
    utilization: 120,
    skills: ['React', 'TypeScript', 'CSS', 'UI/UX', 'GraphQL'],
    currentProjects: [
      { name: 'Velocity AI Platform', role: 'Lead Developer', hours: 25, progress: 69 },
      { name: 'Mobile App MVP', role: 'Contributor', hours: 15, progress: 45 },
      { name: 'Design System Update', role: 'Reviewer', hours: 8, progress: 78 },
    ],
  };
  
  const capacityData = [
    { week: 'Week 1', allocated: 48, available: 40 },
    { week: 'Week 2', allocated: 45, available: 40 },
    { week: 'Week 3', allocated: 42, available: 40 },
    { week: 'Week 4', allocated: 40, available: 40 },
    { week: 'Week 5', allocated: 38, available: 40 },
    { week: 'Week 6', allocated: 35, available: 40 },
    { week: 'Week 7', allocated: 40, available: 40 },
    { week: 'Week 8', allocated: 38, available: 40 },
  ];
  
  const suggestions = [
    { severity: 'rose', title: 'Overallocation requires attention', description: 'Currently 20% over capacity. Recommend redistributing 8-10 hours to other team members.' },
    { severity: 'amber', title: 'Skill development opportunity', description: 'Consider pairing with Emily for advanced CSS animations to build cross-functional capability.' },
    { severity: 'emerald', title: 'Performance trend positive', description: 'Consistently delivering 15% above estimates. Consider for senior role progression.' },
  ];
  
  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(120px)',
          opacity: 0.4,
        }}
      />
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-8 space-y-10">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <div className="flex items-start gap-6">
                <Avatar className="w-20 h-20 border border-white/20 shadow-md">
                  <AvatarFallback className="bg-[#F4F4F5] text-[#121212] text-2xl font-light">{personData.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-4xl font-light text-[#121212] mb-2 tracking-tight">{personData.name}</h1>
                  <div className="text-sm text-[#737373] font-light mb-6">{personData.role}</div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-[#737373] font-light mb-2">Current Utilization</div>
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <UtilizationBar value={personData.utilization} />
                        </div>
                        <span className="text-sm font-light text-[#E27052]">{personData.utilization}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="bg-[#121212] hover:bg-[#262626] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">Edit Profile</Button>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#121212] mb-8">Current Projects</h2>
              <div className="space-y-5">
                {personData.currentProjects.map((project, idx) => (
                  <div key={idx} className="p-6 bg-white/40 border-[0.5px] border-white/20 rounded-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-[#121212] text-sm mb-2 font-light">{project.name}</div>
                        <div className="text-xs text-[#737373] font-light">{project.role} · {project.hours} hrs/week</div>
                      </div>
                      <span className="text-sm text-[#737373] font-light">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#121212] mb-8">8-Week Capacity Forecast</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#A3A3A3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#A3A3A3' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '0.5px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(32px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontWeight: '300'
                    }}
                  />
                  <Area type="monotone" dataKey="allocated" stroke="#7E8CA6" fill="#7E8CA6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="available" stroke="#e5e5e5" fill="#e5e5e5" fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#121212] mb-6">Skills</h2>
              <div className="flex gap-3 flex-wrap">
                {personData.skills.map((skill, idx) => (
                  <span key={idx} className="px-4 py-2.5 bg-[#F4F4F5] text-[#121212] text-sm rounded-xl font-light border border-white/20 shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-span-4">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-8 shadow-sm sticky top-28">
              <h2 className="text-xl font-light text-[#121212] mb-8">AI Suggestions</h2>
              <div className="space-y-4">
                {suggestions.map((suggestion, idx) => {
                  const dotColors: Record<string, string> = {
                    rose: 'bg-[#E27052]',
                    amber: 'bg-[#E27052]',
                    emerald: 'bg-[#88A67E]',
                  };
                  
                  const accentColors: Record<string, string> = {
                    rose: 'border-l-[#E27052]/50',
                    amber: 'border-l-[#E27052]/50',
                    emerald: 'border-l-[#88A67E]/50',
                  };
                  
                  return (
                    <div key={idx} className={`p-6 bg-white/40 border border-white/10 rounded-2xl border-l-2 ${accentColors[suggestion.severity]}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColors[suggestion.severity]}`} />
                        <div className="flex-1">
                          <div className="text-[#121212] text-sm mb-2 font-['Source_Serif_4'] font-semibold italic">{suggestion.title}</div>
                          <div className="text-sm text-[#737373] font-light leading-relaxed">{suggestion.description}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="w-full text-xs h-9 rounded-xl font-light text-[#737373] hover:text-[#262626] hover:bg-white/50 transition-all duration-300">
                        Review
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LeaveManagementScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  const leaveRequests = [
    { employee: 'Sarah Chen', dateRange: 'Feb 20-22, 2026', type: 'Vacation', hours: 24, status: 'Pending', avatar: 'SC' },
    { employee: 'Marcus Johnson', dateRange: 'Mar 1-5, 2026', type: 'Vacation', hours: 40, status: 'Pending', avatar: 'MJ' },
    { employee: 'Emily Rodriguez', dateRange: 'Feb 18, 2026', type: 'Sick Leave', hours: 8, status: 'Approved', avatar: 'ER' },
    { employee: 'David Kim', dateRange: 'Feb 25-26, 2026', type: 'Personal', hours: 16, status: 'Pending', avatar: 'DK' },
    { employee: 'Jessica Liu', dateRange: 'Mar 10-12, 2026', type: 'Vacation', hours: 24, status: 'Approved', avatar: 'JL' },
    { employee: 'Alex Park', dateRange: 'Feb 28, 2026', type: 'Personal', hours: 8, status: 'Denied', avatar: 'AP' },
  ];
  
  const calendarEvents = [
    { date: 'Feb 20', type: 'pto', name: 'Sarah Chen', project: null },
    { date: 'Feb 21', type: 'pto', name: 'Sarah Chen', project: null },
    { date: 'Feb 22', type: 'pto', name: 'Sarah Chen', project: null },
    { date: 'Feb 18', type: 'pto', name: 'Emily Rodriguez', project: null },
    { date: 'Feb 25', type: 'pto', name: 'David Kim', project: null },
    { date: 'Feb 26', type: 'pto', name: 'David Kim', project: null },
    { date: 'Feb 20', type: 'project', name: 'Marcus Johnson', project: 'API Integration' },
    { date: 'Feb 21', type: 'project', name: 'Marcus Johnson', project: 'API Integration' },
  ];
  
  const handleApprove = () => {
    setShowModal(true);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleConfirmAction = () => {
    setShowModal(false);
    setShowBanner(true);
    setTimeout(() => setShowBanner(false), 5000);
  };
  
  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(120px)',
          opacity: 0.4,
        }}
      />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light text-[#121212] tracking-tight">Leave Management</h1>
          <Button className="bg-[#121212] hover:bg-[#262626] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">
            Request Leave
          </Button>
        </div>
        
        {/* Banner */}
        {showBanner && (
          <div className="mb-8 p-5 bg-[#F4F4F5] rounded-2xl border-l-2 border-l-[#121212] flex items-center justify-between animate-in fade-in duration-300">
            <div className="text-sm text-[#121212] font-light">
              Capacity recalculated. Review recommendations.
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-[#737373] hover:text-[#262626] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Active Leave Requests - Row View */}
        <div className="mb-10">
          <h2 className="text-xl font-light text-[#262626] mb-6">Active Leave Requests</h2>
          <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-[16px] shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {leaveRequests.map((request, idx) => (
                <div key={idx} className="p-6 hover:bg-white/60 transition-all duration-300">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-64">
                      <Avatar className="w-10 h-10 border border-white/20 shadow-sm">
                        <AvatarFallback className="bg-[#F4F4F5] text-[#121212] text-sm font-light">{request.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm text-[#121212] font-light mb-0.5">{request.employee}</div>
                        <div className="text-xs text-[#737373] font-light">{request.type}</div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-[#A3A3A3] font-light mb-1">Date Range</div>
                        <div className="text-sm text-[#262626] font-light">{request.dateRange}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#A3A3A3] font-light mb-1">Duration</div>
                        <div className="text-sm text-[#262626] font-light">{request.hours} hours</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#A3A3A3] font-light mb-1">Status</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {request.status === 'Pending' && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
                          {request.status === 'Approved' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                          {request.status === 'Denied' && <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />}
                          <span className="text-sm text-[#262626] font-light">{request.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-48 justify-end">
                      {request.status === 'Pending' ? (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-[#121212] hover:bg-[#262626] h-9 px-4 rounded-xl font-light text-white shadow-sm transition-all duration-300"
                            onClick={handleApprove}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 px-4 border-white/20 text-[#737373] hover:text-[#262626] hover:bg-white/50 rounded-xl font-light transition-all duration-300"
                          >
                            Deny
                          </Button>
                        </>
                      ) : (
                        <div className="h-9 flex items-center px-4">
                          <span className="text-xs text-[#A3A3A3] font-light italic">No actions available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Team Calendar View */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-light text-[#262626] mb-6">Team Calendar</h2>
          
          <div className="grid grid-cols-7 gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={idx} className="text-center text-xs font-light text-[#737373] uppercase tracking-wider py-3">
                {day}
              </div>
            ))}
            
            {[...Array(28)].map((_, idx) => {
              const date = `Feb ${idx + 1}`;
              const events = calendarEvents.filter(e => e.date === date);
              const hasPTO = events.some(e => e.type === 'pto');
              const hasProject = events.some(e => e.type === 'project');
              const hasOverlap = hasPTO && hasProject;
              
              return (
                <div 
                  key={idx} 
                  className={`min-h-[100px] p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    events.length > 0 
                      ? 'border-white/20 bg-white/40 hover:bg-white/60' 
                      : 'border-transparent hover:border-white/20 hover:bg-white/20'
                  }`}
                  onClick={() => events.length > 0 && setSelectedEvent(events[0])}
                >
                  <div className="text-sm text-[#262626] font-light mb-2">{idx + 1}</div>
                  <div className="space-y-1.5">
                    {events.map((event, eventIdx) => (
                      <div 
                        key={eventIdx}
                        className={`text-xs p-2 rounded-lg font-light ${
                          event.type === 'pto' 
                            ? 'bg-gray-200 text-gray-700' 
                            : 'bg-slate-200 text-slate-700'
                        } ${hasOverlap ? 'bg-stripes' : ''}`}
                        style={hasOverlap ? {
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)'
                        } : {}}
                      >
                        {event.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Approval Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent aria-describedby={undefined} className="font-['Inter',sans-serif] rounded-2xl bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-light text-[#262626]">
              {isProcessing ? 'Analyzing Impact...' : 'Leave Impact Analysis'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {isProcessing ? (
              <div className="flex items-center gap-4 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#121212]" />
                <span className="text-sm text-[#737373] font-light">Evaluating team capacity and project timelines…</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-amber-50/50 rounded-2xl border-l-2 border-l-amber-300">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-500 mt-0.5">⚠️</div>
                    <div>
                      <div className="text-sm text-amber-900 mb-1 font-medium">Capacity Alert</div>
                      <div className="text-sm text-amber-800 font-light leading-relaxed">
                        Approving this leave will create a <span className="font-medium">24h capacity gap</span> in the "Velocity AI Platform" project.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#121212] mb-3">AI Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-white/60 border border-white/20 rounded-xl flex items-start gap-3 hover:bg-white/80 transition-colors cursor-pointer">
                      <div className="w-5 h-5 rounded-full bg-[#121212]/5 flex items-center justify-center text-[#121212] text-xs mt-0.5">1</div>
                      <div>
                        <div className="text-sm text-[#262626] font-light mb-1">Reassign API tasks to Marcus</div>
                        <div className="text-xs text-[#737373] font-light">Marcus has 15h available capacity this week.</div>
                      </div>
                    </div>
                    <div className="p-4 bg-white/60 border border-white/20 rounded-xl flex items-start gap-3 hover:bg-white/80 transition-colors cursor-pointer">
                      <div className="w-5 h-5 rounded-full bg-[#121212]/5 flex items-center justify-center text-[#121212] text-xs mt-0.5">2</div>
                      <div>
                        <div className="text-sm text-[#262626] font-light mb-1">Shift "UI Polish" milestone by 2 days</div>
                        <div className="text-xs text-[#737373] font-light">Low impact on overall project delivery.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!isProcessing && (
            <DialogFooter className="gap-4 w-full flex flex-row sm:justify-between">
              <Button 
                variant="outline" 
                onClick={handleConfirmAction} 
                className="flex-1 h-11 border-white/20 text-[#737373] hover:text-[#262626] hover:bg-white/50 rounded-xl font-light transition-all duration-300"
              >
                Ignore
              </Button>
              <Button 
                onClick={handleConfirmAction} 
                className="flex-1 bg-[#121212] hover:bg-[#262626] h-11 rounded-xl font-light transition-all duration-300 text-white shadow-md"
              >
                Commit Changes
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Event Detail Drawer */}
      {selectedEvent && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="fixed right-0 top-0 h-full w-[420px] bg-white/80 backdrop-blur-2xl shadow-2xl z-50 overflow-y-auto border-l border-white/20">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-xl font-light text-[#262626] mb-2">{selectedEvent.name}</div>
                  <div className="text-sm text-[#737373] font-light">{selectedEvent.date}</div>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="text-[#A3A3A3] hover:text-[#737373] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="text-xs text-[#737373] font-light mb-2">Type</div>
                  <div className="text-sm text-[#262626] font-light">
                    {selectedEvent.type === 'pto' ? 'Paid Time Off' : 'Project Work'}
                  </div>
                </div>
                
                {selectedEvent.project && (
                  <div>
                    <div className="text-xs text-[#737373] font-light mb-2">Project</div>
                    <div className="text-sm text-[#262626] font-light">{selectedEvent.project}</div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full h-11 rounded-xl font-light border-white/20 text-[#262626] transition-all duration-300 hover:bg-white/50"
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
