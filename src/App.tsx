import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ToastContainer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import ROICalculator from "./pages/ROICalculator";
import ROIReport from "./pages/ROIReport";
import UseCases from "./pages/UseCases";
import VelocityAI from "./pages/VelocityAI";
import Projects from "./pages/Projects";
import ProjectDetailNew from "./pages/ProjectDetailNew";
import DebugNormalization from "./pages/DebugNormalization";
import JiraDashboard from "./pages/JiraDashboard";
import AsanaDashboard from "./pages/AsanaDashboard";
import HubSpotDashboard from "./pages/HubSpotDashboard";
import Microsoft365Dashboard from "./pages/Microsoft365Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/roi-report" element={<ROIReport />} />
            <Route path="/velocity-ai" element={<VelocityAI />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/jira-dashboard" element={<JiraDashboard />} />
            <Route path="/projects/asana-dashboard" element={<AsanaDashboard />} />
            <Route path="/projects/hubspot-dashboard" element={<HubSpotDashboard />} />
            <Route path="/projects/microsoft365-dashboard" element={<Microsoft365Dashboard />} />
            <Route path="/projects/:id" element={<ProjectDetailNew />} />
            <Route path="/debug-normalization" element={<DebugNormalization />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;
