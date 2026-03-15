import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Check, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployeeProjectDetailDB } from '@/hooks/useEmployeeProjectsDB';

export default function EmployeeProjectDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: projectId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { projectData, isLoading } = useEmployeeProjectDetailDB(projectId);

  if (isLoading || !projectData) {
    return (
      <div className="max-w-[1200px] mx-auto pb-10 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#2DD4BF]/30 border-t-[#2DD4BF] rounded-full animate-spin" />
      </div>
    );
  }

  const { project, stats, overviewTasks, myTasks, myWork } = projectData;

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <button onClick={() => navigate('/app/employee/my-projects')} className="text-sm text-[#78716C] hover:text-[#1C1917] mb-6 flex items-center gap-1 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> My Projects
      </button>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">{project.name}</h1>
        <div className="text-sm text-[#78716C] px-3 border-l border-[#E7E5E4] font-light">
          {project.dates}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-10">
        <TabsList className="w-full justify-start border-b border-[#E7E5E4] bg-transparent h-auto p-0 space-x-8 rounded-none">
          {['Overview', 'My Tasks', 'Team', 'Timeline'].map((tab) => (
            <TabsTrigger 
              key={tab}
              value={tab.toLowerCase().replace(' ', '-')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1C1917] data-[state=active]:text-[#1C1917] data-[state=active]:shadow-none px-0 py-4 bg-transparent text-[#78716C] hover:text-[#1C1917] font-light text-sm transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-10">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300">
              <div className="grid grid-cols-4 gap-4 mb-10">
                {stats.map((stat: any, i: number) => (
                  <div key={i} className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-5 shadow-sm">
                    <div className="text-3xl font-light text-[#1C1917] mb-2">{stat.value}</div>
                    <div className="text-xs text-[#78716C] uppercase tracking-wide font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                  <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-medium text-[#1C1917] mb-6">Your Work on This Project</h2>
                    <div className="text-2xl font-light text-[#0F766E] mb-4">{myWork.logged} hours logged</div>
                    <div className="flex justify-between text-sm text-[#57534E] mb-2 font-light">
                      <span>{myWork.logged}h logged</span>
                      <span>{myWork.estimated}h estimated</span>
                    </div>
                    <div className="w-full bg-[#F5F5F4] h-2 rounded-full mb-6 overflow-hidden">
                      <div className="bg-[#1C1917] h-2 rounded-full" style={{ width: `${myWork.percent}%` }}></div>
                    </div>
                    <div className="bg-[#FFFBEB] text-[#92400E] border border-[#FEF3C7] text-sm px-3 py-2 rounded-lg inline-block font-light">
                      Your utilization: {myWork.percent}%
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-medium text-[#1C1917]">Your Tasks (5)</h2>
                      <button onClick={() => setActiveTab('my-tasks')} className="text-sm text-[#0F766E] hover:underline font-light">View All &rarr;</button>
                    </div>
                    <div className="space-y-4">
                      {overviewTasks.map((task: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-[#F5F5F4] last:border-0">
                          <span className="text-sm text-[#1C1917] font-light">{task.name}</span>
                          <div className="flex items-center gap-4">
                            <span className={`text-xs px-2 py-0.5 rounded border ${task.status === 'Completed' || task.status === 'Done' ? 'bg-[#FAFAF9] text-[#78716C] border-[#E7E5E4]' : 'bg-white text-[#1C1917] border-[#E7E5E4]'}`}>
                              {task.status}
                            </span>
                            <div className="flex items-center gap-2 w-24">
                              <div className="flex-1 bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#1C1917] h-1.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                              </div>
                              <span className="text-xs text-[#78716C] font-light">{task.progress}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 space-y-8">
                   <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 text-center shadow-sm">
                     <div className="relative w-[120px] h-[120px] mx-auto mb-4 flex items-center justify-center">
                       <div className="absolute inset-0 border-4 border-[#F5F5F4] rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-[#FECDD3] rounded-full border-t-transparent border-l-transparent -rotate-45"></div>
                       <span className="text-4xl font-light text-[#BE123C]">72</span>
                     </div>
                     <div className="text-base font-medium text-[#BE123C] mb-2">At Risk</div>
                     <div className="text-xs text-[#78716C] font-light">Model confidence: 84%</div>
                   </div>

                   <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
                     <h2 className="text-base font-medium text-[#1C1917] mb-5">Upcoming Milestones</h2>
                     <div className="space-y-4">
                       {/* Milestones not present in DB currently, showing empty state or placeholders if needed */}
                       <div className="text-xs text-gray-400">No upcoming milestones</div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-tasks' && (
             <div className="animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-light text-[#1C1917]">My Tasks (12)</h2>
                 <div className="flex gap-3">
                   <Select>
                    <SelectTrigger className="w-[120px] bg-white border-[#E7E5E4] font-light"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Status</SelectItem></SelectContent>
                   </Select>
                   <Select>
                    <SelectTrigger className="w-[140px] bg-white border-[#E7E5E4] font-light"><SelectValue placeholder="By Progress" /></SelectTrigger>
                    <SelectContent><SelectItem value="progress">By Progress</SelectItem></SelectContent>
                   </Select>
                 </div>
               </div>

               <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
                 <div className="grid grid-cols-12 bg-[#FAFAF9] p-3 text-xs font-medium text-[#78716C] uppercase border-b border-[#E7E5E4] tracking-wider">
                   <div className="col-span-5 pl-4">Task</div>
                   <div className="col-span-2">Phase</div>
                   <div className="col-span-2">Hours</div>
                   <div className="col-span-1">Status</div>
                   <div className="col-span-2">Progress</div>
                 </div>

                 {myTasks.map((task: any, i: number) => (
                   <div key={i} className="group border-b border-[#F5F5F4] last:border-0">
                     <div className="grid grid-cols-12 p-4 items-center h-[56px] hover:bg-[#FAFAF9] transition-colors">
                       <div className="col-span-5 flex items-center gap-3 pl-4">
                         <div className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer transition-colors ${task.checked ? 'bg-[#1C1917] border-[#1C1917]' : 'border-[#D6D3D1] hover:border-[#1C1917]'}`}>
                           {task.checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                         </div>
                         <span className={`text-sm text-[#1C1917] font-light ${task.checked ? 'line-through text-[#A8A29E]' : ''}`}>{task.name}</span>
                       </div>
                       <div className="col-span-2">
                         <span className="bg-[#F5F5F4] text-[#57534E] text-xs px-2 py-1 rounded-md font-medium border border-[#E7E5E4]">{task.phase}</span>
                       </div>
                       <div className="col-span-2 text-sm text-[#57534E] font-light">{task.hours}</div>
                       <div className="col-span-1">
                         <Badge className={`${task.status === 'Completed' || task.status === 'Done' ? 'bg-[#FAFAF9] text-[#78716C] border-[#E7E5E4]' : 'bg-white text-[#1C1917] border-[#E7E5E4]'} font-normal hover:bg-opacity-80`}>
                           {task.status}
                         </Badge>
                       </div>
                       <div className="col-span-2 flex items-center gap-4 pr-4">
                         <div className="flex-1 bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                           <div className={`h-1.5 rounded-full ${task.status === 'Completed' || task.status === 'Done' ? 'bg-[#0F766E]' : 'bg-[#1C1917]'}`} style={{ width: `${task.progress}%` }}></div>
                         </div>
                         <ChevronDown className="w-4 h-4 text-[#D6D3D1] cursor-pointer hover:text-[#78716C]" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
