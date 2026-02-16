import React, { useState } from 'react';
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
  Area,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Zap,
  BarChart3,
  Target,
  Activity,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ==================== SHARED COMPONENTS ====================

const KPICard = ({ label, value, sublabel, icon, trend }: any) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-400 border border-gray-100">
    <div className="text-4xl font-light text-gray-900 mb-3 tracking-tight">{value}</div>
    <div className="text-sm text-gray-500 font-light mb-1">{label}</div>
    {sublabel && <div className="text-xs text-gray-400 font-light">{sublabel}</div>}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'Active': 'bg-blue-50 text-blue-700',
    'At Risk': 'bg-amber-50 text-amber-700',
    'Delayed': 'bg-rose-50 text-rose-700',
    'Completed': 'bg-emerald-50 text-emerald-700',
    'Healthy': 'bg-emerald-50 text-emerald-700',
    'Overloaded': 'bg-rose-50 text-rose-700',
    'Not Started': 'bg-gray-50 text-gray-600',
    'In Progress': 'bg-blue-50 text-blue-700',
    'Pending': 'bg-amber-50 text-amber-700',
    'Approved': 'bg-emerald-50 text-emerald-700',
    'Denied': 'bg-rose-50 text-rose-700',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-light ${variants[status] || 'bg-gray-50 text-gray-700'}`}>
      {status}
    </span>
  );
};

const UtilizationBar = ({ value }: { value: number }) => {
  const color = value > 110 ? 'bg-rose-400' : value > 90 ? 'bg-amber-400' : 'bg-blue-400';
  const width = Math.min(value, 150);

  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const HealthIndicator = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  const bgColor = score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-amber-50' : 'bg-rose-50';

  return (
    <div className="flex items-center gap-3">
      <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center`}>
        <span className={`text-xl font-light ${color}`}>{score}</span>
      </div>
    </div>
  );
};

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="bg-blue-600 rounded-xl p-2">
        <Zap className="w-5 h-5 text-white" />
      </div>
      <span className={`font-medium text-gray-900 ${sizes[size]}`}>Velocity AI</span>
    </div>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================

export const AIInsightsDashboard = () => {
  const [timeframe, setTimeframe] = useState<'1' | '2' | '4' | '8'>('8');

  // Generate capacity data based on timeframe
  const generateCapacityData = (weeks: number) => {
    const data = [];
    for (let i = 1; i <= weeks; i++) {
      data.push({
        week: `Week ${i}`,
        utilization: Math.round(Math.random() * 40 + 70),
        available: Math.round(Math.random() * 120 + 40),
      });
    }
    return data;
  };

  const capacityData = generateCapacityData(parseInt(timeframe));

  const upcomingDeadlines = [
    { project: 'Velocity AI Platform Redesign', deadline: 'Mar 30, 2026', daysLeft: 44, status: 'At Risk' },
    { project: 'Mobile App MVP', deadline: 'Mar 15, 2026', daysLeft: 29, status: 'Active' },
    { project: 'API Documentation', deadline: 'Feb 28, 2026', daysLeft: 14, status: 'Active' },
  ];

  const aiRecommendations = [
    {
      severity: 'rose',
      title: 'Frontend capacity requires attention',
      description: 'Sarah Chen at 120% utilization. Review task distribution.',
    },
    {
      severity: 'amber',
      title: 'Timeline adjustment suggested',
      description: 'Platform Redesign shows 13-day delay pattern.',
    },
    {
      severity: 'emerald',
      title: 'Resource opportunity identified',
      description: '168 hours available Week 3 for strategic allocation.',
    },
  ];

  return (
    <div className="p-12 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-light text-gray-900 mb-12 tracking-tight">Dashboard</h1>

        <div className="grid grid-cols-12 gap-10">
          {/* Main Content - 8 columns */}
          <div className="col-span-8 space-y-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
              <KPICard label="Active Projects" value="12" />
              <KPICard label="Team Utilization" value="87%" sublabel="Within target" />
              <KPICard label="Available Capacity" value="312h" sublabel="Next 2 weeks" />
              <KPICard label="Projects at Risk" value="3" />
            </div>

            {/* Capacity Overview Chart */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-gray-900">Capacity Overview - Hours Left & Utilization</h2>
                <div className="flex gap-2">
                  {(['1', '2', '4', '8'] as const).map((weeks) => (
                    <button
                      key={weeks}
                      onClick={() => setTimeframe(weeks)}
                      className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                        timeframe === weeks
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {weeks}W
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontWeight: '300',
                    }}
                  />
                  <Bar dataKey="utilization" fill="#93c5fd" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="available" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-300 rounded-full"></div>
                  <span className="text-xs text-gray-500 font-light">Utilization %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-500 font-light">Available Hours</span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">Upcoming Deadlines</h2>

              <div className="space-y-4">
                {upcomingDeadlines.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-5 px-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="text-gray-900 text-sm mb-1.5 font-light">{item.project}</div>
                      <div className="text-xs text-gray-400 font-light">{item.deadline}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-900 font-light">{item.daysLeft} days</div>
                        <div className="text-xs text-gray-400 font-light">remaining</div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations Panel - 4 columns */}
          <div className="col-span-4">
            <div className="bg-white rounded-2xl p-8 shadow-sm sticky top-28 border border-gray-100">
              <h2 className="text-xl font-light text-gray-900 mb-8">AI Insights</h2>

              <div className="space-y-4">
                {aiRecommendations.map((rec, idx) => {
                  const dotColors: Record<string, string> = {
                    rose: 'bg-rose-400',
                    amber: 'bg-amber-400',
                    emerald: 'bg-emerald-400',
                  };

                  return (
                    <div key={idx} className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-400">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColors[rec.severity]}`} />
                        <div className="flex-1">
                          <div className="text-gray-900 text-sm mb-2 font-light">{rec.title}</div>
                          <div className="text-sm text-gray-500 font-light leading-relaxed">{rec.description}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs h-9 rounded-xl font-light text-gray-600 hover:text-gray-900 hover:bg-white"
                      >
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

export default AIInsightsDashboard;
