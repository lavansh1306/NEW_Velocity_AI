import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ToastContainer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import ROICalculator from "./pages/ROICalculator";
import ROIReport from "./pages/ROIReport";
import UseCases from "./pages/UseCases";
import VelocityAI from "./pages/VelocityAI";
import Projects from "./pages/Projects";
import ProjectAnalytics from "./pages/ProjectAnalytics";
import ProjectDetailNew from "./pages/ProjectDetailNew";
import DebugNormalization from "./pages/DebugNormalization";
import JiraDashboard from "./pages/JiraDashboard";
import GlobalGanttDashboard from "./pages/GlobalGanttDashboard";
import PlanMyProject from "./pages/PlanMyProject";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AuditPage from "./pages/Audit";
import OnboardingModeSelection from "./pages/onboarding/OnboardingModeSelection";
import OnboardingJoin from "./pages/onboarding/OnboardingJoin";
import OnboardingWelcome from "./pages/onboarding/OnboardingWelcome";
import OnboardingTeam from "./pages/onboarding/OnboardingTeam";
import OnboardingSettings from "./pages/onboarding/OnboardingSettings";
import OnboardingHolidays from "./pages/onboarding/OnboardingHolidays";
import OnboardingComplete from "./pages/onboarding/OnboardingComplete";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import InviteEmail from "./pages/InviteEmail";
import SetPassword from "./pages/SetPassword";
import CreateProject from "./pages/CreateProject";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <TooltipProvider>
        <AuthProvider>
          <Analytics />
          <Toaster />
          <Sonner />
          <ToastContainer />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <OnboardingProvider>
              <Routes>
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Onboarding Routes (protected - require auth) */}
                <Route path="/onboarding/mode" element={<ProtectedRoute><OnboardingModeSelection /></ProtectedRoute>} />
                <Route path="/onboarding/join" element={<ProtectedRoute><OnboardingJoin /></ProtectedRoute>} />
                <Route path="/onboarding/welcome" element={<ProtectedRoute><OnboardingWelcome /></ProtectedRoute>} />
                <Route path="/onboarding/team" element={<ProtectedRoute><OnboardingTeam /></ProtectedRoute>} />
                <Route path="/onboarding/settings" element={<ProtectedRoute><OnboardingSettings /></ProtectedRoute>} />
                <Route path="/onboarding/holidays" element={<ProtectedRoute><OnboardingHolidays /></ProtectedRoute>} />
                <Route path="/onboarding/complete" element={<ProtectedRoute><OnboardingComplete /></ProtectedRoute>} />

                {/* Invite Routes */}
                <Route path="/invite/email" element={<InviteEmail />} />
                <Route path="/invite/accept" element={<SetPassword />} />

                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/roi-calculator" element={<ROICalculator />} />
                <Route path="/use-cases" element={<UseCases />} />
                <Route path="/roi-report" element={<ROIReport />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/velocity-ai" element={<VelocityAI />} />
                <Route path="/progress" element={<PlanMyProject />} />
                <Route path="/projects" element={<Projects />} />

                {/* 2. Specific/Static Project Routes (MUST be before :id) */}
                <Route path="/projects/create" element={<CreateProject />} />
                <Route path="/projects/global-gantt" element={<GlobalGanttDashboard />} />
                <Route path="/projects/jira-dashboard" element={<JiraDashboard />} />

                {/* 3. Dynamic ID Routes (Catches everything else) */}
                <Route path="/projects/:id" element={<ProjectDetailNew />} />
                <Route path="/project-analytics/:id" element={<ProjectAnalytics />} />

                {/* Utilities */}
                <Route path="/debug-normalization" element={<DebugNormalization />} />
                <Route path="/audit" element={<AuditPage />} />

                {/* Catch-all - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OnboardingProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;