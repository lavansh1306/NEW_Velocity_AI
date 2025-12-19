import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import type { MetricsResponse } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip);

export default function AutomationCoverageDonut({ metrics }: { metrics: MetricsResponse | null }) {
  // automationCoverage is a ratio (0-1); convert to percentage
  const percent = Math.round((metrics?.automationCoverage ?? 0) * 100);
  const prevPercent = Math.round((metrics?.automationCoveragePrevious ?? 0) * 100);
  const delta = percent - prevPercent;
  // For the donut we show automated vs manual as complementary slices
  const automated = percent;
  const manual = 100 - percent;

  const data = {
    labels: ['Automated', 'Manual'],
    datasets: [
      {
        data: [automated, manual],
        backgroundColor: ['#10B981', '#E5E7EB'],
        borderWidth: 0,
      },
    ],
  };

  const options: any = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="card h-56 flex flex-col">
      <div className="p-4">
        <h3 className="text-sm font-medium">Automation Coverage</h3>
        <p className="text-xs text-muted-foreground">Percent of tasks automated by AI</p>
      </div>
      <div className="flex-1 min-h-0 p-4 relative">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-semibold">{percent}%</div>
              <div className="text-xs text-muted-foreground">Automated</div>
              {typeof metrics?.automationCoveragePrevious === 'number' && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span className={`mr-1 ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
                  </span>
                  <span className="text-xs text-muted-foreground">from {prevPercent}%</span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
