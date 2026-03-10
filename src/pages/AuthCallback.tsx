import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (hasRedirectedRef.current) return;

      try {
        // Force a session refresh to catch the URL tokens immediately
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          hasRedirectedRef.current = true;
          const user = session.user;

          // Check for Organization membership directly in Supabase
          const { data: membership, error: orgError } = await supabase
            .from('organization_members')
            .select('org_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (orgError) console.error('[AuthCallback] Org check error:', orgError);

          if (membership?.org_id) {
            console.log('[AuthCallback] Member found, entering dashboard');
            navigate('/dashboard', { replace: true });
          } else {
            console.log('[AuthCallback] No org found, starting onboarding');
            navigate('/onboarding/mode', { replace: true });
          }
        } else if (!authLoading) {
          // If loading finished and still no session, go to login
          navigate('/login', { replace: true });
        }
      } catch (err: any) {
        console.error('[AuthCallback] Error:', err.message);
        setError(err.message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuth();
  }, [authLoading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAFAF9]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C1917] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-[#1C1917]">Finalizing Login</h2>
        <p className="text-[#78716C] mt-2">Syncing your workspace profile...</p>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
}


// import { useEffect, useState, useRef } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { supabase } from '@/lib/supabase';

// export default function AuthCallback() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { loading: authLoading, orgId } = useAuth(); // rename loading to avoid confusion
//   const [error, setError] = useState('');
//   const [processing, setProcessing] = useState(true);
//   const hasRedirectedRef = useRef(false);

//   const isJiraCallback = searchParams.get('jira') === 'true';

//   useEffect(() => {
//     const handleAuthAction = async () => {
//       // 1. Wait for Supabase to actually parse the session from the URL hash/query
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();

//       if (sessionError) {
//         console.error('[AuthCallback] Session error:', sessionError);
//         setError('Failed to retrieve session.');
//         setProcessing(false);
//         return;
//       }

//       // 2. If no session exists yet, we might be too early. 
//       // But if authLoading is done and still no session, it failed.
//       if (!session && !authLoading) {
//         console.log('[AuthCallback] No session found, redirecting to login');
//         navigate('/login', { replace: true });
//         return;
//       }

//       if (session?.user && !hasRedirectedRef.current) {
//         hasRedirectedRef.current = true;
//         const user = session.user;

//         // Jira specific logic
//         if (isJiraCallback) {
//           console.log('[AuthCallback] JIRA detected, heading to dashboard');
//           navigate('/dashboard', { replace: true });
//           return;
//         }

//         // Organization Check logic
//         try {
//           // We query directly to bypass any delay in the AuthContext provider
//           const { data: membership, error: orgError } = await supabase
//             .from('organization_members')
//             .select('org_id')
//             .eq('user_id', user.id)
//             .maybeSingle();

//           if (membership?.org_id) {
//             console.log('[AuthCallback] Org found, dashboard bound');
//             navigate('/dashboard', { replace: true });
//           } else {
//             console.log('[AuthCallback] No org, onboarding bound');
//             navigate('/onboarding/mode', { replace: true });
//           }
//         } catch (err) {
//           console.error('[AuthCallback] Org lookup failed:', err);
//           navigate('/onboarding/mode', { replace: true }); // Fallback to onboarding
//         }
//       }
//     };

//     handleAuthAction();
//   }, [authLoading, navigate, isJiraCallback]);

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-white">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C1917] mx-auto mb-4"></div>
//         <h2 className="text-xl font-semibold text-[#1C1917]">Authenticating...</h2>
//         <p className="text-[#78716C] mt-2">Please wait while we set up your workspace.</p>
//         {error && <p className="text-red-600 mt-4 font-medium">{error}</p>}
//       </div>
//     </div>
//   );
// }