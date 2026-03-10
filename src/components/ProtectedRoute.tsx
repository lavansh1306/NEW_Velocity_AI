import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If we are still loading the session, DO NOT redirect. 
  // Stay on the loading screen.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // Only redirect to landing page if loading is 100% done and no user exists.
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};