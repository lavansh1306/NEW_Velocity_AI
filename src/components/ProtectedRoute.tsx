import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSupabaseAuth?: boolean; // Set to true to require Supabase auth (not just JIRA)
}

export const ProtectedRoute = ({ children, requireSupabaseAuth = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isJiraConnected, setIsJiraConnected] = useState<boolean | null>(null);

  // Check if user has Jira authentication
  useEffect(() => {
    const checkJiraAuth = async () => {
      try {
        const response = await fetch('/api/jira/auth/status', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json() as any;
          setIsJiraConnected(data?.connected === true);
        } else {
          setIsJiraConnected(false);
        }
      } catch (err) {
        console.warn('[ProtectedRoute] Failed to check Jira auth:', err);
        setIsJiraConnected(false);
      }
    };

    if (!loading) {
      checkJiraAuth();
    }
  }, [loading]);

  // Show loading while checking auth
  if (loading || isJiraConnected === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C1917] mx-auto mb-4"></div>
          <p className="text-[#78716C]">Loading...</p>
        </div>
      </div>
    );
  }

  // If Supabase auth is required, check for user
  if (requireSupabaseAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // For other routes, allow either Supabase auth OR Jira auth
  if (!user && !isJiraConnected) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
