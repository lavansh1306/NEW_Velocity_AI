import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    // Only redirect once
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    console.log('[AuthCallback] Auth check complete');
    console.log('[AuthCallback] User:', user ? 'authenticated' : 'not authenticated');

    if (user) {
      console.log('[AuthCallback] Redirecting to home');
      navigate('/', { replace: true });
    } else {
      console.log('[AuthCallback] No user, redirecting to home');
      setError('Authentication failed. Please try again.');
      // Redirect to home (public page) instead of /login which doesn't exist
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
