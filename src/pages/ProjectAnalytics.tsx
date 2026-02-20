import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import { loadProjects, loadMetrics, type ProjectItem } from '@/lib/dataService';
import { Button } from '@/components/ui/button';

export default function ProjectAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const projects = await loadProjects();
        const targetProject = projects.find(p => p.id === decodeURIComponent(id));
        
        if (targetProject) {
          setProject(targetProject);
          const metricsData = await loadMetrics(targetProject.id);
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error('Error loading project analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleReturn = () => {
    const returnPage = localStorage.getItem('returnPage') || '/projects';
    localStorage.removeItem('returnPage');
    navigate(returnPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-light">Loading project analytics...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-12">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleReturn}
            variant="outline"
            className="gap-2 mb-6 font-light rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Projects
          </Button>
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <p className="text-gray-500 font-light">Project not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-12">
      <div className="max-w-7xl mx-auto">
        {/* Return Button */}
        <Button
          onClick={handleReturn}
          variant="outline"
          className="gap-2 mb-8 font-light rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Projects
        </Button>

        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2 tracking-tight">{project.title}</h1>
          <p className="text-gray-600 font-light">Project Analytics and Insights</p>
        </div>

        {/* Analytics Panel */}
        {metrics && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <AnalyticsPanel projectId={project.id} projectName={project.title} />
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-light text-gray-600 mb-2">Project Status</p>
            <p className="text-2xl font-semibold text-blue-600">
              {metrics?.status || 'Active'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-light text-gray-600 mb-2">Team Size</p>
            <p className="text-2xl font-semibold text-indigo-600">
              {metrics?.team?.length || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-light text-gray-600 mb-2">Tasks Completed</p>
            <p className="text-2xl font-semibold text-green-600">
              {metrics?.completedCount || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-light text-gray-600 mb-2">Total Tasks</p>
            <p className="text-2xl font-semibold text-purple-600">
              {metrics?.totalCount || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
