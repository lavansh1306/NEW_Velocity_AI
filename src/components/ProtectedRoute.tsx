import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, orgLoading, orgId } = useAuth();
  const location = useLocation();

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

  // Authenticated but no org — redirect to onboarding.
  // Exclude onboarding paths themselves to avoid an infinite redirect loop.
  if (!orgId && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding/mode" replace />;
  }

  return <>{children}</>;
};