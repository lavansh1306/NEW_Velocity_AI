import { AIInsightsDashboard, ProjectDashboardWithInsights } from '@/components/dashboard';
import { useState, useEffect } from 'react';

/**
 * EXAMPLE 1: Using AIInsightsDashboard standalone
 */
export const BasicDashboardExample = () => {
  return <AIInsightsDashboard />;
};

/**
 * EXAMPLE 2: Using ProjectDashboardWithInsights for a specific project
 */
export const ProjectDashboardExample = () => {
  return (
    <ProjectDashboardWithInsights
      projectId="project-123"
      projectName="Mobile App Redesign"
    />
  );
};

/**
 * EXAMPLE 3: Dashboard with data fetching
 */
export const DashboardWithDataFetching = () => {
  const [capacityData, setCapacityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCapacityData([
        { week: 'Week 1', utilization: 85, available: 120 },
        { week: 'Week 2', utilization: 92, available: 96 },
        { week: 'Week 3', utilization: 78, available: 168 },
        { week: 'Week 4', utilization: 110, available: 48 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return <AIInsightsDashboard />;
};

/**
 * EXAMPLE 4: Multiple projects view
 */
export const MultiProjectDashboard = () => {
  const projects = [
    { id: '1', name: 'Platform Redesign' },
    { id: '2', name: 'Mobile App MVP' },
    { id: '3', name: 'API Documentation' },
  ];

  const [selectedProject, setSelectedProject] = useState(projects[0]);

  return (
    <div>
      <div className="p-6 bg-white border-b">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-2xl font-light mb-4">Projects</h1>
          <div className="flex gap-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`px-4 py-2 rounded-lg ${
                  selectedProject.id === project.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ProjectDashboardWithInsights
        projectId={selectedProject.id}
        projectName={selectedProject.name}
      />
    </div>
  );
};

/**
 * EXAMPLE 5: Dashboard with custom styling
 */
export const StyledDashboardExample = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Custom header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-12 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
          <p className="text-gray-500 mt-2">Real-time project and capacity insights</p>
        </div>
      </div>

      {/* Dashboard content */}
      <AIInsightsDashboard />
    </div>
  );
};

/**
 * EXAMPLE 6: Responsive mobile-friendly dashboard
 */
export const ResponsiveDashboardExample = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      {isMobile ? (
        <div className="p-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg mb-4">
                    💡 For best experience, view on desktop (1200px+)
          </div>
          <AIInsightsDashboard />
        </div>
      ) : (
        <AIInsightsDashboard />
      )}
    </div>
  );
};

/**
 * EXAMPLE 7: Dashboard in a modal/overlay
 */
export const DashboardModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-light">Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-12">
          <AIInsightsDashboard />
        </div>
      </div>
    </div>
  );
};

/**
 * EXAMPLE 8: Integrating with existing Layout
 */
export function DashboardInLayout() {
  // Assume you have a Layout component
  return (
    <main>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Velocity AI Dashboard</h1>
        </div>
      </header>

      <section className="max-w-7xl mx-auto">
        <AIInsightsDashboard />
      </section>

      <footer className="bg-gray-50 border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2026 Velocity AI. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

/**
 * EXAMPLE 9: Dashboard with real-time updates
 */
export const RealtimeDashboard = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
      <AIInsightsDashboard />
    </div>
  );
};

/**
 * EXAMPLE 10: Dashboard with filters and controls
 */
export const FilteredDashboard = () => {
  const [team, setTeam] = useState('all');
  const [dateRange, setDateRange] = useState('month');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Filter Controls */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-light text-gray-600 mb-2">
              Team
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Teams</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="devops">DevOps</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-gray-600 mb-2">
              Time Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-light text-gray-600 mb-2">
              &nbsp;
            </label>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Apply Filters
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-sm text-gray-600 font-light">
          Showing data for: <strong>{team}</strong> • Period: <strong>{dateRange}</strong>
        </div>
      </div>

      {/* Dashboard */}
      <AIInsightsDashboard />
    </div>
  );
};

/**
 * Export all examples
 */
export default {
  BasicDashboardExample,
  ProjectDashboardExample,
  DashboardWithDataFetching,
  MultiProjectDashboard,
  StyledDashboardExample,
  ResponsiveDashboardExample,
  DashboardModal,
  DashboardInLayout,
  RealtimeDashboard,
  FilteredDashboard,
};
