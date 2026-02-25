import { AIInsightsDashboard, ProjectDashboardWithInsights } from '@/components/dashboard';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-[1600px] mx-auto px-12 py-4">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 rounded-lg">
              <TabsTrigger value="overview" className="rounded-md">
                Overview
              </TabsTrigger>
              <TabsTrigger value="project" className="rounded-md">
                Project Details
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview" className="m-0">
          <AIInsightsDashboard />
        </TabsContent>

        <TabsContent value="project" className="m-0">
          <ProjectDashboardWithInsights projectId="1" projectName="Velocity AI Platform Redesign" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
