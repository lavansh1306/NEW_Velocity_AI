import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, orgLoading, orgId } = useAuth();
  const location = useLocation();
  const isOnboardingPath = location.pathname.startsWith('/onboarding');

  if (loading || orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Authenticated but no org — send to onboarding start.
  if (!orgId && !isOnboardingPath) {
    return <Navigate to="/onboarding/mode" replace />;
  }

  // If user has an org and tries to access onboarding, redirect to dashboard.
  // Once signup is complete, users should never return to onboarding screens.
  // Allow /onboarding/complete so the celebration page can still render after final step.
  if (orgId && isOnboardingPath) {
    const allowedOnboardingPaths = ['/onboarding/complete'];
    if (!allowedOnboardingPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};