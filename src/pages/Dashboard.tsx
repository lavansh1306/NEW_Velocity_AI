import { AIInsightsDashboard, ProjectDashboardWithInsights } from '@/components/dashboard';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
            <div className="max-w-[1600px] mx-auto px-12 py-4">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-white rounded-lg border border-[#E7E5E4]">
                <TabsTrigger value="overview" className="rounded-md">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="project" className="rounded-md">
                  Projects
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
    </VelocityAISidebar>
  );
};

export default DashboardPage;
