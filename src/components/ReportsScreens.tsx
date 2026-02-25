import React from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  Filter, 
  Calendar, 
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Users
} from 'lucide-react';

const ReportHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-4xl font-light text-[#1C1917] tracking-tight mb-2">{title}</h1>
      <p className="text-[#78716C] font-light">{subtitle}</p>
    </div>
    <div className="flex gap-3">
      <Button variant="outline" className="h-10 border-[#E7E5E4] bg-white/50 hover:bg-white text-[#78716C] hover:text-[#1C1917] font-light">
        <Calendar className="w-4 h-4 mr-2" />
        This Quarter
        <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
      </Button>
      <Button variant="outline" className="h-10 border-[#E7E5E4] bg-white/50 hover:bg-white text-[#78716C] hover:text-[#1C1917] font-light">
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <Button className="bg-[#1C1917] hover:bg-[#292524] h-10 px-4 text-white font-light shadow-sm">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  </div>
);

const KPICard = ({ label, value, trend, trendUp }: { label: string, value: string, trend: string, trendUp?: boolean }) => (
  <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-6 shadow-sm">
    <div className="text-sm text-[#78716C] font-light mb-2">{label}</div>
    <div className="flex items-end justify-between">
      <div className="text-3xl font-light text-[#1C1917]">{value}</div>
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
        trendUp ? 'bg-[#F0FDFA] text-[#0F766E]' : 'bg-[#FFF1F2] text-[#BE123C]'
      }`}>
        {trend}
      </div>
    </div>
  </div>
);

export const TeamCapacityReportScreen = () => {
  const capacityTrend = [
    { week: 'W1', engineering: 85, design: 70, product: 90 },
    { week: 'W2', engineering: 88, design: 75, product: 92 },
    { week: 'W3', engineering: 92, design: 80, product: 85 },
    { week: 'W4', engineering: 95, design: 85, product: 88 },
    { week: 'W5', engineering: 90, design: 82, product: 86 },
    { week: 'W6', engineering: 85, design: 78, product: 84 },
    { week: 'W7', engineering: 82, design: 75, product: 85 },
    { week: 'W8', engineering: 80, design: 72, product: 88 },
  ];

  const roleDistribution = [
    { role: 'Frontend', allocated: 1200, available: 160, utilization: 88 },
    { role: 'Backend', allocated: 980, available: 200, utilization: 83 },
    { role: 'Design', allocated: 450, available: 80, utilization: 85 },
    { role: 'Product', allocated: 320, available: 40, utilization: 89 },
    { role: 'QA', allocated: 280, available: 120, utilization: 70 },
  ];

  return (
    <div className="p-10 min-h-screen bg-[#FAFAF9]">
      <div className="max-w-[1400px] mx-auto">
        <ReportHeader 
          title="Team Capacity Report" 
          subtitle="Analysis of resource utilization and availability across departments" 
        />

        <div className="grid grid-cols-4 gap-6 mb-10">
          <KPICard label="Avg Utilization" value="86%" trend="+2.4%" trendUp={true} />
          <KPICard label="Available Hours" value="480h" trend="-120h" trendUp={false} />
          <KPICard label="Overloaded Members" value="5" trend="+1" trendUp={false} />
          <KPICard label="Efficiency Score" value="92" trend="+1.5" trendUp={true} />
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-light text-[#1C1917] mb-6">Utilization Trend by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={capacityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '0.5px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Area type="monotone" dataKey="engineering" stackId="1" stroke="#0F766E" fill="#0F766E" fillOpacity={0.2} name="Engineering" />
                <Area type="monotone" dataKey="design" stackId="1" stroke="#E27052" fill="#E27052" fillOpacity={0.2} name="Design" />
                <Area type="monotone" dataKey="product" stackId="1" stroke="#88A67E" fill="#88A67E" fillOpacity={0.2} name="Product" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-light text-[#1C1917] mb-6">Capacity by Role</h3>
            <div className="space-y-6">
              {roleDistribution.map((role, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#292524]">{role.role}</span>
                    <span className="text-xs text-[#78716C]">{role.allocated}h / {role.allocated + role.available}h</span>
                  </div>
                  <div className="w-full bg-[#F5F5F4] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        role.utilization > 85 ? 'bg-[#BE123C]' : 'bg-[#1C1917]'
                      }`} 
                      style={{ width: `${role.utilization}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-light text-[#1C1917] mb-6">Resource Anomalies</h3>
          <div className="space-y-4">
            {[
              { name: 'Sarah Chen', role: 'Frontend Lead', issue: 'Consistently over 110% utilization for 3 weeks', impact: 'High Burnout Risk' },
              { name: 'David Kim', role: 'Full Stack', issue: 'Allocated to 4 critical path projects simultaneously', impact: 'Context Switching' },
              { name: 'Design Team', role: 'Department', issue: 'Capacity drops by 40% in Week 6 (Planned Leave)', impact: 'Timeline Delay' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/40 border border-[#E7E5E4] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FFF1F2] flex items-center justify-center text-[#BE123C]">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#292524]">{item.name}</div>
                    <div className="text-xs text-[#78716C]">{item.role}</div>
                  </div>
                </div>
                <div className="text-sm text-[#292524] font-light">{item.issue}</div>
                <div className="px-3 py-1 bg-[#F5F5F4] text-[#1C1917] text-xs rounded-lg border border-[#E7E5E4]">
                  {item.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectHealthReportScreen = () => {
  const healthTrend = [
    { month: 'Jan', health: 92, risks: 2 },
    { month: 'Feb', health: 88, risks: 3 },
    { month: 'Mar', health: 85, risks: 5 },
    { month: 'Apr', health: 82, risks: 4 },
    { month: 'May', health: 89, risks: 1 },
    { month: 'Jun', health: 94, risks: 0 },
  ];

  const projects = [
    { name: 'Velocity AI Platform', health: 72, trend: 'down', issues: 3, budget: 68 },
    { name: 'Mobile App MVP', health: 88, trend: 'up', issues: 0, budget: 45 },
    { name: 'API Documentation', health: 95, trend: 'stable', issues: 0, budget: 90 },
    { name: 'Infrastructure Migration', health: 65, trend: 'down', issues: 5, budget: 110 },
    { name: 'Customer Portal', health: 92, trend: 'up', issues: 1, budget: 85 },
  ];

  return (
    <div className="p-10 min-h-screen bg-[#FDFDFB]">
      <div className="max-w-[1400px] mx-auto">
        <ReportHeader 
          title="Project Health Report" 
          subtitle="Overview of project status, risks, and health trends" 
        />

        <div className="grid grid-cols-4 gap-6 mb-10">
          <KPICard label="Avg Health Score" value="82" trend="-3.5" trendUp={false} />
          <KPICard label="Projects At Risk" value="2" trend="+1" trendUp={false} />
          <KPICard label="Budget Variance" value="+12%" trend="+4%" trendUp={false} />
          <KPICard label="Resolved Issues" value="24" trend="+8" trendUp={true} />
        </div>

        <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-light text-[#1C1917]">Portfolio Health Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={healthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <Area type="monotone" dataKey="health" stroke="#0F766E" fill="#0F766E" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-light text-[#1C1917] mb-6">Active Projects Status</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E7E5E4]">
                <th className="text-left py-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Project Name</th>
                <th className="text-left py-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Health Score</th>
                <th className="text-left py-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Open Issues</th>
                <th className="text-left py-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Budget Usage</th>
                <th className="text-right py-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => (
                <tr key={idx} className="border-b border-[#F5F5F4] hover:bg-white/40 transition-colors">
                  <td className="py-4 text-sm font-medium text-[#1C1917]">{project.name}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        project.health >= 80 ? 'bg-[#0F766E]' : project.health >= 60 ? 'bg-[#BE123C]' : 'bg-[#BE123C]'
                      }`} />
                      <span className="text-sm text-[#78716C]">{project.health}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-[#78716C]">{project.issues}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${project.budget > 100 ? 'bg-[#BE123C]' : 'bg-[#1C1917]'}`}
                          style={{ width: `${Math.min(project.budget, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#78716C] w-8">{project.budget}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`px-2 py-1 rounded-md text-xs border ${
                      project.health >= 80 
                        ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' 
                        : 'bg-[#FFF1F2] text-[#BE123C] border-[#FFE4E6]'
                    }`}>
                      {project.health >= 80 ? 'Healthy' : 'At Risk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};