import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ProjectAnalytics } from './types';

interface Props {
  data: ProjectAnalytics;
}

// We'll render a horizontal stacked bar where each task is a row.
export default function GanttChart({ data }: Props) {
  if ((data as any).jira_available === false) {
    return (
      <div className="bg-white rounded-lg border p-4 h-64 flex items-center justify-center">
        <div className="text-sm text-gray-500">No Jira data available</div>
      </div>
    );
  }
  const labels = data.tasks.map((t) => t.task_name);

  // Start offsets (days since project start) and durations
  const projectStart = Math.min(...data.tasks.map((t) => new Date(t.start_date).getTime()));

  const startOffsets = data.tasks.map((t) => Math.round((new Date(t.start_date).getTime() - projectStart) / (1000 * 60 * 60 * 24)));
  const durations = data.tasks.map((t) => Math.max(1, Math.round((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / (1000 * 60 * 60 * 24))));

  const chartData = {
    labels,
    datasets: [
      { label: 'Offset', data: startOffsets, backgroundColor: 'rgba(0,0,0,0)', stack: 'a' },
      { label: 'Planned Duration (days)', data: durations, backgroundColor: '#60A5FA', stack: 'a', borderRadius: 3 },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { grid: { display: false } } },
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-80 flex flex-col overflow-hidden">
      <h4 className="text-sm font-semibold mb-2">Gantt (timeline)</h4>
      <div className="flex-1 min-h-0">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
