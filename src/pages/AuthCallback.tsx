import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    console.log('[AuthCallback] 1. Component mounted');
    console.log('[AuthCallback] 2. Current URL:', window.location.href);
    console.log('[AuthCallback] 3. URL hash:', window.location.hash);
    console.log('[AuthCallback] 4. URL search:', window.location.search);
    
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    console.log('[AuthCallback] 5. Query params:', Object.fromEntries(urlParams));
    console.log('[AuthCallback] 6. Hash params:', Object.fromEntries(hashParams));
    
    // Check for OAuth error/code
    const authCode = urlParams.get('code');
    const authError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (authError) {
      console.error('[AuthCallback] OAUTH ERROR DETECTED:', {
        error: authError,
        description: errorDescription,
        fullUrl: window.location.href
      });
    }
    
    if (authCode) {
      console.log('[AuthCallback] Auth code detected:', authCode.substring(0, 20) + '...');
    }

    // Listen for auth state changes (OAuth redirects trigger SIGNED_IN event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthCallback] 7. Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          timestamp: new Date().toISOString()
        });

        if (event === 'PASSWORD_RESET') {
          console.log('[AuthCallback] PASSWORD_RESET event detected, redirecting to /reset-password');
          navigate('/reset-password', { replace: true });
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          if (hasProcessed.current) {
            console.warn('[AuthCallback] Already processed this auth state, skipping...');
            return;
          }
          hasProcessed.current = true;

          console.log('[AuthCallback] 8. SIGNED_IN detected, processing user...');

          try {
            // Get user org info
            console.log('[AuthCallback] 9. Querying users table for org info...');
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('organization_id, role')
              .eq('id', session.user.id)
              .maybeSingle();

            console.log('[AuthCallback] 10. Query result:', {
              hasData: !!userData,
              organizationId: userData?.organization_id,
              role: userData?.role,
              error: userError?.message
            });

            if (userError) {
              console.error('[AuthCallback] DB Error:', userError.message);
              navigate('/onboarding/mode', { replace: true });
              return;
            }

            // Route based on org membership and role
            if (userData?.organization_id) {
              console.log(`[AuthCallback] 11. User has org: ${userData.organization_id}, role: ${userData.role}`);
              
              const role = userData.role?.toLowerCase();
              if (role === 'employee' || role === 'member') {
                console.log('[AuthCallback] 12. Redirecting to /app/employee/dashboard');
                navigate('/app/employee/dashboard', { replace: true });
              } else {
                console.log('[AuthCallback] 12. Redirecting to /dashboard');
                navigate('/dashboard', { replace: true });
              }
            } else {
              console.log('[AuthCallback] 11. New user (no org)');
              console.log('[AuthCallback] 12. Redirecting to /onboarding/mode');
              navigate('/onboarding/mode', { replace: true });
            }
          } catch (err) {
            console.error('[AuthCallback] CRITICAL ERROR:', {
              message: (err as any).message,
              stack: (err as any).stack,
              timestamp: new Date().toISOString()
            });
            navigate('/onboarding/mode', { replace: true });
          }
        } else if (event === 'INITIAL_SESSION') {
          console.log('[AuthCallback] Initial session check:', { sessionExists: !!session });
          
          if (!session) {
            // User wasn't signed in - timeout and redirect to login
            console.error('[AuthCallback] CRITICAL: No session on initial check!');
            console.error('[AuthCallback] This means Supabase did NOT process the OAuth response.');
            console.error('[AuthCallback] Likely causes:');
            console.error('  1. Redirect URI NOT configured in Supabase Dashboard');
            console.error('  2. Wrong VITE_SUPABASE_URL in .env');
            console.error('  3. Google OAuth app misconfigured');
            console.error('  4. Network/CORS issue');
            console.log('[AuthCallback] Setting 2s timeout to redirect to login...');
            
            timeout = setTimeout(() => {
              if (!hasProcessed.current) {
                console.error('[AuthCallback] TIMEOUT: No session received from OAuth after 2s');
                navigate('/login', { replace: true });
              }
            }, 2000);
          }
        } else {
          console.log('[AuthCallback] Other auth event:', event);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe();
      console.log('[AuthCallback] Component cleanup');
    };
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
        <p className="text-stone-500 font-medium animate-pulse">Establishing secure session...</p>
      </div>
    </div>
  );
}