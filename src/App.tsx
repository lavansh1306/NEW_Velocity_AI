import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ToastContainer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Page Imports
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import VelocityAI from "./pages/VelocityAI";
import Projects from "./components/projects/Projects";
import ProjectAnalytics from "./components/projects/ProjectAnalytics";
import ProjectDetailNew from "../archives/ProjectDetailNew";
import JiraDashboard from "./pages/JiraDashboard";
import GlobalGanttDashboard from "./pages/GlobalGanttDashboard";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import People from "./pages/People";
import Plan from "./pages/Plan";
import Leave from "./pages/Leave";
import Settings from "./pages/Settings";
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
import CreateProject from "./components/projects/CreateProject";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProjects from "./pages/employee/EmployeeProjects";
import EmployeeProjectDetail from "./pages/employee/EmployeeProjectDetail";
import EmployeeCapacity from "./pages/employee/EmployeeCapacity";
import EmployeeLeave from "./pages/employee/EmployeeLeave";
import EmployeeProfile from "./pages/employee/EmployeeProfile";

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
                {/* 1. Public Marketing Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/demo" element={<Demo />} />

                {/* 2. Authentication Routes (Must stay outside ProtectedRoute) */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/invite/email" element={<InviteEmail />} />
                <Route path="/invite/accept" element={<SetPassword />} />

                {/* 3. Onboarding Flow (Requires Auth, but no Org yet) */}
                <Route path="/onboarding/mode" element={<ProtectedRoute><OnboardingModeSelection /></ProtectedRoute>} />
                <Route path="/onboarding/join" element={<ProtectedRoute><OnboardingJoin /></ProtectedRoute>} />
                <Route path="/onboarding/welcome" element={<ProtectedRoute><OnboardingWelcome /></ProtectedRoute>} />
                <Route path="/onboarding/team" element={<ProtectedRoute><OnboardingTeam /></ProtectedRoute>} />
                <Route path="/onboarding/settings" element={<ProtectedRoute><OnboardingSettings /></ProtectedRoute>} />
                <Route path="/onboarding/holidays" element={<ProtectedRoute><OnboardingHolidays /></ProtectedRoute>} />
                <Route path="/onboarding/complete" element={<ProtectedRoute><OnboardingComplete /></ProtectedRoute>} />

                {/* 4. Employee/App Sub-routes */}
                <Route path="/app/employee" element={<ProtectedRoute><EmployeeLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="my-projects" element={<EmployeeProjects />} />
                  <Route path="projects/:id" element={<EmployeeProjectDetail />} />
                  <Route path="my-capacity" element={<EmployeeCapacity />} />
                  <Route path="leave" element={<EmployeeLeave />} />
                  <Route path="profile" element={<EmployeeProfile />} />
                </Route>

                {/* 5. Main Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/velocity-ai" element={<ProtectedRoute><VelocityAI /></ProtectedRoute>} />
                <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
                <Route path="/plan" element={<ProtectedRoute><Plan /></ProtectedRoute>} />
                <Route path="/leave" element={<ProtectedRoute><Leave /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/projects/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
                <Route path="/projects/global-gantt" element={<ProtectedRoute><GlobalGanttDashboard /></ProtectedRoute>} />
                <Route path="/projects/jira-dashboard" element={<ProtectedRoute><JiraDashboard /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailNew /></ProtectedRoute>} />
                <Route path="/project-analytics/:id" element={<ProtectedRoute><ProjectAnalytics /></ProtectedRoute>} />

                {/* 6. Fallback */}
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