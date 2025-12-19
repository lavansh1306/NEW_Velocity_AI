import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { TimeTracking } from "@/components/demo/TimeTracking";
import { RedeploymentView } from "@/components/demo/RedeploymentView";
import { ROIMetrics } from "@/components/demo/ROIMetrics";
import { LiveFeed } from "@/components/demo/LiveFeed";

const Demo = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold">Velocity AI Demo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">Live Demo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Workforce Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into productivity gains, resource allocation, and ROI impact
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timesaved">Time Saved</TabsTrigger>
            <TabsTrigger value="redeployment">Redeployment</TabsTrigger>
            <TabsTrigger value="roi">ROI Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="text-2xl font-bold text-primary">847</div>
                <div className="text-sm text-muted-foreground">Hours Saved This Month</div>
                <div className="mt-2 text-xs text-green-600">↑ 23% from last month</div>
              </Card>
              <Card className="p-6">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Active Redeployments</div>
                <div className="mt-2 text-xs text-blue-600">4 high-priority</div>
              </Card>
              <Card className="p-6">
                <div className="text-2xl font-bold text-primary">$284K</div>
                <div className="text-sm text-muted-foreground">Cost Savings (Annual)</div>
                <div className="mt-2 text-xs text-green-600">↑ 18% ROI impact</div>
              </Card>
              <Card className="p-6">
                <div className="text-2xl font-bold text-primary">94%</div>
                <div className="text-sm text-muted-foreground">Allocation Efficiency</div>
                <div className="mt-2 text-xs text-green-600">↑ 12% improvement</div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TimeTracking />
              </div>
              <div>
                <LiveFeed />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timesaved">
            <TimeTracking detailed />
          </TabsContent>

          <TabsContent value="redeployment">
            <RedeploymentView />
          </TabsContent>

          <TabsContent value="roi">
            <ROIMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Demo;
