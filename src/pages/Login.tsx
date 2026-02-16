import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (container: HTMLElement | null, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle, signInWithJira, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Sign in with the credential
      if (response.credential) {
        await signInWithGoogle();
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      // signInWithGoogle() redirects to Google, which redirects back to /
      // After auth, the AuthContext will update and ProtectedRoute will allow access
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleJiraSignIn = () => {
    try {
      setLoading(true);
      setError('');
      // signInWithJira() redirects to Jira OAuth, which redirects back to /velocity-ai
      signInWithJira();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Jira');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/velocity-ai');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to log in';
      // Check for email confirmation error
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
        setError('Please confirm your email address first. Check your inbox (including spam folder) for the confirmation email.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-light p-4">
      <div className="bg-white rounded-2xl p-12 w-full max-w-md shadow-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-light text-sm">V</span>
            </div>
            <span className="text-xl font-light text-gray-900">Velocity AI</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-light text-gray-900 text-center mb-8 tracking-tight">
          Welcome to Velocity AI
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="font-light text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 mb-8">
          <div>
            <Label htmlFor="email" className="text-sm font-light text-gray-600 mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={loading}
              className="h-11 rounded-xl border-gray-200 border font-light placeholder:font-light"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-light text-gray-600 mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="h-11 rounded-xl border-gray-200 border font-light placeholder:font-light"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-light rounded-xl"
          >
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 font-light">OR</span>
          </div>
        </div>

        {/* Alternative Sign In */}
        <div className="space-y-3 mb-8">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || authLoading}
            variant="outline"
            className="w-full h-11 rounded-xl border-gray-200 border font-light"
          >
            Continue with Google
          </Button>
          <Button
            type="button"
            onClick={handleJiraSignIn}
            disabled={loading || authLoading}
            variant="outline"
            className="w-full h-11 rounded-xl border-gray-200 border font-light"
          >
            Continue with Jira
          </Button>
        </div>

        {/* Create Account */}
        <div className="text-center">
          <Link to="/signup" className="text-sm text-primary hover:text-primary/90 font-light">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
