import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[AuthCallback] Page mounted');
    console.log('[AuthCallback] Loading:', loading);
    console.log('[AuthCallback] User:', user);

    // Wait a bit for Supabase to process the OAuth callback
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          console.log('[AuthCallback] User authenticated, redirecting to home');
          navigate('/', { replace: true });
        } else {
          console.log('[AuthCallback] No user found, redirecting to login');
          setError('Authentication failed. Please try again.');
          navigate('/login', { replace: true });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
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
