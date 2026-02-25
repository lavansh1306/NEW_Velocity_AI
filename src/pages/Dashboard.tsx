import { MainDashboard, ProjectDashboardWithInsights } from '@/components/dashboard';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <div className="border-b border-[#E7E5E4] bg-white/70 backdrop-blur-[32px] sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-12 py-4">
            <TabsList className="bg-transparent p-0 gap-8 h-auto rounded-none border-b border-[#E7E5E4]">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-[#1C1917] data-[state=active]:border-b-2 data-[state=active]:border-[#1C1917] rounded-none px-0 font-light text-[#78716C] hover:text-[#1C1917]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="project" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-[#1C1917] data-[state=active]:border-b-2 data-[state=active]:border-[#1C1917] rounded-none px-0 font-light text-[#78716C] hover:text-[#1C1917]"
              >
                Project Details
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview" className="m-0">
          <MainDashboard />
        </TabsContent>

        <TabsContent value="project" className="m-0">
          <ProjectDashboardWithInsights projectId="1" projectName="Velocity AI Platform Redesign" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
