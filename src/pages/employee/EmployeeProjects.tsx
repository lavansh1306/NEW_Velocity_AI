import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  KanbanSquare, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEmployeeProjectsDB } from '@/hooks/useEmployeeProjectsDB';

export default function EmployeeProjects() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('active');
  const { projectsView, isLoading } = useEmployeeProjectsDB();

  const filteredProjects = useMemo(() => {
    if (filter === 'active') return projectsView.filter(p => p.status !== 'Completed');
    if (filter === 'completed') return projectsView.filter(p => p.status === 'Completed');
    return projectsView;
  }, [filter, projectsView]);

  const activeCount = projectsView.filter(p => p.status !== 'Completed').length;
  const completedCount = projectsView.filter(p => p.status === 'Completed').length;
  const totalWeeklyHours = projectsView
    .filter(p => p.status !== 'Completed')
    .reduce((sum, p) => sum + parseInt(p.yourHours || '0', 10), 0);

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-10 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#2DD4BF]/30 border-t-[#2DD4BF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">My Projects</h1>
          <p className="text-base text-[#78716C] mt-1 font-light">Track your active assignments and project progress</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] h-[40px] border-[#E7E5E4] bg-white font-light focus:ring-[#2DD4BF]/50">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E7E5E4]">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All Projects</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] flex items-center justify-center flex-shrink-0">
              <KanbanSquare className="w-5 h-5 text-[#0F766E]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1C1917]">{activeCount}</div>
              <div className="text-xs text-[#78716C] font-light">Active Projects</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#78716C]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1C1917]">{completedCount}</div>
              <div className="text-xs text-[#78716C] font-light">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1C1917]">{totalWeeklyHours}h</div>
              <div className="text-xs text-[#78716C] font-light">/wk Allocated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Cards */}
      <div className="space-y-5">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<KanbanSquare className="w-10 h-10 text-[#A8A29E]" />}
            title={filter === 'active' ? 'No Active Projects' : filter === 'completed' ? 'No Completed Projects' : 'No Projects Found'}
            description="Your project assignments will appear here."
          />
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/app/employee/projects/${project.id}`)}
              className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/50"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/app/employee/projects/${project.id}`); }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-[#1C1917] mb-1.5 group-hover:text-[#0F766E] transition-colors">{project.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-[#78716C] font-light">
                    <span>{project.dates}</span>
                    <span className="w-1 h-1 bg-[#D6D3D1] rounded-full" />
                    <span className={project.remaining === 'Completed' ? 'text-[#78716C]' : ''}>{project.remaining}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center mb-1 ${project.healthColor}`}>
                      <span className="text-lg font-light">{project.health}</span>
                    </div>
                    <span className={`text-[11px] font-medium ${project.statusColor}`}>{project.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex -space-x-2 justify-end mb-2">
                      {project.team.map((init, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-[#FAFAF9] border border-[#E7E5E4] flex items-center justify-center text-[10px] font-medium text-[#57534E]">{init}</div>
                      ))}
                    </div>
                    <div className="text-xs text-[#57534E] font-light">You: {project.yourHours}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#D6D3D1] group-hover:text-[#78716C] transition-colors" />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-[#78716C] mb-2 font-light">
                  <span>{project.progress}% Complete</span>
                  <span>{project.totalHoursLogged}h / {project.totalHoursEstimated}h</span>
                </div>
                <div className="w-full bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${project.status === 'Completed' ? 'bg-[#0F766E]' : project.health < 75 ? 'bg-[#BE123C]' : 'bg-[#1C1917]'}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              {project.insight && (
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span className="text-xs text-[#78716C] font-light">{project.insight.text}</span>
                  </div>
                  <span className="text-xs text-[#0F766E] hover:underline font-medium flex-shrink-0 ml-3">View Details</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
