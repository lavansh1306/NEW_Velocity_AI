import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "@/components/ToastContainer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Demo from "./pages/Demo";
import ROICalculator from "./pages/ROICalculator";
import ROIReport from "./pages/ROIReport";
import UseCases from "./pages/UseCases";
import VelocityAI from "./pages/VelocityAI";
import Projects from "./pages/Projects";
import ProjectDetailNew from "./pages/ProjectDetailNew";
import DebugNormalization from "./pages/DebugNormalization";
import JiraDashboard from "./pages/JiraDashboard";
import JiraEmployeeExtractor from "./pages/JiraEmployeeExtractor";
import AsanaDashboard from "./pages/AsanaDashboard";
import HubSpotDashboard from "./pages/HubSpotDashboard";
import Microsoft365Dashboard from "./pages/Microsoft365Dashboard";
import GlobalGanttDashboard from "./pages/GlobalGanttDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ToastContainer />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={<Index />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/roi-calculator" element={<ROICalculator />} />
              <Route path="/use-cases" element={<UseCases />} />
              <Route path="/roi-report" element={<ROIReport />} />
              
              {/* Protected Routes */}
              <Route path="/velocity-ai" element={<ProtectedRoute><VelocityAI /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/global-gantt" element={<ProtectedRoute><GlobalGanttDashboard /></ProtectedRoute>} />
              <Route path="/projects/jira-dashboard" element={<ProtectedRoute><JiraDashboard /></ProtectedRoute>} />
              <Route path="/projects/jira-employee-extractor" element={<ProtectedRoute><JiraEmployeeExtractor /></ProtectedRoute>} />
              <Route path="/projects/asana-dashboard" element={<ProtectedRoute><AsanaDashboard /></ProtectedRoute>} />
              <Route path="/projects/hubspot-dashboard" element={<ProtectedRoute><HubSpotDashboard /></ProtectedRoute>} />
              <Route path="/projects/microsoft365-dashboard" element={<ProtectedRoute><Microsoft365Dashboard /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailNew /></ProtectedRoute>} />
              <Route path="/debug-normalization" element={<ProtectedRoute><DebugNormalization /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
