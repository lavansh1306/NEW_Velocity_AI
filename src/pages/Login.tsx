import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Quote } from 'lucide-react';

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
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
        setError('Please confirm your email address first. Check your inbox.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* LEFT PANEL - BRANDING (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        {/* Abstract Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[128px]"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-600/20 blur-[128px]"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg shadow-fuchsia-500/20">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Velocity <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">AI</span>
          </span>
        </div>

        {/* Value Proposition / Testimonial */}
        <div className="relative z-10 max-w-lg">
          <Quote className="h-12 w-12 text-white/20 mb-6" />
          <h2 className="mb-6 text-4xl font-black leading-tight text-white">
            Turn workforce chaos into clarity.
          </h2>
          <p className="text-lg font-medium text-slate-400">
            "Velocity AI completely changed how we deploy our engineering teams. What used to take 3 days of spreadsheet math now happens instantly."
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white">
              JD
            </div>
            <div>
              <p className="text-sm font-bold text-white">Jane Doe</p>
              <p className="text-xs font-medium text-slate-400">VP of Engineering, TechFlow</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - AUTH FORM */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Velocity <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">AI</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Enter your credentials to access your workspace.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {/* Social Auth Buttons */}
          <div className="mb-8 grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || authLoading}
              variant="outline"
              className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              type="button"
              onClick={handleJiraSignIn}
              disabled={loading || authLoading}
              variant="outline"
              className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path d="M112.565 67.587c-17.72 17.753-17.72 46.541 0 64.283 17.712 17.741 46.46 17.741 64.181 0L247.96 60.672c8.473-8.474 8.473-22.258 0-30.743L225.86 7.842c-8.474-8.475-22.213-8.475-30.71 0L112.565 67.587z" fill="#2684FF"/>
                <path d="M21.577 158.46c-17.741 17.73-17.741 46.495 0 64.237 17.72 17.731 46.493 17.731 64.214 0l71.213-71.198c8.474-8.474 8.474-22.247 0-30.72L134.906 98.67c-8.486-8.475-22.225-8.475-30.72 0L21.577 158.46z" fill="#2684FF"/>
                <path d="M67.06 67.587c-17.73-17.73-46.494-17.73-64.214 0-17.742 17.741-17.742 46.54 0 64.283L74.06 203.067c8.473 8.474 22.224 8.474 30.72 0l22.098-22.087c8.474-8.474 8.474-22.246 0-30.72L67.06 67.587z" fill="#0052CC"/>
              </svg>
              Jira
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                disabled={loading}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-fuchsia-500 focus-visible:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                <Link to="#" className="text-xs font-bold text-slate-500 hover:text-fuchsia-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-fuchsia-500 focus-visible:bg-white transition-all shadow-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-slate-900 hover:text-fuchsia-600 transition-colors underline underline-offset-4 decoration-slate-300 hover:decoration-fuchsia-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}