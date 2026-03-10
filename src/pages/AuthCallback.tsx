import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (hasProcessed.current) return;
      
      // 1. Force grab the session from the URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("[AuthCallback] Session not found:", sessionError);
        navigate('/login', { replace: true });
        return;
      }

      hasProcessed.current = true;

      // 2. QUERY YOUR ACTUAL SCHEMA: Use 'users' table as per your SQL
      // We look for 'organization_id' which is your source of truth
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userError) {
        console.error("[AuthCallback] DB Error (Schema Mismatch):", userError);
        // If the query fails (404/406), we still need to decide where to go
        // Most safe bet for a logged-in user with no record is onboarding
        navigate('/onboarding/mode', { replace: true });
        return;
      }

      // 3. Routing Logic
      if (userData?.organization_id) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding/mode', { replace: true });
      }
    };

    handleAuth();
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