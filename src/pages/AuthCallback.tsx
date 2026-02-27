import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading, orgId } = useAuth();
  const [error, setError] = useState('');
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    // Only redirect once
    if (hasRedirectedRef.current) return;

    console.log('[AuthCallback] Auth check complete');
    console.log('[AuthCallback] User:', user ? 'authenticated' : 'not authenticated');
    console.log('[AuthCallback] OrgId:', orgId);

    if (user) {
      // Check if user has an org — if not, they need onboarding
      const checkOrgAndRedirect = async () => {
        // Give a moment for orgId to resolve from AuthContext
        // If orgId is already set, use it; otherwise query directly
        let hasOrg = !!orgId;

        if (!hasOrg) {
          // Double-check directly from Supabase in case AuthContext hasn't resolved yet
          const { data } = await supabase
            .from('organization_members')
            .select('org_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          hasOrg = !!data?.org_id;
        }

        hasRedirectedRef.current = true;

        if (hasOrg) {
          console.log('[AuthCallback] User has org, redirecting to velocity-ai');
          navigate('/velocity-ai', { replace: true });
        } else {
          console.log('[AuthCallback] New user (no org), redirecting to onboarding');
          navigate('/onboarding/mode', { replace: true });
        }
      };
      checkOrgAndRedirect();
    } else {
      hasRedirectedRef.current = true;
      console.log('[AuthCallback] No user authenticated via OAuth, redirecting to login');
      setError('Authentication failed. Please try again.');
      // Redirect to login page
      navigate('/login', { replace: true });
    }
  }, [loading, user, orgId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
