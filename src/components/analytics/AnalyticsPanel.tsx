import React from 'react';
import type { ProjectHealthReport } from '@/types';
import {
  Activity,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ProjectItem {
  id: string;
  title: string;
}

interface Props {
  project: ProjectItem;
  report: ProjectHealthReport;
}

export default function AnalyticsPanel({ project, report }: Props) {
  const { health } = report;

  const healthItems = [
    { label: 'Schedule Performance', value: health.schedule, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Resource Balance', value: health.resource, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Risk Mitigation', value: health.risk, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Quality Assurance', value: health.quality, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <section className="mt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-light text-gray-900">{project.title} — Health Reportt</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time status tracking based on Jira activity</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 font-light">Last updated: {new Date(report.lastUpdated).toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {healthItems.map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">{item.label}</h3>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-light text-gray-900">{item.value}%</div>
                <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${item.value > 80 ? 'bg-green-500' :
                        item.value > 60 ? 'bg-blue-500' :
                          item.value > 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Composite Health Score</h3>
              <p className="text-sm text-gray-500">Aggregated weighted performance index</p>
            </div>
            <div className="ml-auto text-4xl font-light text-blue-600">
              {health.compositeScore}
              <span className="text-lg text-gray-400 ml-1">/ 100</span>
            </div>
          </div>

          <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${health.compositeScore}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
            <div className="text-gray-600">
              <span className="block font-medium text-gray-900 mb-1">Status Summary</span>
              {health.compositeScore > 80 ? 'Project is in excellent health with minimal risks.' :
                health.compositeScore > 60 ? 'Standard operations are proceeding as planned.' :
                  'Attention required to mitigate schedule or resource constraints.'}
            </div>
            <div className="text-gray-600">
              <span className="block font-medium text-gray-900 mb-1">Focus Areas</span>
              {health.risk < 70 ? 'High-risk items / blockers' :
                health.schedule < 70 ? 'Schedule burndown' :
                  'Routine task completion'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
